import { setRequestLocale, getTranslations } from "next-intl/server";

import { logoutAction } from "@/actions/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getWorkspaceContext } from "@/lib/dal";

export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const tTeam = await getTranslations("dashboard.team");
  const tPlan = await getTranslations("dashboard.plan");
  const tUserMenu = await getTranslations("dashboard.userMenu");

  const [currentUser, { workspace, subscription }] = await Promise.all([
    getCurrentUser(),
    getWorkspaceContext(),
  ]);

  return (
    <>
      <PageHeader title={t("pages.settings.title")} description={t("pages.settings.description")} />
      <div className="max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{currentUser.full_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body text-stone-600">{currentUser.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{workspace.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-body text-stone-600">{tPlan(subscription.plan)}</p>
            <RoleBadge role={workspace.role}>{tTeam(`role.${workspace.role}`)}</RoleBadge>
          </CardContent>
        </Card>

        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            {tUserMenu("signOut")}
          </Button>
        </form>
      </div>
    </>
  );
}
