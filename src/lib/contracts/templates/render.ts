import type { AppLocale } from "@/i18n/routing";
import type { ContractSection } from "@/lib/contracts/schema";

import type { ContractTemplate, TemplateField, TemplateValues } from "./types";

/**
 * Şablon + form değerleri → `ContractSection[]`.
 *
 * SAF tutulur: `next-intl` bağımlılığı YOK. Çözülmüş etiketler dışarıdan
 * girer, çünkü aynı fonksiyon iki yerde çalışır ve ikisinin de AYNI metni
 * üretmesi gerekir:
 *   - istemcide, her tuş vuruşunda canlı ön izleme için (template-builder.tsx)
 *   - sunucuda, DB'ye yazılacak sürümü üretmek için (actions/templates.ts)
 * Etiketleri burada çözseydik bu modül ya "use client" ya `server-only`
 * olurdu; ikisi de olamazdı.
 */

export type TemplateLabels = {
  /** field.name → çözülmüş etiket */
  fieldLabels: Record<string, string>;
  /** field.name → { option.value → çözülmüş etiket } */
  optionLabels: Record<string, Record<string, string>>;
  /** article.key → çözülmüş başlık */
  articleTitles: Record<string, string>;
  /** "[{label} girilmedi]" — zorunlu ama boş alanın belgedeki yumuşak karşılığı */
  missingPattern: string;
  /** isteğe bağlı ve boş alanın karşılığı (tire) */
  emptyOptional: string;
};

const TOKEN = /\{\{(\w+)\}\}/g;

function intlLocale(locale: AppLocale): string {
  return locale === "en" ? "en-GB" : "tr-TR";
}

/**
 * `<input type="date">` her zaman "YYYY-MM-DD" verir. UTC'ye sabitlenir —
 * aksi halde sunucu ile tarayıcının saat dilimi ayrıştığında aynı değer iki
 * farklı güne düşebilir ve ön izleme ile kaydedilen metin ayrışır.
 */
function formatDate(raw: string, locale: AppLocale): string {
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatNumber(raw: string, locale: AppLocale): string {
  const parsed = Number(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(parsed)) return raw;
  return new Intl.NumberFormat(intlLocale(locale)).format(parsed);
}

/** Ham form değerini belgeye girecek biçime çevirir. Boş değerle çağrılmaz. */
export function formatFieldValue(
  field: TemplateField,
  raw: string,
  locale: AppLocale,
  labels: TemplateLabels,
): string {
  const value = raw.trim();
  switch (field.type) {
    case "date":
      return formatDate(value, locale);
    case "number":
      return formatNumber(value, locale);
    case "select":
      return labels.optionLabels[field.name]?.[value] ?? value;
    default:
      return value;
  }
}

function isFilled(values: TemplateValues, name: string): boolean {
  return (values[name] ?? "").trim().length > 0;
}

/** Zorunlu ama doldurulmamış alanlar — requirement §6'nın sayacı bunu sayar. */
export function missingRequiredFields(
  template: ContractTemplate,
  values: TemplateValues,
): TemplateField[] {
  return template.fields.filter((field) => field.required && !isFilled(values, field.name));
}

function articlesFor(template: ContractTemplate, locale: AppLocale) {
  return template.content[locale] ?? template.content.tr;
}

export function renderTemplateSections(
  template: ContractTemplate,
  values: TemplateValues,
  locale: AppLocale,
  labels: TemplateLabels,
): ContractSection[] {
  const fieldsByName = new Map(template.fields.map((field) => [field.name, field]));
  const sections: ContractSection[] = [];

  for (const article of articlesFor(template, locale)) {
    if (article.omitWhenEmpty && !isFilled(values, article.omitWhenEmpty)) continue;

    const missing: string[] = [];

    const body = article.body.replace(TOKEN, (_match, name: string) => {
      const field = fieldsByName.get(name);
      const label = labels.fieldLabels[name] ?? name;
      // Şablonda var olmayan bir alana atıf: tokeni olduğu gibi bırakmaktansa
      // etiketi yaz — belge hiçbir koşulda "{{foo}}" göstermemeli.
      if (!field) return label;

      if (isFilled(values, name)) {
        return formatFieldValue(field, values[name], locale, labels);
      }
      if (field.required) {
        // FR-04: eksik bilgi UYDURULMAZ, açıkça işaretlenir. Belgede kırmızı
        // hata değil yumuşak yer tutucu (requirement §7); uyarı form tarafında.
        if (!missing.includes(label)) missing.push(label);
        return labels.missingPattern.replace("{label}", label);
      }
      return labels.emptyOptional;
    });

    sections.push({
      key: article.key,
      title: labels.articleTitles[article.key] ?? article.key,
      body,
      status: "draft",
      missing,
      lastEditedBy: "user",
    });
  }

  return sections;
}

/**
 * `contracts.title` — şablon adı + varsa karşı tarafın adı. Arşivde on tane
 * "Kira sözleşmesi" yerine ayırt edilebilir bir satır çıksın diye.
 */
export function buildContractTitle(
  template: ContractTemplate,
  values: TemplateValues,
  templateName: string,
): string {
  const counterparty = template.titleField ? (values[template.titleField] ?? "").trim() : "";
  return counterparty ? `${templateName} — ${counterparty}` : templateName;
}
