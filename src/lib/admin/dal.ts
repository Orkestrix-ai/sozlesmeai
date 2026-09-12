import "server-only";

import { cache } from "react";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { DbError } from "@/lib/db/errors";
import { CREDIT_PRICE_TRY, costTryOf, type TokenTotals } from "@/lib/billing/rates";
import type { Database } from "@/lib/supabase/types";

type ContractStatus = Database["public"]["Enums"]["contract_status"];

/** Sayfa kapısı — admin olmayan kullanıcıyı sessizce dashboard'a döndürür
 * (design.md §9: "açık erişim değil, rol tabanlı yetki mesajları" — burada
 * mesaj bile göstermeden yönlendirmek, admin ekranlarının varlığını sızdırmaz). */
export const requirePlatformAdmin = cache(async () => {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    redirect({ href: "/dashboard", locale: (await getLocale()) as AppLocale });
  }

  return { userId };
});

/** Yönlendirmeyen hali — normal dashboard'da "Admin paneli" bağlantısını
 * koşullu göstermek için (bkz. settings/page.tsx). */
export const isPlatformAdmin = cache(async () => {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
});

/**
 * Kullanıcı listesi + kişisel workspace'inin kredi bakiyesi.
 *
 * İki sorgu, çünkü PostgREST `profiles` -> `workspaces` embed'i YAPAMAZ:
 * `workspaces.owner_id` FK'si `auth.users`'a bakar, `profiles`'a değil.
 * Eşleme `owner_id` üzerinden JS'te yapılıyor.
 *
 * `personalWorkspaceId` bilerek nullable: kredi workspace'te tutulduğu için
 * kişisel workspace'i olmayan bir profil satırı (veri kayması) kredilenemez —
 * çağıran taraf düğmeyi gizler, sayfa çökmez.
 */
export const getAdminUsers = cache(async () => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, locale, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new DbError("admin/dal:getAdminUsers", error);

  const { data: personal, error: personalError } = await supabase
    .from("workspaces")
    .select("id, owner_id, workspace_credits(balance)")
    .eq("is_personal", true);

  if (personalError) throw new DbError("admin/dal:getAdminUsers:workspaces", personalError);

  const byOwner = new Map(
    (personal ?? []).map((w) => [w.owner_id, { id: w.id, balance: w.workspace_credits?.balance ?? 0 }]),
  );

  return (data ?? []).map((u) => {
    const workspace = byOwner.get(u.id);
    return {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      locale: u.locale,
      createdAt: u.created_at,
      personalWorkspaceId: workspace?.id ?? null,
      balance: workspace?.balance ?? 0,
    };
  });
});

export const getAdminWorkspaces = cache(async () => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select(
      "id, name, is_personal, created_at, workspace_credits(balance), workspace_members(user_id)",
    )
    .order("created_at", { ascending: false });

  if (error) throw new DbError("admin/dal:getAdminWorkspaces", error);

  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    isPersonal: w.is_personal,
    createdAt: w.created_at,
    balance: w.workspace_credits?.balance ?? 0,
    memberCount: w.workspace_members?.length ?? 0,
  }));
});

/**
 * Doğrudan tablo sayımı YERİNE bir RPC kullanılır: contract_versions ve
 * contract_messages'ta admin için genel bir SELECT politikası BİLEREK yok
 * (design.md §9 — "belge içerikleri için açık erişim değil"). Düz bir
 * count(head:true) admin'in yalnızca KENDİ workspace'lerini sayar, platform
 * genelini sessizce eksik gösterirdi. admin_usage_stats() yalnızca SAYI
 * döndürür, hiçbir satır/metin sızdırmaz.
 */
export const getAdminUsageStats = cache(async () => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_usage_stats");
  if (error) throw new DbError("admin/dal:getAdminUsageStats", error);
  const row = data?.[0];

  return {
    totalUsers: row?.total_users ?? 0,
    totalWorkspaces: row?.total_workspaces ?? 0,
    totalContracts: row?.total_contracts ?? 0,
    totalVersions: row?.total_versions ?? 0,
    totalMessages: row?.total_messages ?? 0,
    creditsConsumed: row?.credits_consumed ?? 0,
  };
});

