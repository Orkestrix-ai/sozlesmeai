import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContractsTable } from "@/components/dashboard/contracts-table";
import { CreditChart } from "@/components/dashboard/credit-chart";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ReadyTemplatesStrip } from "@/components/dashboard/ready-templates-strip";
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

type LedgerEntry = {
  id: number;
  entry_type: "grant" | "consume" | "refund" | "adjustment";
  amount: number;
  reason: string;
  created_at: string;
};

type Member = { userId: string; role: WorkspaceRole; createdAt: string; fullName: string; email: string };
type Activity = { id: number; kind: ActivityKind; isImportant: boolean; createdAt: string; actorName: string };

/**
 * `credit_ledger.reason` DEĞERLERİ — `credit_entry_type` enum'ı değil.
 * messages/*.json → dashboard.credits.reasons ile birebir.
 *
 * Bu ayrım bir kez kaçırıldı: liste `adjustment` içeriyordu (o bir entry_type),
 * oysa `admin_add_credits` reason olarak `admin_adjustment` yazıyor — arayüzde
 * ham metin görünüyordu. Yeni bir reason yazan her RPC/route buraya da eklenmeli.
 *
 * `signup_starter_grant` artık YAZILMIYOR ama listede kalıyor: credit_ledger
 * append-only, yani eski kayıtlardaki bu reason hiçbir zaman silinemez. Aynı
 * gerekçeyle `adjustment` ve `refund` de duruyor: bugün hiçbir şey yazmıyor,
 * ama mevcut RPC seti yerleşmeden önce yazılmış satırlar olabilir.
 */
const KNOWN_REASON_KEYS = [
  "signup_grant",
  "signup_starter_grant",
  "adjustment",
  "refund",
  "admin_adjustment",
  "operation_failed",
  "document_row_failed",
  "findings_delete_failed",
  "findings_insert_failed",
  "draft_generate",
  "ai_edit",
  "risk_check",
  "pdf_generate",
  "manual_edit",
] as const;

/**
 * design.md §7 — paket kademesi kalktığı için tek dashboard. Ana vurgu
 * cüzdan: "bakiyem ne, nereye gitti". Kredi özeti `ink-950` koyu kart,
 * geri kalan yüzeyler açık nötr.
 *
 * Ekip üyeleri ve aktivite akışı yalnızca PAYLAŞILAN çalışma alanlarında
 * görünür (`team` prop'u null değilse). Ayrım artık paket değil, çalışma
 * alanının tipi — uygulamada başka bir ekip yüzeyi yok, bu blok düşerse
 * üyeler hiçbir yerde görünmezdi.
 */
function WorkspaceOverview({
  stats,
  credits,
  spentLast30Days,
  series,
  contracts,
  ledger,
  team,
  canArchive,
}: {
  stats: { total: number; drafts: number; ready: number };
  credits: { balance: number };
  spentLast30Days: number;
  series: { weekStart: string; consumed: number }[];
  contracts: Contract[];
  ledger: LedgerEntry[];
  team: { members: Member[]; activity: Activity[] } | null;
  canArchive: boolean;
}) {
  const t = useTranslations("dashboard");
  const tMetrics = useTranslations("dashboard.metrics");
  const tCredits = useTranslations("dashboard.credits");
  const tReasons = useTranslations("dashboard.credits.reasons");
  const tTeam = useTranslations("dashboard.team");
  const tActivity = useTranslations("dashboard.activity");
  const tEmptyContracts = useTranslations("dashboard.empty.contracts");

  /**
   * Tanınmayan reason ham metin olarak BASILMAZ. `refund_credits`'in
   * `p_reason` parametresi serbest metin ve RPC `authenticated` rolüne açık;
   * yani izin listesi hiçbir zaman tam olamaz. `other` bir DB değeri değil,
   * yalnızca görüntüleme yedeği — bu yüzden KNOWN_REASON_KEYS'te yok.
   */
  const reasonLabel = (reason: string) =>
    (KNOWN_REASON_KEYS as readonly string[]).includes(reason)
      ? tReasons(reason as (typeof KNOWN_REASON_KEYS)[number])
      : tReasons("other");
  const tEmptyLedger = useTranslations("dashboard.empty.ledger");
  const tEmptyActivity = useTranslations("dashboard.empty.activity");
  const tEmptyMembers = useTranslations("dashboard.empty.members");

  // Ödeme sağlayıcısı yok; eşik geçildiğinde satın alma değil, bilgilendirme
  // gösterilir (design.md §7.2 "agresif banner değil sakin satır").
  const lowBalance = credits.balance <= 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label={tMetrics("total")} value={stats.total} />
        <MetricCard label={tMetrics("drafts")} value={stats.drafts} />
        <MetricCard label={tMetrics("ready")} value={stats.ready} />
        <MetricCard label={tMetrics("remainingCredits")} value={credits.balance} />
      </div>

      <ReadyTemplatesStrip />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card tone="dark">
          <CardHeader>
            <CardTitle className="text-paper-50">{tCredits("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-helper text-stone-400">{tCredits("balance")}</p>
                <p className="mt-1 text-page-title font-heading text-paper-50" data-numeric>
                  {credits.balance}
                </p>
              </div>
              <div>
                <p className="text-helper text-stone-400">{tCredits("spentLast30Days")}</p>
                <p className="mt-1 text-page-title font-heading text-paper-50" data-numeric>
                  {spentLast30Days}
                </p>
              </div>
            </div>
            <p className="mt-4 text-helper leading-relaxed text-stone-400">
              {lowBalance ? t("lowBalance.message") : tCredits("perContractNote")}{" "}
              <Link href="/settings" className="text-paper-50 underline underline-offset-2">
                {t("lowBalance.link")}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("chart.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreditChart series={series} />
          </CardContent>
        </Card>
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

      <Card>
        <CardHeader>
          <CardTitle>{tCredits("ledgerTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <EmptyState
              title={tEmptyLedger("title")}
              body={tEmptyLedger("body")}
              ctaLabel={tEmptyLedger("cta")}
              ctaHref="/contracts"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCredits("ledger.date")}</TableHead>
                  <TableHead>{tCredits("ledger.description")}</TableHead>
                  <TableHead>{tCredits("ledger.amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell data-numeric>
                      <time dateTime={entry.created_at}>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </time>
                    </TableCell>
                    <TableCell>{reasonLabel(entry.reason)}</TableCell>
                    <TableCell
                      data-numeric
                      className={entry.amount < 0 ? "text-state-error" : "text-state-success"}
                    >
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {team && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{tActivity("title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {team.activity.length === 0 ? (
                <EmptyState
                  title={tEmptyActivity("title")}
                  body={tEmptyActivity("body")}
                  ctaLabel={tEmptyActivity("cta")}
                  ctaHref="/contracts"
                />
              ) : (
                <ul className="space-y-3">
                  {team.activity.map((item) => (
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
                        <time dateTime={item.createdAt} className="ml-2 text-helper text-stone-600">
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
              {team.members.length === 0 ? (
                <EmptyState
                  title={tEmptyMembers("title")}
                  body={tEmptyMembers("body")}
                  ctaLabel={tEmptyMembers("cta")}
                  ctaHref="/contracts"
                />
              ) : (
                <ul className="space-y-3">
                  {team.members.map((member) => (
                    <li key={member.userId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-body font-medium text-ink-950">
                          {member.fullName || member.email}
                        </p>
                        <p className="text-helper text-stone-600">
                          {tTeam("memberSince", {
                            date: new Date(member.createdAt).toLocaleDateString(),
                          })}
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
      )}
    </div>
  );
}

export { WorkspaceOverview };
