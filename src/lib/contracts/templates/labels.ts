import type { TemplateLabels } from "./render";
import type { ContractTemplate, MessageKey } from "./types";

/**
 * `useTranslations("dashboard.templates")` ve
 * `await getTranslations("dashboard.templates")` çevirmenlerinin ORTAK yüzeyi.
 *
 * Yapısal olarak tanımlandı (next-intl'in kendi tipini ithal etmek yerine):
 * istemci hook'u ile sunucu fonksiyonunun döndürdüğü tipler birebir aynı
 * değil, ama ikisi de bu imzaya uyar. Böylece `buildTemplateLabels` tek bir
 * yerde durur ve iki tarafta da AYNI etiketleri üretir — ön izlemede görülen
 * metinle DB'ye yazılan metnin ayrışmaması buna bağlı.
 */
export type Translate = (key: MessageKey) => string;

export function buildTemplateLabels(template: ContractTemplate, t: Translate): TemplateLabels {
  const fieldLabels: Record<string, string> = {};
  const optionLabels: Record<string, Record<string, string>> = {};

  for (const field of template.fields) {
    fieldLabels[field.name] = t(field.labelKey);
    if (field.options) {
      const resolved: Record<string, string> = {};
      for (const option of field.options) {
        resolved[option.value] = t(option.labelKey);
      }
      optionLabels[field.name] = resolved;
    }
  }

  const articleTitles: Record<string, string> = {};
  // İki locale'in madde anahtarları aynı; başlıklar tek sözlükte toplanır ki
  // renderTemplateSections hangi dilde çalışırsa çalışsın başlığı bulsun.
  for (const articles of Object.values(template.content)) {
    for (const article of articles) {
      articleTitles[article.key] = t(article.titleKey);
    }
  }

  return {
    fieldLabels,
    optionLabels,
    articleTitles,
    missingPattern: t("builder.fieldPlaceholder"),
    emptyOptional: t("builder.emptyOptional"),
  };
}
