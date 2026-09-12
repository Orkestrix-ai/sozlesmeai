"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { createFromTemplateAction } from "@/actions/templates";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DocumentPreview } from "@/components/templates/document-preview";
import { TemplateForm, fieldDomId } from "@/components/templates/template-form";
import {
  buildContractTitle,
  buildTemplateLabels,
  missingRequiredFields,
  renderTemplateSections,
  type ContractTemplate,
  type TemplateValues,
} from "@/lib/contracts/templates";

function initialValues(template: ContractTemplate): TemplateValues {
  const values: TemplateValues = {};
  for (const field of template.fields) {
    values[field.name] = field.defaultValue ?? "";
  }
  return values;
}

/**
 * Şablon doldurma ekranı — requirement §2/§4/§11.
 *
 * Veri akışı bilerek tek yönlü ve ara katmansız:
 *   input → values (state) → renderTemplateSections → sections → ContractDocument
 * Debounce YOK, sunucu gidiş-dönüşü YOK: kullanıcının her karakterinde belge
 * yeniden çizilir. `renderTemplateSections` saf ve ucuz (yalnızca metin
 * ikamesi), bu yüzden bunu taşımaya gerek duyulmadı.
 *
 * Yerleşim `contract-workspace.tsx` ile aynı: masaüstünde sol 2/5 form + sağ
 * belge, mobilde sekmeli tek kolon (design.md §11).
 */
function TemplateBuilder({
  template,
  locale,
}: {
  template: ContractTemplate;
  locale: AppLocale;
}) {
  const t = useTranslations("dashboard.templates");

  const [values, setValues] = React.useState<TemplateValues>(() => initialValues(template));
  const [showErrors, setShowErrors] = React.useState(false);
  const [formError, setFormError] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [mobileTab, setMobileTab] = React.useState<"form" | "preview">("form");

  const labels = React.useMemo(() => buildTemplateLabels(template, t), [template, t]);
  const sections = React.useMemo(
    () => renderTemplateSections(template, values, locale, labels),
    [template, values, locale, labels],
  );

  const missing = missingRequiredFields(template, values);
  const documentTitle = buildContractTitle(template, values, t(template.nameKey));

  const handleChange = React.useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const focusField = (name: string) => {
    setMobileTab("form");
    const node = document.getElementById(fieldDomId(name));
    node?.focus();
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const submit = () => {
    if (missing.length > 0) {
      setShowErrors(true);
      focusField(missing[0].name);
      return;
    }
    setFormError(false);
    startTransition(async () => {
      // Başarılı olduğunda action redirect() atar ve buraya hiç dönmez.
      const result = await createFromTemplateAction(template.id, values);
      if (result?.fieldErrors) {
        setShowErrors(true);
        return;
      }
      if (result?.formError) setFormError(true);
    });
  };

  return (
    <div className="flex h-[70dvh] min-h-[520px] flex-col overflow-hidden rounded-[var(--radius)] border border-stone-200 lg:h-[78dvh] lg:flex-row">
      <div className="contract-toolbar flex border-b border-stone-200 bg-paper-50 lg:hidden">
        {(["form", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={
              mobileTab === tab
                ? "flex-1 border-b-2 border-brand-red-600 py-2.5 text-center text-body font-medium text-ink-950"
                : "flex-1 border-b-2 border-transparent py-2.5 text-center text-body text-stone-600"
            }
          >
            {tab === "form" ? t("builder.tabForm") : t("builder.tabPreview")}
          </button>
        ))}
      </div>

      <div
        className={`contract-form-panel flex min-h-0 flex-col bg-paper-50 lg:w-2/5 lg:shrink-0 lg:border-r lg:border-stone-200 ${
          mobileTab === "form" ? "flex-1" : "hidden lg:flex"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-5">
          {missing.length > 0 ? (
            <Alert variant="warning" className="mb-6">
              <AlertDescription>
                {t("builder.missingCount", { count: missing.length })}
              </AlertDescription>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {missing.map((field) => (
                  <button
                    key={field.name}
                    type="button"
                    onClick={() => focusField(field.name)}
                    className="rounded-full border border-state-warning-text/25 px-2.5 py-1 text-helper text-state-warning-text hover:bg-state-warning-surface"
                  >
                    {t(field.labelKey)}
                  </button>
                ))}
              </div>
            </Alert>
          ) : (
            <Alert variant="success" className="mb-6">
              <AlertDescription>{t("builder.complete")}</AlertDescription>
            </Alert>
          )}

          <TemplateForm
            template={template}
            values={values}
            onChange={handleChange}
            showErrors={showErrors}
            disabled={pending}
          />
        </div>

        <div className="border-t border-stone-200 bg-paper-50 p-4">
          {formError && (
            <p className="mb-3 text-helper text-state-error">{t("builder.error")}</p>
          )}
          <Button onClick={submit} disabled={pending} className="w-full">
            {t("builder.submit")}
          </Button>
          <p className="mt-2.5 text-helper text-stone-600">{t("builder.submitHelp")}</p>
          <p className="mt-1 text-helper text-stone-600">{t("builder.nextSteps")}</p>
          <Link
            href="/contracts/new"
            className="mt-3 inline-flex items-center gap-1 text-helper text-stone-600 underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {t("builder.backToGallery")}
          </Link>
        </div>
      </div>

      <div className={`min-h-0 flex-1 ${mobileTab === "preview" ? "flex-1" : "hidden lg:flex"}`}>
        <DocumentPreview title={documentTitle} sections={sections} />
      </div>
    </div>
  );
}

export { TemplateBuilder };
