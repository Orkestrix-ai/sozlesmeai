"use client";

import { useTranslations } from "next-intl";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_GROUPS, type ContractTemplate, type TemplateField, type TemplateValues } from "@/lib/contracts/templates";

/** Alan adından DOM id'si — eksik bilgi çipleri buradan odaklanır. */
export function fieldDomId(name: string): string {
  return `tf-${name}`;
}

/**
 * Şablona göre kendini kuran form (requirement §3). Hiçbir alan burada
 * isimle geçmez; her şey `template.fields`ten okunur, dolayısıyla yeni bir
 * şablon eklemek bu dosyaya dokunmayı gerektirmez.
 *
 * Alanlar `group`a göre fieldset'lere bölünür (requirement §8: tek yığın uzun
 * form yok). Bir grupta hiç alan yoksa o fieldset hiç çizilmez.
 */
function TemplateForm({
  template,
  values,
  onChange,
  showErrors,
  disabled,
}: {
  template: ContractTemplate;
  values: TemplateValues;
  onChange: (name: string, value: string) => void;
  /** Gönderme denenmeden önce boş formda kullanıcıya bağırmayız. */
  showErrors: boolean;
  disabled: boolean;
}) {
  const t = useTranslations("dashboard.templates");
  const tValidation = useTranslations("validation");

  // aria-invalid kontrole Field tarafından klonlanarak geçirilir (bkz. field.tsx),
  // bu yüzden burada hata durumunu ayrıca taşımaya gerek yok.
  const renderControl = (field: TemplateField) => {
    const value = values[field.name] ?? "";
    const placeholder = field.placeholderKey ? t(field.placeholderKey) : undefined;
    const shared = {
      name: field.name,
      value,
      disabled,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
      ) => onChange(field.name, event.target.value),
    };

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            {...shared}
            placeholder={placeholder}
            maxLength={field.maxLength}
            rows={field.name === "specialTerms" ? 5 : 3}
          />
        );
      case "select":
        return (
          <Select {...shared}>
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        );
      case "date":
        return <Input {...shared} type="date" />;
      case "number":
        return <Input {...shared} type="number" inputMode="decimal" min={0} placeholder={placeholder} />;
      default:
        return (
          <Input {...shared} type="text" autoComplete="off" maxLength={field.maxLength} placeholder={placeholder} />
        );
    }
  };

  return (
    <div className="space-y-7">
      {FIELD_GROUPS.map((group) => {
        const fields = template.fields.filter((field) => field.group === group);
        if (fields.length === 0) return null;

        return (
          <fieldset key={group} className="space-y-4" disabled={disabled}>
            <legend className="mb-3 text-helper font-semibold uppercase tracking-wider text-stone-600">
              {t(`groups.${group}`)}
            </legend>

            {fields.map((field) => {
              const empty = (values[field.name] ?? "").trim().length === 0;
              const invalid = showErrors && field.required && empty;
              return (
                <Field
                  key={field.name}
                  id={fieldDomId(field.name)}
                  label={t(field.labelKey)}
                  required={field.required}
                  description={field.required ? undefined : t("builder.optional")}
                  error={invalid ? tValidation("required") : undefined}
                >
                  {renderControl(field)}
                </Field>
              );
            })}
          </fieldset>
        );
      })}
    </div>
  );
}

export { TemplateForm };
