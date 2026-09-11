import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { AddCreditsDialog } from "@/components/admin/add-credits-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminUsers } from "@/lib/admin/dal";

export default async function AdminUsersPage({ params }: PageProps<"/[locale]/admin/users">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.users");
  const tBilling = await getTranslations("admin.billing");
  const users = await getAdminUsers();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.email")}</TableHead>
            <TableHead>{t("table.locale")}</TableHead>
            <TableHead>{t("table.joined")}</TableHead>
            <TableHead>{t("table.balance")}</TableHead>
            <TableHead className="sr-only">{tBilling("addCredits")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium text-ink-950">{user.fullName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="uppercase">{user.locale}</TableCell>
              <TableCell data-numeric>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              <TableCell data-numeric>{user.balance}</TableCell>
              <TableCell>
                {/* Kredi workspace'te tutuluyor; kişisel workspace'i olmayan bir
                    profil satırı kredilenemez (bkz. getAdminUsers). */}
                {user.personalWorkspaceId ? (
                  <AddCreditsDialog
                    workspaceId={user.personalWorkspaceId}
                    subject={`${user.fullName} (${user.email})`}
                  />
                ) : (
                  <span aria-hidden>—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
