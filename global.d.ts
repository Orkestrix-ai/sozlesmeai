import type messages from "./messages/tr.json";

/**
 * next-intl v4 `AppConfig` declaration merging — `useTranslations` /
 * `getTranslations` anahtarlarını `tsc`'ye doğrulatır. Silinen veya yeniden
 * adlandırılan bir anahtar artık runtime `MISSING_MESSAGE` hatası değil,
 * derleme hatası verir.
 *
 * Şema kaynağı `tr.json`: varsayılan locale o ve metinler TR-öncelikli
 * yazılıyor. `en.json` ile parite bu tipin GÖREMEDİĞİ bir şey — onu
 * `npm run check:i18n` denetler.
 *
 * `Locale` bilerek daraltılmadı: her sayfanın `await params`ten gelen `locale`i
 * `string` olduğu için `setRequestLocale(locale)` çağrılarının hepsi cast
 * isterdi — kazancı yok, gürültüsü çok. Locale doğrulaması zaten
 * `[locale]/layout.tsx`teki `hasLocale` kontrolünde yapılıyor.
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
