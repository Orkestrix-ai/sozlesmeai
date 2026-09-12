import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { AddCreditsDialog } from "@/components/admin/add-credits-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminCreditLedger, getAdminWorkspaces } from "@/lib/admin/dal";
import { isKnownReason } from "@/lib/credits/reasons";

export default async function AdminBillingPage({ params }: PageProps<"/[locale]/admin/billing">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.billing");
  const tLedger = await getTranslations("admin.billing.ledger");
  const tReasons = await getTranslations("dashboard.credits.reasons");
  const tWorkspaces = await getTranslations("admin.workspaces");
  const [workspaces, ledger] = await Promise.all([getAdminWorkspaces(), getAdminCreditLedger()]);

  /* Tanınmayan reason ham basılmaz — gerekçe için bkz. src/lib/credits/reasons.ts. */
  const reasonLabel = (reason: string) =>
    isKnownReason(reason) ? tReasons(reason) : tReasons("other");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tWorkspaces("table.name")}</TableHead>
            <TableHead>{tWorkspaces("table.balance")}</TableHead>
            <TableHead className="sr-only">{t("addCredits")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((ws) => (
            <TableRow key={ws.id}>
              <TableCell className="font-medium text-ink-950">
                {ws.isPersonal ? tWorkspaces("personal") : ws.name}
              </TableCell>
              <TableCell data-numeric>{ws.balance}</TableCell>
              <TableCell>
                <AddCreditsDialog workspaceId={ws.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Platform geneli defter. `credit_ledger` admin'e RLS ile zaten açıktı
          (20260907190000:72) ama hiçbir ekran okumuyordu: kredi VERİLEBİLİYOR,
          nereye gittiği GÖRÜLEMİYORDU. design.md §9 bu bölümü "kredi ve
          kullanım yönetimi" diye adlandırıyor — defter buraya ait, ayrı bir
          sidebar girdisi gerekmez. */}
      <h2 className="mt-10 mb-4 text-card-title font-heading text-ink-950">{tLedger("title")}</h2>
      {ledger.length === 0 ? (
        <p className="text-body text-stone-600">{tLedger("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tLedger("date")}</TableHead>
              <TableHead>{tLedger("workspace")}</TableHead>
              <TableHead>{tLedger("reason")}</TableHead>
              <TableHead>{tLedger("actor")}</TableHead>
              <TableHead>{tLedger("amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell data-numeric>
                  <time dateTime={entry.createdAt}>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </time>
                </TableCell>
                <TableCell>
                  {entry.workspace
                    ? entry.workspace.isPersonal
                      ? tWorkspaces("personal")
                      : entry.workspace.name
                    : "—"}
                </TableCell>
                <TableCell>{reasonLabel(entry.reason)}</TableCell>
                <TableCell className="text-stone-600">{entry.actorName ?? "—"}</TableCell>
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
    </>
  );
}
