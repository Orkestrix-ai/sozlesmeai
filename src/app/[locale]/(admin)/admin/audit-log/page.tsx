import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminAuditLog } from "@/lib/admin/dal";

/** messages/*.json → admin.auditLog.actions ile birebir. Tanınmayan bir
 * action (ör. ileride eklenen bir admin aksiyonu) ham metin gösterilir. */
const KNOWN_ACTIONS = ["add_credits"] as const;

/** design.md §9: "Audit log ekranlarında zaman, aktör, işlem ve kaynak ayrı
 * kolonlar halinde sunulmalı." — tam olarak bu dört kolon aşağıda. */
export default async function AdminAuditLogPage({ params }: PageProps<"/[locale]/admin/audit-log">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.auditLog");
  const entries = await getAdminAuditLog();

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell data-numeric>
                  <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
                </TableCell>
                <TableCell className="font-mono text-helper">{entry.actor_id?.slice(0, 8) ?? "—"}</TableCell>
                <TableCell>
                  {(KNOWN_ACTIONS as readonly string[]).includes(entry.action)
                    ? t(`actions.${entry.action}` as "actions.add_credits")
                    : entry.action}
                </TableCell>
                <TableCell className="text-stone-600">
                  {entry.resource_type}
                  {entry.resource_id ? ` · ${entry.resource_id.slice(0, 8)}` : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
