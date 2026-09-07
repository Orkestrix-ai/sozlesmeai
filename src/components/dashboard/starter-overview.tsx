import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { UsageMeter } from "@/components/dashboard/usage-meter";
import { ContractsTable } from "@/components/dashboard/contracts-table";
import { EmptyState } from "@/components/dashboard/empty-state";

type Contract = {
  id: string;
  title: string;
  contract_type: string | null;
  status: "draft" | "review" | "ready" | "shared" | "error";
  updated_at: string;
};

/**
 * design.md §7.2 — "sade, öğretici, düşük yoğunluklu"; 2–3 metrikten fazla
 * gösterilmez, yükseltme mesajı agresif bir banner değil sakin bir satırdır.
 */
function StarterOverview({
  stats,
  credits,
  contracts,
  canArchive,
}: {
  stats: { total: number; drafts: number };
  credits: { balance: number; monthlyAllowance: number; resetsOn: string; isPlaceholder: boolean };
  contracts: Contract[];
  canArchive: boolean;
}) {
  const t = useTranslations("dashboard");
  const tMetrics = useTranslations("dashboard.metrics");
  const tEmpty = useTranslations("dashboard.empty.contracts");

  const used = Math.max(0, credits.monthlyAllowance - credits.balance);
  const nearLimit = credits.monthlyAllowance > 0 && credits.balance / credits.monthlyAllowance <= 0.2;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label={tMetrics("total")} value={stats.total} />
        <MetricCard label={tMetrics("drafts")} value={stats.drafts} />
        <MetricCard label={tMetrics("remainingCredits")} value={credits.balance} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("usage.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageMeter
            used={used}
            total={credits.monthlyAllowance}
            resetsOn={credits.resetsOn}
            isPlaceholder={credits.isPlaceholder}
          />
          {nearLimit && (
            <p className="mt-3 text-helper text-stone-600">
              {t("upgrade.message")}{" "}
              <Link href="/settings" className="text-brand-red-600 hover:underline">
                {t("upgrade.link")}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.contracts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <EmptyState
              title={tEmpty("title")}
              body={tEmpty("body")}
              ctaLabel={tEmpty("cta")}
              ctaHref="/contracts/new"
            />
          ) : (
            <ContractsTable contracts={contracts} canArchive={canArchive} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { StarterOverview };