/**
 * Aktör/çalışma alanı adlarını JS'te eşlemek için ortak yardımcılar.
 *
 * PostgREST embed'i burada ÇALIŞMAZ: `credit_ledger.actor_id` ve
 * `admin_audit_log.actor_id` append-only kuralı gereği FK'siz düz uuid
 * (20260908110000 — silinen bir profil geçmiş bir defter satırını yeniden
 * yazmasın diye), `contracts.created_by` ise `auth.users`'a bakar,
 * `profiles`'a değil. Üçünde de embed sözdizimi hata verir; çözüm ayrı
 * sorgu + Map — getAdminUsers'daki kalıbın aynısı.
 */
type AdminClient = Awaited<ReturnType<typeof createClient>>;

async function profileNames(supabase: AdminClient, ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return new Map<string, string>();

  const { data, error } = await supabase.from("profiles").select("id, full_name, email").in("id", unique);
  if (error) throw new DbError("admin/dal:profileNames", error);

  return new Map((data ?? []).map((p) => [p.id, p.full_name || p.email] as const));
}

type WorkspaceLabel = { name: string; isPersonal: boolean };

async function workspaceLabels(supabase: AdminClient, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<string, WorkspaceLabel>();

  const { data, error } = await supabase.from("workspaces").select("id, name, is_personal").in("id", unique);
  if (error) throw new DbError("admin/dal:workspaceLabels", error);

  return new Map((data ?? []).map((w) => [w.id, { name: w.name, isPersonal: w.is_personal }] as const));
}

/**
 * Platform geneli sözleşme listesi — yalnızca ÜST VERİ.
 *
 * `contracts` admin'e RLS ile açık (20260907190000:75), ama `contract_versions`
 * ve `contract_messages` BİLEREK kapalı (design.md §9 "belge içerikleri için
 * açık erişim değil"). Bu yüzden çağıran ekran satırları `/contracts/[id]`'ye
 * BAĞLAMAMALI: o sayfa admin için sözleşmeyi bulur ama sürümleri ve rolü
 * bulamaz, yani boş/bozuk bir ekran açılır.
 */
export const getAdminContracts = cache(async () => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("id, title, contract_type, status, archived_at, updated_at, workspace_id, created_by")
    .order("updated_at", { ascending: false });

  if (error) throw new DbError("admin/dal:getAdminContracts", error);
  const rows = data ?? [];

  const [owners, workspaces] = await Promise.all([
    profileNames(supabase, rows.map((r) => r.created_by)),
    workspaceLabels(supabase, rows.map((r) => r.workspace_id)),
  ]);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    contractType: row.contract_type,
    status: row.status,
    isArchived: row.archived_at !== null,
    updatedAt: row.updated_at,
    ownerName: row.created_by ? (owners.get(row.created_by) ?? null) : null,
    workspace: workspaces.get(row.workspace_id) ?? null,
  }));
});

/**
 * Sözleşme durum dağılımı.
 *
 * ÖDÜN: doğrusu `count(*) ... group by status` yapan bir RPC'dir, ama o yeni
 * bir migration demek ve bu ekran bilerek migration'sız yapıldı. Bugünkü
 * hacimde (bkz. admin_usage_stats.total_contracts) sorun değil; birkaç bin
 * sözleşmeden sonra `admin_usage_stats()`'a bir `status_counts jsonb`
 * eklenmeli ve burası ona bağlanmalı.
 */
export const getAdminContractStatusCounts = cache(async () => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.from("contracts").select("status");
  if (error) throw new DbError("admin/dal:getAdminContractStatusCounts", error);

  const counts = new Map<ContractStatus, number>();
  for (const row of data ?? []) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  return counts;
});

/**
 * Platform geneli kredi defteri. `credit_ledger` de admin'e RLS ile açık
 * (20260907190000:72) ama bugüne dek hiçbir ekran okumuyordu — admin yalnızca
 * admin_usage_stats()'ın topladığı TEK sayıyı görebiliyordu.
 *
 * `idempotency_key` bilerek seçilmez: operasyonel bir değeri yok.
 */
export const getAdminCreditLedger = cache(async (limit = 100) => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credit_ledger")
    .select("id, workspace_id, actor_id, entry_type, amount, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new DbError("admin/dal:getAdminCreditLedger", error);
  const rows = data ?? [];

  const [actors, workspaces] = await Promise.all([
    profileNames(supabase, rows.map((r) => r.actor_id)),
    workspaceLabels(supabase, rows.map((r) => r.workspace_id)),
  ]);

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    entryType: row.entry_type,
    amount: row.amount,
    reason: row.reason,
    actorName: row.actor_id ? (actors.get(row.actor_id) ?? null) : null,
    workspace: workspaces.get(row.workspace_id) ?? null,
  }));
});

