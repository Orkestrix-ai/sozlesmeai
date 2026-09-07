import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function AppNotFound() {
  const t = await getTranslations("errors");
  const tNav = await getTranslations("dashboardNav");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-body text-stone-600">{t("notFound")}</p>
      <Button asChild className="mt-4">
        <Link href="/dashboard">{tNav("overview")}</Link>
      </Button>
    </div>
  );
}
