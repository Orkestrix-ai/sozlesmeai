import type { Metadata } from "next";
import { Inter, Inter_Tight, Source_Serif_4 } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import { routing } from "@/i18n/routing";
import "../globals.css";

// design.md §4 — başlıklar: karakteri güçlü modern grotesk.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// design.md §4 — gövde: yüksek okunabilirlikte nötr sans.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// design.md §4 — sözleşme metni: belge okumasına uygun, sakin serif.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  // `[locale]` catch-all DEĞİL, TEK segmentlik bir dinamik segment (bu yüzden
  // yalnızca `/xx` gibi tek segmentli yollarda bu layout çalışır ve buraya
  // gelir; `/xx/herhangi-bir-şey` gibi iki+ segmentli hiçbir page.tsx'e
  // karşılık gelmeyen yollar bu layout'a HİÇ uğramadan doğrudan
  // `src/app/global-not-found.tsx`'e düşer — bkz. o dosyadaki not).
  // Geçersiz tek-segment locale'lerde 404 döndür, varsayılana sessizce düşme.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Statik render için isteğin locale'ini önbelleğe yaz.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${interTight.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
