import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function RemindersPage({ params }: PageProps<"/[locale]/reminders">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");

  return (
    <>
      <PageHeader title={t("pages.reminders.title")} description={t("pages.reminders.description")} />
      <EmptyState
        title={t("empty.reminders.title")}
        body={t("empty.reminders.body")}
        ctaLabel={t("empty.reminders.cta")}
        ctaHref="/contracts"
      />
    </>
  );
}
