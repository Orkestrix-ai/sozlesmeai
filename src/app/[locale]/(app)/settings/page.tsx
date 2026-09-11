import { setRequestLocale, getTranslations } from "next-intl/server";

import { logoutAction } from "@/actions/auth";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getWorkspaceContext } from "@/lib/dal";
import { isPlatformAdmin } from "@/lib/admin/dal";

export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const tCredits = await getTranslations("dashboard.credits");
  const tUserMenu = await getTranslations("dashboard.userMenu");
  const tAdmin = await getTranslations("admin");

  const [currentUser, { workspace, credits }, isAdmin] = await Promise.all([
    getCurrentUser(),
    getWorkspaceContext(),
    isPlatformAdmin(),
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
          <CardContent className="space-y-3">
            <p className="text-body text-stone-600">
              {tCredits("balanceValue", { count: credits.balance })}
            </p>
            {/* Ödeme sağlayıcısı entegre değil — çalışmayan bir "yükle"
                butonu koymak yerine durum olduğu gibi yazılır. */}
            <p className="text-helper text-stone-600">{tCredits("topUpSoon")}</p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Button asChild variant="secondary">
            <Link href="/admin">{tAdmin("adminLink")}</Link>
          </Button>
        )}

        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            {tUserMenu("signOut")}
          </Button>
        </form>
      </div>
    </>
  );
}
