import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { DbError } from "@/lib/db/errors";

type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];
type ContractStatus = Database["public"]["Enums"]["contract_status"];

export const ACTIVE_WORKSPACE_COOKIE = "active_workspace";

/**
 * Data Access Layer — Next.js authentication rehberinin tavsiyesi: auth
 * kontrolü layout'ta değil, veriye komşu burada yapılır. Layout'lar istemci
 * tarafı gezinmede yeniden render olmaz; dolayısıyla bir güvenlik sınırı
 * OLAMAZ. Her fonksiyon önce verifySession()'ı çağırır ve React cache() ile
 * bir render geçişinde tekrar sorgulanmaz.
 *
 * Her sorgu açık kolon listesi seçer (DTO disiplini) — profiles üzerinde
 * asla select("*") kullanılmaz.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    redirect({ href: "/login", locale: await getLocale() });
  }

  return { userId: userId as string };
});

export const getCurrentUser = cache(async () => {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, locale")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error("getCurrentUser: profil bulunamadı.");
  }

  return data;
});

/**
 * Aktif workspace hassas olmayan bir çerezde tutulur — yalnızca tercih.
 * Gerçek sınır RLS'tir: burada döndürülen satır zaten yalnızca çağıranın
 * private.workspace_ids_for_current_user() kapsamındaki workspace'lerden
 * gelebilir, o yüzden sahte bir çerez değeri en kötü ihtimalle kişisel
 * workspace'e sessiz düşüşe yol açar.
 */
export const getWorkspaceList = cache(async () => {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, slug, is_personal)")
    .eq("user_id", userId);

  if (error) throw new DbError("dal:getWorkspaceList", error);

  return (data ?? [])
    .filter((row) => row.workspaces)
    .map((row) => ({
      id: row.workspaces!.id,
      name: row.workspaces!.name,
      slug: row.workspaces!.slug,
      isPersonal: row.workspaces!.is_personal,
      role: row.role as WorkspaceRole,
    }));
});

export const getWorkspaceContext = cache(async () => {
  const workspaces = await getWorkspaceList();
  if (workspaces.length === 0) {
    throw new Error("getWorkspaceContext: kullanıcının hiç workspace'i yok.");
  }

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const matched = workspaces.find((w) => w.id === requested);
  const active = matched ?? workspaces.find((w) => w.isPersonal) ?? workspaces[0];

  const supabase = await createClient();

  // Paket/abonelik yok (20260910120000_pay_as_you_go.sql): tek okunacak şey
  // cüzdan bakiyesi. `maybeSingle` bilinçli — workspace_credits satırı ilk
  // harcamada consume_credits tarafından yaratılır, o ana kadar yoktur.
  const { data: credits, error: creditsError } = await supabase
    .from("workspace_credits")
    .select("balance")
    .eq("workspace_id", active.id)
    .maybeSingle();

  if (creditsError) throw new DbError("dal:getWorkspaceContext", creditsError);

  return {
    workspace: active,
    workspaces,
    credits: { balance: credits?.balance ?? 0 },
  };
});

export const getWorkspaceMembers = cache(async (workspaceId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, created_at, profiles(full_name, email)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw new DbError("dal:getWorkspaceMembers", error);

  return (data ?? []).map((row) => ({
    userId: row.user_id,
    role: row.role as WorkspaceRole,
    createdAt: row.created_at,
    fullName: row.profiles?.full_name ?? "",
    email: row.profiles?.email ?? "",
  }));
});

export const getContractStats = cache(async (workspaceId: string) => {
  await verifySession();
  const supabase = await createClient();

  const countFor = async (status?: ContractStatus) => {
    let query = supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("archived_at", null);
    if (status) query = query.eq("status", status);
    const { count, error } = await query;
    if (error) throw new DbError("dal:getContractStats", error);
    return count ?? 0;
  };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [total, drafts, ready, createdThisMonth] = await Promise.all([
    countFor(),
    countFor("draft"),
    countFor("ready"),
    supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", startOfMonth.toISOString())
      .then(({ count, error }) => {
        if (error) throw new DbError("dal:getContractStats", error);
        return count ?? 0;
      }),
  ]);

  return { total, drafts, ready, createdThisMonth };
});

export const getRecentContracts = cache(async (workspaceId: string, limit = 10) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("id, title, contract_type, status, updated_at")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new DbError("dal:getRecentContracts", error);
  return data ?? [];
});

