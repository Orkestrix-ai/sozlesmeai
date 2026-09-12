import type { useTranslations } from "next-intl";

import type { AppLocale } from "@/i18n/routing";

/**
 * `messages/*.json` → `dashboard.templates` altındaki TAM yol (yaprak DEĞİL).
 *
 * Gerekçe `src/components/landing/pricing-section.tsx`'teki `PLANS` yorumunun
 * aynısı: anahtar bir diziden kurulup şablon literalinde birleştirildiğinde
 * (`` t(`items.${id}.name`) ``) `.map` içindeki destructuring anahtarı
 * sahibinden kopartır, `t()` çapraz-çarpım olarak denetlenir ve var olmayan
 * yollar uydurur. Tam yolu literal olarak saklamak bunu kökünden keser.
 *
 * Namespace'e DARALTILDI (kök `useTranslations()` değil): `global.d.ts`in
 * `AppConfig["Messages"]` ilavesiyle birlikte kök anahtar birleşimi 800+
 * yaprakta TS2590 ("union type that is too complex to represent") veriyor.
 * `dashboard.templates` altındaki alt ağaç ise rahatça temsil edilebiliyor.
 */
export type MessageKey = Parameters<ReturnType<typeof useTranslations<"dashboard.templates">>>[0];

export type TemplateFieldType = "text" | "textarea" | "number" | "date" | "select";

/**
 * Formun fieldset bölümlemesi (requirement §8: kullanıcıyı tek yığın uzun
 * formla karşı karşıya bırakma). Sıra burada sabit; her şablon yalnızca
 * kullandığı grupları doldurur, boş grup hiç çizilmez.
 */
export const FIELD_GROUPS = ["parties", "subject", "financial", "term", "other"] as const;
export type TemplateFieldGroup = (typeof FIELD_GROUPS)[number];

export type TemplateFieldOption = {
  value: string;
  labelKey: MessageKey;
};

export type TemplateField = {
  name: string;
  type: TemplateFieldType;
  group: TemplateFieldGroup;
  labelKey: MessageKey;
  placeholderKey?: MessageKey;
  required: boolean;
  defaultValue?: string;
  /** yalnızca type: "select" */
  options?: readonly TemplateFieldOption[];
  maxLength?: number;
};

export type TemplateArticle = {
  /**
   * `ContractSection.key` olur. `contract_types.section_keys` ile birebir
   * tutulur ki AI şablondan doğan bir sözleşmeyi düzenlerken aynı bölüm
   * anahtarlarını kullansın, paralel bir isimlendirme icat etmesin.
   */
  key: string;
  titleKey: MessageKey;
  /** `{{fieldName}}` yer tutucuları taşıyan düz metin. Fonksiyon değil VERİ. */
  body: string;
  /** Bu alan boşsa madde belgeye hiç girmez (ör. "Özel Şartlar"). */
  omitWhenEmpty?: string;
};

export const TEMPLATE_CATEGORIES = [
  "lease",
  "employment",
  "confidentiality",
  "services",
  "hr",
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export type ContractTemplate = {
  id: string;
  /** `contracts.contract_type` — `contract_types(code)` FK değeri. */
  contractTypeCode: string;
  category: TemplateCategory;
  nameKey: MessageKey;
  descriptionKey: MessageKey;
  version: number;
  status: "active" | "draft" | "deprecated";
  fields: readonly TemplateField[];
  /**
   * `contracts.title` kuyruğuna eklenecek karşı taraf alanı — arşivde on tane
   * aynı adlı satır olmasın diye. Bkz. render.ts `buildContractTitle`.
   */
  titleField?: string;
  /**
   * Madde metinleri locale başına. `messages/*.json`'da DEĞİL: bu metin
   * arayüz değil, DB'ye bir kez yazılıp orada donan BELGE İÇERİĞİ (AI'ın
   * ürettiği `section.body` de hiçbir zaman i18n anahtarı değildir). Aynı
   * gerekçe `src/lib/ai/prompts.ts`'te `RULES_TR`/`RULES_EN` için yazılı.
   *
   * İmza bloğundaki taraf başlıkları burada tanımlanmaz — `parties` maddesinin
   * "Rol: değer" satırlarından `document-model.ts`'teki `partyLabels()`
   * türetir. Bu yüzden her şablonun ilk maddesi `parties` olmalı ve rol
   * satırları `Kiraya Veren: {{...}}` biçiminde yazılmalıdır.
   */
  content: Record<AppLocale, readonly TemplateArticle[]>;
};

export type TemplateValues = Record<string, string>;
