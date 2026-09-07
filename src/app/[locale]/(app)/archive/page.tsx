import { setRequestLocale, getTranslations } from "next-intl/server";

import { restoreContractAction } from "@/actions/contracts";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getArchivedContracts, getWorkspaceContext } from "@/lib/dal";

export default async function ArchivePage({ params }: PageProps<"/[locale]/archive">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const tStatus = await getTranslations("dashboard.status");
  const tActions = await getTranslations("dashboard.contracts.actions");
  const { workspace } = await getWorkspaceContext();
  const canRestore = workspace.role !== "viewer";
  const contracts = await getArchivedContracts(workspace.id);

  return (
    <>
      <PageHeader title={t("pages.archive.title")} description={t("pages.archive.description")} />
      {contracts.length === 0 ? (
        <EmptyState
          title={t("empty.archive.title")}
          body={t("empty.archive.body")}
          ctaLabel={t("empty.archive.cta")}
          ctaHref="/contracts"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("contracts.table.title")}</TableHead>
              <TableHead>{t("contracts.table.status")}</TableHead>
              {canRestore && <TableHead className="sr-only">{tActions("restore")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium text-ink-950">
                  {contract.title || t("contracts.untitled")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={contract.status}>{tStatus(contract.status)}</StatusBadge>
                </TableCell>
                {canRestore && (
                  <TableCell>
                    <form action={restoreContractAction}>
                      <input type="hidden" name="contractId" value={contract.id} />
                      <button
                        type="submit"
                        className="text-helper font-medium text-stone-800 hover:underline"
                      >
                        {tActions("restore")}
                      </button>
                    </form>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
