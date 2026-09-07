import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getAdminUsageStats } from "@/lib/admin/dal";

export default async function AdminUsagePage({ params }: PageProps<"/[locale]/admin/usage">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.usage");
  const stats = await getAdminUsageStats();

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
    </>
  );
}
