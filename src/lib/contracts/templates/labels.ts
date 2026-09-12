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
 *
 * DİKKAT — bu tip next-intl'in ANAHTAR BAZLI argüman denetimini devre dışı
 * bırakır. Gerçek `t`, `{label}` isteyen bir mesajı argümansız çağırmayı
 * DERLEME hatası yapar; bu imza ise "her anahtar argümansız çağrılabilir"
 * dediği için `tsc` susar ve hata çalışma zamanına kalır. `fieldPlaceholder`
 * tam olarak böyle kaçtı (FORMATTING_ERROR).
 *
 * Bu yüzden: bu tiple çağrılan her anahtarın argümansız çalıştığı ELLE
 * doğrulanmalı. Argüman isteyen bir mesaj gerekiyorsa `raw` kullanın (aşağıya
 * bakın) ya da o değeri buradan değil, çağıran bileşenden geçirin.
 *
 * Tipi next-intl kadar hassas yapmak, onun genel tip parametrelerini
 * kopyalamayı gerektirir — bu projede daha önce TS2590 ("union type too
 * complex") üretmiş bir yol. Bilerek yapılmadı.
 */
export type Translate = ((key: MessageKey) => string) & {
  raw: (key: MessageKey) => unknown;
};

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
    // `t()` DEĞİL `t.raw()`: burada istenen şey doldurulmuş bir cümle değil,
    // `{label}` boşluğu DURAN bir KALIP — boşluğu renderTemplateSections her
    // alan için ayrı ayrı dolduruyor (render.ts). `t()` ICU'yu işler ve
    // doldurulmamış boşluk bulunca FORMATTING_ERROR atar; `raw()` mesajı
    // olduğu gibi döndürür, zaten tam olarak bunun için var.
    // Buraya `t()` geri konursa hata aynen döner.
    missingPattern: String(t.raw("builder.fieldPlaceholder")),
    emptyOptional: t("builder.emptyOptional"),
  };
}