/** Tek sözleşme — RLS zaten çağıranın workspace'i dışındaki satırları eler. */
export const getContract = cache(async (contractId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("id, title, contract_type, status, workspace_id, created_at, updated_at, archived_at")
    .eq("id", contractId)
    .maybeSingle();

  if (error) throw new DbError("dal:getContract", error);
  return data;
});

export const getArchivedContracts = cache(async (workspaceId: string, limit = 50) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select("id, title, contract_type, status, archived_at")
    .eq("workspace_id", workspaceId)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false })
    .limit(limit);

  if (error) throw new DbError("dal:getArchivedContracts", error);
  return data ?? [];
});

export const getCreditLedger = cache(async (workspaceId: string, limit = 20) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credit_ledger")
    .select("id, entry_type, amount, reason, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new DbError("dal:getCreditLedger", error);
  return data ?? [];
});

export const getContractMessages = cache(async (contractId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contract_messages")
    .select("id, role, content, created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });

  if (error) throw new DbError("dal:getContractMessages", error);
  return data ?? [];
});

/** version_no'ya göre yeniden yeniye — [0] her zaman en güncel sürümdür. */
export const getContractVersions = cache(async (contractId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contract_versions")
    .select("id, version_no, sections, source, created_at")
    .eq("contract_id", contractId)
    .order("version_no", { ascending: false });

  if (error) throw new DbError("dal:getContractVersions", error);
  return data ?? [];
});

export const getContractShares = cache(async (contractId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contract_shares")
    .select("id, token, expires_at, revoked_at, created_at")
    .eq("contract_id", contractId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new DbError("dal:getContractShares", error);
  return data ?? [];
});

export const getContractFindings = cache(async (contractId: string) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contract_findings")
    .select("id, code, severity, section_key, detail, created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });

  if (error) throw new DbError("dal:getContractFindings", error);
  return data ?? [];
});

/**
 * Son `windowDays` gün içinde harcanan kredi. Cüzdan modelinde "bu ay" diye
 * bir dönem yok (aylık yenileme kalktı), o yüzden pencere gün cinsinden verilir.
 *
 * Filtre veritabanında yapılır: eskiden dashboard bunu getCreditLedger'ın
 * VARSAYILAN 20 SATIRLIK sayfasından hesaplıyordu, yani 20 hareketten eski
 * harcamalar sessizce toplama girmiyordu.
 */
export const getCreditsSpent = cache(async (workspaceId: string, windowDays: number) => {
  await verifySession();
  const supabase = await createClient();

  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("credit_ledger")
    .select("amount")
    .eq("workspace_id", workspaceId)
    .eq("entry_type", "consume")
    .gte("created_at", since);

  if (error) throw new DbError("dal:getCreditsSpent", error);
  return (data ?? []).reduce((sum, row) => sum + Math.abs(row.amount), 0);
});

/** Son 8 hafta için işaretli/nötr seri — §7.3 tek kırmızı vurgu grafiği. */
export const getCreditSeries = cache(async (workspaceId: string) => {
  const ledger = await getCreditLedger(workspaceId, 500);

  const weeks: { weekStart: Date; consumed: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    weeks.push({ weekStart, consumed: 0 });
  }

  for (const entry of ledger) {
    if (entry.entry_type !== "consume") continue;
    const created = new Date(entry.created_at);
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (created >= weeks[i].weekStart) {
        weeks[i].consumed += Math.abs(entry.amount);
        break;
      }
    }
  }

  return weeks.map((w) => ({ weekStart: w.weekStart.toISOString(), consumed: w.consumed }));
});

export const getWorkspaceActivity = cache(async (workspaceId: string, limit = 12) => {
  await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_activity")
    .select("id, kind, is_important, created_at, actor_id, profiles(full_name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new DbError("dal:getWorkspaceActivity", error);

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    isImportant: row.is_important,
    createdAt: row.created_at,
    actorName: row.profiles?.full_name ?? "",
  }));
});

/** Server Action kapısı: rol yeterli değilse çağıran taraf hatayı işler. */
export async function requireWorkspaceRole(workspaceId: string, roles: WorkspaceRole[]) {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (error || !data || !roles.includes(data.role as WorkspaceRole)) {
    throw new Error("requireWorkspaceRole: yetersiz yetki.");
  }

  return data.role as WorkspaceRole;
}

/** requireWorkspaceRole'ün fırlatmayan hali — contracts/[id] gibi, rolün
 * yalnızca UI dallanması için okunduğu (RLS zaten yetkiyi zorunlu kıldığı)
 * yerlerde. */
export const getMembershipRole = cache(async (workspaceId: string) => {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.role as WorkspaceRole | undefined) ?? null;
});
