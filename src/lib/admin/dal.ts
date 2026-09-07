import "server-only";

import { cache } from "react";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";

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

export const getAdminUsers = cache(async () => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, locale, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
});

export const getAdminWorkspaces = cache(async () => {
  await requirePlatformAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select(
      "id, name, is_personal, created_at, subscriptions(plan, status), workspace_credits(balance), workspace_members(user_id)",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    isPersonal: w.is_personal,
    createdAt: w.created_at,
    plan: w.subscriptions?.plan ?? null,
    subscriptionStatus: w.subscriptions?.status ?? null,
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
  if (error) throw error;
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

  if (error) throw error;
  return data ?? [];
});
