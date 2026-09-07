import { setRequestLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { StarterOverview } from "@/components/dashboard/starter-overview";
import { ProOverview } from "@/components/dashboard/pro-overview";
import { BusinessOverview } from "@/components/dashboard/business-overview";
import {
  getContractStats,
  getCreditLedger,
  getCreditSeries,
  getCurrentUser,
  getRecentContracts,
  getWorkspaceActivity,
  getWorkspaceContext,
  getWorkspaceMembers,
} from "@/lib/dal";

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const [currentUser, { workspace, subscription, credits }] = await Promise.all([
    getCurrentUser(),
    getWorkspaceContext(),
  ]);
  const canArchive = workspace.role !== "viewer";

  const primaryAction = (
    <Button asChild>
      <Link href="/contracts/new">{t("empty.contracts.cta")}</Link>
    </Button>
  );

  let body: React.ReactNode;

  if (subscription.plan === "business") {
    const [stats, members, activity, contracts] = await Promise.all([
      getContractStats(workspace.id),
      getWorkspaceMembers(workspace.id),
      getWorkspaceActivity(workspace.id),
      getRecentContracts(workspace.id),
    ]);
    body = (
      <BusinessOverview
        stats={{ ...stats, activeMembers: members.length }}
        members={members}
        activity={activity}
        contracts={contracts}
        canArchive={canArchive}
      />
    );
  } else if (subscription.plan === "pro") {
    const [ledger, series, contracts] = await Promise.all([
      getCreditLedger(workspace.id),
      getCreditSeries(workspace.id),
      getRecentContracts(workspace.id),
    ]);
    const spentThisMonth = ledger
      .filter((e) => e.entry_type === "consume")
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    body = (
      <ProOverview
        credits={credits}
        spentThisMonth={spentThisMonth}
        series={series}
        contracts={contracts}
        ledger={ledger}
        canArchive={canArchive}
      />
    );
  } else {
    const [stats, contracts] = await Promise.all([
      getContractStats(workspace.id),
      getRecentContracts(workspace.id),
    ]);
    body = (
      <StarterOverview
        stats={stats}
        credits={{
          balance: credits.balance,
          monthlyAllowance: credits.monthlyAllowance,
          resetsOn: subscription.currentPeriodEnd,
          isPlaceholder: credits.isPlaceholder,
        }}
        contracts={contracts}
        canArchive={canArchive}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={t("pages.overview.title")}
        description={t("greeting", { name: currentUser.full_name.split(" ")[0] || currentUser.full_name })}
        action={primaryAction}
      />
      {body}
    </>
  );
}