/**
 * `detail` (jsonb) de seçilir: `admin_add_credits` oraya {amount} yazıyor ve
 * o sayı olmadan "kredi eklendi" satırı kaç kredi olduğunu söylemiyordu.
 *
 * `actorName` null dönebilir — `actor_id` FK'siz düz uuid olduğundan profili
 * silinmiş bir aktörün adı çözülemez; çağıran taraf kısaltılmış UUID'ye düşer.
 */
export const getAdminAuditLog = cache(async (limit = 50) => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, actor_id, action, resource_type, resource_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new DbError("admin/dal:getAdminAuditLog", error);
  const rows = data ?? [];

  const actors = await profileNames(supabase, rows.map((r) => r.actor_id));

  return rows.map((row) => ({
    ...row,
    actorName: row.actor_id ? (actors.get(row.actor_id) ?? null) : null,
  }));
});

/**
 * Gelir / API gideri / net — yönetim panelindeki KPI şeridi.
 *
 * GELİR BURADA TAHSİLAT DEĞİL. Ödeme sağlayıcısı yok (bkz. CLAUDE.md "Açık
 * maddeler"); krediler `admin_add_credits` ile bedelsiz veriliyor. Bu rakam
 * TÜKETİLEN krediden türetilen *tahakkuk eden hizmet bedeli*: 1 kredi = 1 PDF
 * = 1 sözleşme. Arayüz bunu açıkça böyle etiketler — arkasında para olmayan
 * bir sayıyı "gelir" diye göstermek yanlış kesinlik olurdu.
 *
 * `costTry` null olabilir: model birim fiyatları veya USD→TRY kuru
 * src/lib/billing/rates.ts'te hâlâ placeholder ise maliyet UYDURULMAZ
 * (bkz. costTryOf). Token sayıları her durumda gerçektir.
 */
export const getAdminFinancials = cache(async (windowDays = 30) => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  // Tüketilen kredi: getCreditsSpent (src/lib/dal.ts) ile aynı mantık, ama
  // workspace filtresi olmadan. Satır sayısı = üretilen PDF sayısı, yani
  // toplamayı JS'te yapmak burada güvenli.
  const consumedPromise = supabase
    .from("credit_ledger")
    .select("amount")
    .eq("entry_type", "consume")
    .gte("created_at", since);

  const usagePromise = supabase.rpc("admin_llm_usage_summary", { p_since: since });

  const [{ data: consumed, error: consumedError }, { data: usage, error: usageError }] =
    await Promise.all([consumedPromise, usagePromise]);

  if (consumedError) throw new DbError("admin/dal:getAdminFinancials:credits", consumedError);
  if (usageError) throw new DbError("admin/dal:getAdminFinancials:usage", usageError);

  const creditsConsumed = (consumed ?? []).reduce((sum, row) => sum + Math.abs(row.amount), 0);

  const totals: TokenTotals[] = (usage ?? []).map((row) => ({
    provider: row.provider,
    model: row.model,
    calls: Number(row.calls),
    inputTokens: Number(row.input_tokens),
    outputTokens: Number(row.output_tokens),
    cachedInputTokens: Number(row.cached_input_tokens),
  }));

  const revenueTry = creditsConsumed * CREDIT_PRICE_TRY;
  const costTry = costTryOf(totals);

  const calls = totals.reduce((sum, t) => sum + t.calls, 0);
  const tokens = totals.reduce((sum, t) => sum + t.inputTokens + t.outputTokens + t.cachedInputTokens, 0);

  return {
    windowDays,
    creditsConsumed,
    revenueTry,
    costTry,
    netTry: costTry === null ? null : revenueTry - costTry,
    calls,
    tokens,
    /** Hiç ölçüm yoksa arayüz "₺0" değil, "ölçüm bu tarihten başlıyor" gösterir. */
    hasData: creditsConsumed > 0 || calls > 0,
    /** Fiyatlar placeholder — maliyet ve net hesaplanamıyor. */
    ratesMissing: costTry === null,
  };
});
