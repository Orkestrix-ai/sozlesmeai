"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CircleAlert } from "lucide-react";
import { Inter, Inter_Tight } from "next/font/google";
import { hasLocale } from "next-intl";

import { routing, type AppLocale } from "@/i18n/routing";
import { StatusView } from "@/components/feedback/status-view";
import trMessages from "../../messages/tr.json";
import enMessages from "../../messages/en.json";
import "./globals.css";

// `--font-sans`/`--font-heading` (globals.css) `var(--font-inter)`'i
// fallback'SIZ referans alıyor: bu değişken hiçbir yerde tanımlanmazsa
// (next/font render edilmezse) `font-family` bütünüyle geçersiz sayılır ve
// tarayıcı varsayılanına (serif) düşer — ui-sans-serif'e değil. Bu yüzden
// `global-not-found.tsx`'teki gibi burada da aynı iki font yükleniyor.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap" });
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/**
 * plan §4 Katman 4 — kök layout'un (`[locale]/layout.tsx`) KENDİSİ çöktüğünde
 * devreye girer. Kendi `<html>`/`<body>`'si zorunlu; `metadata` export
 * EDİLEMEZ (Next.js docs, error.md:167) — React `<title>` bileşeni kullanılır.
 *
 * `NextIntlClientProvider` bu noktada yok (çöken layout'un içindeydi), bu
 * yüzden mesaj dosyaları DOĞRUDAN import edilir — bu, dosya başında
 * belgelenen bilinçli tek istisna (plan §4 Katman 4). Locale, sunucu
 * snapshot'ında varsayılana düşer, istemcide `location.pathname`'in ilk
 * segmentinden okunur (`useSyncExternalStore`, aşağıda).
 */
const MESSAGES: Record<AppLocale, typeof trMessages> = {
  tr: trMessages,
  en: enMessages,
};

// Salt okunan bir dış değer (URL segmenti); `useEffect` içinde `setState`
// çağırıp render tetiklemek yerine `useSyncExternalStore` ile senkron okunur
// (react-hooks/set-state-in-effect) — bkz. `back-button.tsx`'teki aynı kalıp.
function getLocaleSnapshot(): AppLocale {
  const segment = window.location.pathname.split("/")[1];
  return hasLocale(routing.locales, segment) ? segment : routing.defaultLocale;
}
function getServerLocaleSnapshot(): AppLocale {
  return routing.defaultLocale;
}
function subscribeLocale() {
  return () => {};
}

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = MESSAGES[locale].errors.page;
  const tRetry = MESSAGES[locale].common.actions.retry;
  const referenceCode = error.digest ? `REF-${error.digest.slice(0, 8).toUpperCase()}` : null;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <head>
        <title>{t.unexpected.title}</title>
      </head>
      <body className="flex min-h-full flex-col bg-paper-50 font-sans text-stone-800">
        <StatusView
          icon={<CircleAlert />}
          title={t.unexpected.title}
          description={t.unexpected.description}
          primaryAction={
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] bg-brand-red-600 px-4 text-button font-semibold text-paper-50 hover:bg-brand-red-700"
            >
              {tRetry}
            </button>
          }
          reference={
            referenceCode
              ? {
                  code: referenceCode,
                  label: t.reference.replace("{code}", referenceCode),
                  hint: t.referenceHint,
                }
              : undefined
          }
        />
      </body>
    </html>
  );
}
