import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractsTable } from "@/components/dashboard/contracts-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import type { Database } from "@/lib/supabase/types";

type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];
type ActivityKind = Database["public"]["Enums"]["activity_kind"];

type Contract = {
  id: string;
  title: string;
  contract_type: string | null;
  status: "draft" | "review" | "ready" | "shared" | "error";
  updated_at: string;
};

type Member = { userId: string; role: WorkspaceRole; createdAt: string; fullName: string; email: string };
type Activity = { id: number; kind: ActivityKind; isImportant: boolean; createdAt: string; actorName: string };

/**
 * design.md §7.4 — "KPI kartları: açık yüzey ... Ekip aktivitesi: gri taban,
 * kırmızı yalnızca önemli aksiyonlarda." `isImportant` bu yüzden tek renk
 * ayracı: normal satırlar stone-800, önemli olanlar brand-red-600 nokta.
 */
function BusinessOverview({
  stats,
  members,
  activity,
  contracts,
  canArchive,
}: {
  stats: { total: number; drafts: number; ready: number; createdThisMonth: number; activeMembers: number };
  members: Member[];
  activity: Activity[];
  contracts: Contract[];
  canArchive: boolean;
}) {
  const t = useTranslations("dashboard");
  const tMetrics = useTranslations("dashboard.metrics");
  const tTeam = useTranslations("dashboard.team");
  const tActivity = useTranslations("dashboard.activity");
  const tEmptyContracts = useTranslations("dashboard.empty.contracts");
  const tEmptyActivity = useTranslations("dashboard.empty.activity");
  const tEmptyMembers = useTranslations("dashboard.empty.members");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard label={tMetrics("total")} value={stats.total} />
        <MetricCard label={tMetrics("drafts")} value={stats.drafts} />
        <MetricCard label={tMetrics("ready")} value={stats.ready} />
        <MetricCard label={tMetrics("createdThisMonth")} value={stats.createdThisMonth} />
        <MetricCard label={tMetrics("activeMembers")} value={stats.activeMembers} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.contracts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <EmptyState
              title={tEmptyContracts("title")}
              body={tEmptyContracts("body")}
              ctaLabel={tEmptyContracts("cta")}
              ctaHref="/contracts/new"
            />
          ) : (
            <ContractsTable contracts={contracts} canArchive={canArchive} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tActivity("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState
                title={tEmptyActivity("title")}
                body={tEmptyActivity("body")}
                ctaLabel={tEmptyActivity("cta")}
                ctaHref="/contracts"
              />
            ) : (
              <ul className="space-y-3">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-body text-stone-800">
                    <span
                      className={
                        item.isImportant
                          ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-red-600"
                          : "mt-1.5 size-1.5 shrink-0 rounded-full bg-stone-400"
                      }
                      aria-hidden="true"
                    />
                    <span>
                      {tActivity(`kinds.${item.kind}`, { name: item.actorName })}
                      <time
                        dateTime={item.createdAt}
                        className="ml-2 text-helper text-stone-600"
                      >
                        {new Date(item.createdAt).toLocaleDateString()}
                      </time>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tTeam("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <EmptyState
                title={tEmptyMembers("title")}
                body={tEmptyMembers("body")}
                ctaLabel={tEmptyMembers("cta")}
                ctaHref="/contracts"
              />
            ) : (
              <ul className="space-y-3">
                {members.map((member) => (
                  <li key={member.userId} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-ink-950">
                        {member.fullName || member.email}
                      </p>
                      <p className="text-helper text-stone-600">
                        {tTeam("memberSince", { date: new Date(member.createdAt).toLocaleDateString() })}
                      </p>
                    </div>
                    <RoleBadge role={member.role}>{tTeam(`role.${member.role}`)}</RoleBadge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { BusinessOverview };
