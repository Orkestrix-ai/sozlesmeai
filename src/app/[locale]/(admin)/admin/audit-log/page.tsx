import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminAuditLog } from "@/lib/admin/dal";
import { actorLabel, isKnownAction } from "@/lib/admin/audit";

/** design.md §9: "Audit log ekranlarında zaman, aktör, işlem ve kaynak ayrı
 * kolonlar halinde sunulmalı." — o dört kolon, artı `detail` (aksiyonun
 * yükü; onsuz "kredi eklendi" satırı kaç kredi olduğunu söylemiyordu). */
export default async function AdminAuditLogPage({ params }: PageProps<"/[locale]/admin/audit-log">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.auditLog");
  const entries = await getAdminAuditLog();

  /* `detail` jsonb'yi okunabilir kıl. Bugün tek yazıcı admin_add_credits ve
     {amount} yazıyor (20260908130000:43); tanınmayan bir şekil için ham JSON
     yedeği kalır — bir sonraki admin aksiyonu eklendiğinde burası da
     genişletilmeli, yoksa satır JSON olarak görünür. */
  const detailLabel = (detail: unknown): string => {
    if (detail === null || detail === undefined) return "—";
    if (typeof detail === "object" && !Array.isArray(detail)) {
      const amount = (detail as Record<string, unknown>).amount;
      if (typeof amount === "number") return t("detailCredits", { amount });
      if (Object.keys(detail).length === 0) return "—";
    }
    return JSON.stringify(detail);
  };

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {entries.length === 0 ? (
        <p className="text-body text-stone-600">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.time")}</TableHead>
              <TableHead>{t("table.actor")}</TableHead>
              <TableHead>{t("table.action")}</TableHead>
              <TableHead>{t("table.resource")}</TableHead>
              <TableHead>{t("table.detail")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell data-numeric>
                  <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
                </TableCell>
                <TableCell>{actorLabel(entry.actorName, entry.actor_id)}</TableCell>
                <TableCell>
                  {isKnownAction(entry.action) ? t(`actions.${entry.action}`) : entry.action}
                </TableCell>
                <TableCell className="text-stone-600">
                  {entry.resource_type}
                  {entry.resource_id ? ` · ${entry.resource_id.slice(0, 8)}` : ""}
                </TableCell>
                <TableCell className="text-stone-600">{detailLabel(entry.detail)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
