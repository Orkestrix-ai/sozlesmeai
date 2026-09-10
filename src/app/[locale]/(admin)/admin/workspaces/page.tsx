import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminWorkspaces } from "@/lib/admin/dal";

export default async function AdminWorkspacesPage({ params }: PageProps<"/[locale]/admin/workspaces">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.workspaces");
  const workspaces = await getAdminWorkspaces();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.members")}</TableHead>
            <TableHead>{t("table.balance")}</TableHead>
            <TableHead>{t("table.created")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((ws) => (
            <TableRow key={ws.id}>
              <TableCell className="font-medium text-ink-950">
                {ws.isPersonal ? t("personal") : ws.name}
              </TableCell>
              <TableCell data-numeric>{ws.memberCount}</TableCell>
              <TableCell data-numeric>{ws.balance}</TableCell>
              <TableCell data-numeric>{new Date(ws.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
