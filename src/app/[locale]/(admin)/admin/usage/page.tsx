import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminContractStatusCounts, getAdminUsageStats } from "@/lib/admin/dal";
import type { Database } from "@/lib/supabase/types";

/** Dağılımda HER durum gösterilir — sayısı 0 olan da. "error 0" bilgi,
 *  eksik satır belirsizlik. Sıra belge yaşam döngüsünü izler. */
const STATUSES = ["draft", "review", "ready", "shared", "error"] as const satisfies
  readonly Database["public"]["Enums"]["contract_status"][];

export default async function AdminUsagePage({ params }: PageProps<"/[locale]/admin/usage">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.usage");
  const tStatus = await getTranslations("dashboard.status");
  const [stats, statusCounts] = await Promise.all([
    getAdminUsageStats(),
    getAdminContractStatusCounts(),
  ]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricCard label={t("metrics.totalUsers")} value={stats.totalUsers} />
        <MetricCard label={t("metrics.totalWorkspaces")} value={stats.totalWorkspaces} />
        <MetricCard label={t("metrics.totalContracts")} value={stats.totalContracts} />
        <MetricCard label={t("metrics.totalVersions")} value={stats.totalVersions} />
        <MetricCard label={t("metrics.totalMessages")} value={stats.totalMessages} />
        <MetricCard label={t("metrics.creditsConsumed")} value={stats.creditsConsumed} />
      </div>

      <h2 className="mt-10 mb-4 text-card-title font-heading text-ink-950">{t("statusBreakdown")}</h2>
      <div className="flex flex-wrap gap-3">
        {STATUSES.map((status) => (
          <div
            key={status}
            className="flex items-center gap-2 rounded-[var(--radius)] border border-stone-200 bg-paper-50 px-3 py-2"
          >
            <StatusBadge status={status}>{tStatus(status)}</StatusBadge>
            <span className="text-body font-medium text-ink-950" data-numeric>
              {statusCounts.get(status) ?? 0}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
