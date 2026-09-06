import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  // Ürünün ana pazarı Türkiye; design.md'deki tüm arayüz metinleri Türkçe yazıldı.
  defaultLocale: "tr",
});

export type AppLocale = (typeof routing.locales)[number];

export const localeNames: Record<AppLocale, string> = {
  tr: "Türkçe",
  en: "English",
};
