import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContractsTable } from "@/components/dashboard/contracts-table";
import { CreditChart } from "@/components/dashboard/credit-chart";
import { EmptyState } from "@/components/dashboard/empty-state";

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

/** messages/*.json → dashboard.credits.reasons ile birebir. Tanınmayan bir
 * `reason` (ör. Aşama C'de eklenecek yeni bir işlem türü) ham metin olarak
 * gösterilir — next-intl bilinmeyen anahtarda fırlatır, burada önlenir. */
const KNOWN_REASON_KEYS = [
  "signup_starter_grant",
  "monthly_grant",
  "contract_created",
  "adjustment",
  "refund",
] as const;

/**
 * design.md §7.3 — "Ana vurgu: kullanım ve işlem geçmişi." Kredi özeti
 * `ink-950` koyu kart (design.md kelimesi kelimesine); geri kalan yüzeyler
 * açık nötr.
 */
function ProOverview({
  credits,
  spentThisMonth,
  series,
  contracts,
  ledger,
  canArchive,
}: {
  credits: { balance: number };
  spentThisMonth: number;
  series: { weekStart: string; consumed: number }[];
  contracts: Contract[];
  ledger: LedgerEntry[];
  canArchive: boolean;
}) {
  const t = useTranslations("dashboard");
  const tCredits = useTranslations("dashboard.credits");
  const tReasons = useTranslations("dashboard.credits.reasons");
  const tEmptyContracts = useTranslations("dashboard.empty.contracts");
  const tEmptyLedger = useTranslations("dashboard.empty.ledger");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card tone="dark">
          <CardHeader>
            <CardTitle className="text-paper-50">{tCredits("title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-helper text-stone-400">{tCredits("balance")}</p>
              <p className="mt-1 text-page-title font-heading text-paper-50" data-numeric>
                {credits.balance}
              </p>
            </div>
            <div>
              <p className="text-helper text-stone-400">{tCredits("spentThisMonth")}</p>
              <p className="mt-1 text-page-title font-heading text-paper-50" data-numeric>
                {spentThisMonth}
              </p>
            </div>
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
          <CardTitle>{tCredits("title")}</CardTitle>
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
                    <TableCell>
                      {(KNOWN_REASON_KEYS as readonly string[]).includes(entry.reason)
                        ? tReasons(entry.reason as (typeof KNOWN_REASON_KEYS)[number])
                        : entry.reason}
                    </TableCell>
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
    </div>
  );
}

export { ProOverview };
