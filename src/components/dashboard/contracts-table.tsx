import { Archive } from "lucide-react";
import { useTranslations } from "next-intl";

import { archiveContractAction } from "@/actions/contracts";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ContractRow = {
  id: string;
  title: string;
  contract_type: string | null;
  status: "draft" | "review" | "ready" | "shared" | "error";
  updated_at: string;
};

/**
 * design.md §7.3 — "Her belge satırında net durum ve sonraki aksiyon
 * bulunmalı." `canArchive`, viewer rolüne arşivleme butonu göstermemek için
 * (contracts_update RLS politikası zaten reddeder — burada yalnızca UI'ı
 * temiz tutuyoruz).
 */
function ContractsTable({ contracts, canArchive }: { contracts: ContractRow[]; canArchive: boolean }) {
  const t = useTranslations("dashboard.contracts");
  const tStatus = useTranslations("dashboard.status");
  const tTypes = useTranslations("dashboard.newContract.types");
  const tActions = useTranslations("dashboard.contracts.actions");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.title")}</TableHead>
          <TableHead>{t("table.type")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
          <TableHead>{t("table.updated")}</TableHead>
          <TableHead>{t("table.nextAction")}</TableHead>
          {canArchive && <TableHead className="sr-only">{tActions("archive")}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {contracts.map((contract) => (
          <TableRow key={contract.id}>
            <TableCell className="font-medium text-ink-950">
              {contract.title || t("untitled")}
            </TableCell>
            <TableCell>
              {contract.contract_type &&
              ["service", "nda", "freelance"].includes(contract.contract_type)
                ? tTypes(contract.contract_type as "service" | "nda" | "freelance")
                : "—"}
            </TableCell>
            <TableCell>
              <StatusBadge status={contract.status}>{tStatus(contract.status)}</StatusBadge>
            </TableCell>
            <TableCell data-numeric>
              <time dateTime={contract.updated_at}>
                {new Date(contract.updated_at).toLocaleDateString()}
              </time>
            </TableCell>
            <TableCell>
              <Link href={`/contracts/${contract.id}`} className="text-brand-red-600 hover:underline">
                {t(`nextAction.${contract.status}`)}
              </Link>
            </TableCell>
            {canArchive && (
              <TableCell>
                <form action={archiveContractAction}>
                  <input type="hidden" name="contractId" value={contract.id} />
                  <button
                    type="submit"
                    aria-label={tActions("archive")}
                    className="flex size-8 items-center justify-center rounded-[var(--radius)] text-stone-600 outline-none hover:bg-paper-100 hover:text-ink-950 focus-visible:ring-2 focus-visible:ring-brand-red-600"
                  >
                    <Archive className="size-4" aria-hidden="true" />
                  </button>
                </form>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export { ContractsTable };
