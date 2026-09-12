import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { TemplateBuilder } from "@/components/templates/template-builder";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AppLocale } from "@/i18n/routing";
import { getActiveTemplates, getTemplate } from "@/lib/contracts/templates";
import { getWorkspaceContext } from "@/lib/dal";

/** Şablonlar statik veri — beş yolun tamamı önceden üretilebilir. */
export function generateStaticParams() {
  return getActiveTemplates().map((template) => ({ templateId: template.id }));
}

export default async function TemplateBuilderPage({
  params,
}: PageProps<"/[locale]/templates/[templateId]">) {
  const { locale, templateId } = await params;
  setRequestLocale(locale);

  // getTemplate yalnızca "active" şablonu döndürür: yayından kaldırılmış bir
  // şablona derin bağlantıyla ulaşılamamalı.
  const template = getTemplate(templateId);
  if (!template) notFound();

  const t = await getTranslations("dashboard.templates");
  const tErrors = await getTranslations("errors");
  const { workspace } = await getWorkspaceContext();

  return (
    <>
      <PageHeader title={t(template.nameKey)} description={t(template.descriptionKey)} />
      {workspace.role === "viewer" ? (
        <Alert variant="neutral" className="max-w-lg">
          <AlertDescription>{tErrors("unauthorized")}</AlertDescription>
        </Alert>
      ) : (
        <TemplateBuilder template={template} locale={locale as AppLocale} />
      )}
    </>
  );
}
