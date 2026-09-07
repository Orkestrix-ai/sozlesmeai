import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { AddCreditsDialog } from "@/components/admin/add-credits-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminWorkspaces } from "@/lib/admin/dal";

export default async function AdminBillingPage({ params }: PageProps<"/[locale]/admin/billing">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.billing");
  const tWorkspaces = await getTranslations("admin.workspaces");
  const tPlan = await getTranslations("dashboard.plan");
  const workspaces = await getAdminWorkspaces();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tWorkspaces("table.name")}</TableHead>
            <TableHead>{tWorkspaces("table.plan")}</TableHead>
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
              <TableCell>{ws.plan ? tPlan(ws.plan) : "—"}</TableCell>
              <TableCell data-numeric>{ws.balance}</TableCell>
              <TableCell>
                <AddCreditsDialog workspaceId={ws.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
