import "server-only";

import { cache } from "react";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { DbError } from "@/lib/db/errors";

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

export const getAdminAuditLog = cache(async (limit = 50) => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, actor_id, action, resource_type, resource_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new DbError("admin/dal:getAdminAuditLog", error);
  return data ?? [];
});
