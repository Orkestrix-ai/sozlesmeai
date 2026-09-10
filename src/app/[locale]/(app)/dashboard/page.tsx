import { setRequestLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { WorkspaceOverview } from "@/components/dashboard/workspace-overview";
import {
  getContractStats,
  getCreditLedger,
  getCreditSeries,
  getCreditsSpent,
  getCurrentUser,
  getRecentContracts,
  getWorkspaceActivity,
  getWorkspaceContext,
  getWorkspaceMembers,
} from "@/lib/dal";

/** Cüzdan modelinde "dönem" yok; harcama penceresi sabit 30 gün. */
const SPEND_WINDOW_DAYS = 30;

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const [currentUser, { workspace, credits }] = await Promise.all([
    getCurrentUser(),
    getWorkspaceContext(),
  ]);
  const canArchive = workspace.role !== "viewer";

  const [stats, ledger, series, spentLast30Days, contracts] = await Promise.all([
    getContractStats(workspace.id),
    getCreditLedger(workspace.id),
    getCreditSeries(workspace.id),
    getCreditsSpent(workspace.id, SPEND_WINDOW_DAYS),
    getRecentContracts(workspace.id),
  ]);

  // Ekip blokları yalnızca paylaşılan çalışma alanlarında sorgulanır —
  // kişisel workspace'te iki gereksiz sorgu atmanın anlamı yok.
  const team = workspace.isPersonal
    ? null
    : await Promise.all([
        getWorkspaceMembers(workspace.id),
        getWorkspaceActivity(workspace.id),
      ]).then(([members, activity]) => ({ members, activity }));

  return (
    <>
      <PageHeader
        title={t("pages.overview.title")}
        description={t("greeting", { name: currentUser.full_name.split(" ")[0] || currentUser.full_name })}
        action={
          <Button asChild>
            <Link href="/contracts/new">{t("empty.contracts.cta")}</Link>
          </Button>
        }
      />
      <WorkspaceOverview
        stats={stats}
        credits={credits}
        spentLast30Days={spentLast30Days}
        series={series}
        contracts={contracts}
        ledger={ledger}
        team={team}
        canArchive={canArchive}
      />
    </>
  );
}
