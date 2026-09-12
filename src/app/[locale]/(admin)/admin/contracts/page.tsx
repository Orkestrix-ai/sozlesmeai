import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminContracts } from "@/lib/admin/dal";

/** messages/*.json → dashboard.newContract.types ile birebir. `contract_type`
 *  artık null olabiliyor (sıfırdan oluşturma akışı tür yazmıyor) ve serbest
 *  metin değil `contract_types.code`'a FK — yine de tanınmayan bir kod ham
 *  basılmaz, "—" gösterilir. */
const KNOWN_TYPES = ["service", "nda", "freelance", "rental", "employment", "resignation"] as const;

/**
 * Platform geneli sözleşme listesi — design.md §9'un eksik kalan yüzeyi.
 * `contracts` tablosu admin'e RLS ile ZATEN açıktı (20260907190000:75), ama
 * hiçbir ekran onu okumuyordu.
 *
 * SATIRLAR BİLEREK TIKLANABİLİR DEĞİL. `contract_versions`/`contract_messages`
 * admin'e kapalı (design.md §9 "belge içerikleri için açık erişim değil"), yani
 * /contracts/[id] admin için sözleşmeyi bulur ama sürümlerini ve rolünü
 * bulamaz — boş, bozuk bir ekran açılırdı. Buraya bir link eklemeden önce o
 * sayfanın admin için ne döndürdüğüne bakın.
 */
export default async function AdminContractsPage({ params }: PageProps<"/[locale]/admin/contracts">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.contracts");
  const tStatus = await getTranslations("dashboard.status");
  const tTypes = await getTranslations("dashboard.newContract.types");
  const tWorkspaces = await getTranslations("admin.workspaces");
  const contracts = await getAdminContracts();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {contracts.length === 0 ? (
        <p className="text-body text-stone-600">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.title")}</TableHead>
              <TableHead>{t("table.workspace")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.owner")}</TableHead>
              <TableHead>{t("table.updated")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium text-ink-950">
                  {contract.title}
                  {contract.isArchived && (
                    <span className="ml-2 text-helper font-normal text-stone-600">{t("archived")}</span>
                  )}
                </TableCell>
                <TableCell>
                  {contract.workspace
                    ? contract.workspace.isPersonal
                      ? tWorkspaces("personal")
                      : contract.workspace.name
                    : "—"}
                </TableCell>
                <TableCell>
                  {contract.contractType &&
                  (KNOWN_TYPES as readonly string[]).includes(contract.contractType)
                    ? tTypes(contract.contractType as (typeof KNOWN_TYPES)[number])
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={contract.status}>{tStatus(contract.status)}</StatusBadge>
                </TableCell>
                <TableCell className="text-stone-600">{contract.ownerName ?? "—"}</TableCell>
                <TableCell data-numeric>
                  <time dateTime={contract.updatedAt}>
                    {new Date(contract.updatedAt).toLocaleDateString()}
                  </time>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
