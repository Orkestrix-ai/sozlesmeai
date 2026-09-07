import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function TemplatesPage({ params }: PageProps<"/[locale]/templates">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");

  return (
    <>
      <PageHeader title={t("pages.templates.title")} description={t("pages.templates.description")} />
      <EmptyState
        title={t("empty.templates.title")}
        body={t("empty.templates.body")}
        ctaLabel={t("empty.templates.cta")}
        ctaHref="/contracts/new"
      />
    </>
  );
}
