import { Unlink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { StatusView } from "@/components/feedback/status-view";
import { BackButton } from "@/components/feedback/back-button";

/**
 * Dashboard içinde eşleşmeyen alt rota (ör. `/contracts/olmayan-uuid` gibi
 * `notFound()` çağrıları) — sidebar korunur, `fullScreen={false}`
 * (plan §4 Katman 5).
 */
export default async function AppNotFound() {
  const t = await getTranslations("errors.page");
  const tDashboard = await getTranslations("dashboardNav");

  return (
    <StatusView
      fullScreen={false}
      icon={<Unlink />}
      title={t("notFound.title")}
      description={t("notFound.description")}
      primaryAction={
        <Button asChild>
          <Link href="/dashboard">{t("actions.dashboard")}</Link>
        </Button>
      }
      secondaryAction={<BackButton label={t("actions.back")} />}
      quickLinks={
        <>
          <p className="text-helper text-stone-400">{t("quickLinksTitle")}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-body">
            <li>
              <Link href="/contracts" className="text-stone-600 hover:text-ink-950">
                {tDashboard("contracts")}
              </Link>
            </li>
            <li>
              <Link href="/contracts/new" className="text-stone-600 hover:text-ink-950">
                {tDashboard("newContract")}
              </Link>
            </li>
            <li>
              <Link href="/archive" className="text-stone-600 hover:text-ink-950">
                {tDashboard("archive")}
              </Link>
            </li>
          </ul>
        </>
      }
      reference={{
        code: "REF-404",
        label: t("reference", { code: "REF-404" }),
        hint: t("referenceHint"),
      }}
    />
  );
}
