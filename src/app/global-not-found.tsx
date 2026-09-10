import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { StatusView } from "@/components/feedback/status-view";
import { BackButton } from "@/components/feedback/back-button";
import { Unlink } from "lucide-react";
import "./globals.css";

/**
 * plan §4 Katman 3 — hiçbir rotaya UYMAYAN URL'ler buraya düşer.
 * `next.config.ts`da `experimental.globalNotFound: true` gerektirir.
 *
 * ÖNEMLİ düzeltme (uygulama sırasında keşfedildi): `[locale]` KATMANLI bir
 * catch-all DEĞİL, tek segmentlik bir dinamik segment. Bu yüzden `/tr/xyz`
 * gibi İKİ segmentli, hiçbir page.tsx'e karşılık gelmeyen yollar
 * `[locale]/layout.tsx`'e HİÇ uğramadan doğrudan BURAYA düşüyor — yani bu
 * dosya, `[locale]/not-found.tsx` değil, gerçek dünyada en sık görülen "URL
 * yanlış yazıldı" senaryosunun asıl karşılayıcısı. Bu yüzden quickLinks/geri
 * dön burada da var, ilk yazımda planlanandan daha zengin.
 *
 * Next.js docs (not-found.md:51): bu dosya `[locale]/layout.tsx`'i ATLAR —
 * kendi `<html>`/`<body>`'sini basar, `globals.css`'i kendi import eder.
 * `NextIntlClientProvider` yok, `setRequestLocale` yok (segment/route yok);
 * locale `resolveLocale()`'da açıklanan sırayla okunur (aşağıya bkz.) —
 * `.pdf` gibi noktalı yollar `proxy.ts`'nin matcher'ını hiç geçmediği için
 * onlarda yalnızca çerez/`Accept-Language` kalır, bu kabul edilen bir sınırdır.
 *
 * Yalnızca Inter + Inter Tight yüklendi — Source Serif 4 sözleşme metni
 * içindir, burada gereksiz (doküman da "simpler font family" öneriyor).
 */
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap" });
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/**
 * URL'nin gerçek `/tr/...` veya `/en/...` önekini burada OKUYAMIYORUZ (bu
 * dosya routing'i atlıyor, `params` yok) — ama `src/proxy.ts` her isteği
 * `global-not-found.tsx`'e düşmeden ÖNCE next-intl'in kendi middleware'inden
 * geçiriyor, ve next-intl çözdüğü locale'i `x-next-intl-locale` başlığına
 * yazıyor (next-intl'in kendi `getRequestLocale()`'ı da AYNI başlığı okur —
 * bkz. `node_modules/next-intl/dist/.../RequestLocale.js`). Bu, paketin genel
 * export'larından biri DEĞİL ama kütüphanenin kendi iç sözleşmesi; adres
 * çubuğundaki dille bire bir eşleşen tek sinyal bu olduğu için tercih
 * ediliyor. Sırayla: bu başlık → `NEXT_LOCALE` çerezi (next-intl'in kalıcı
 * tercih çerezi) → `Accept-Language` → varsayılan.
 */
async function resolveLocale() {
  const h = await headers();

  const fromNextIntlHeader = h.get("x-next-intl-locale");
  if (hasLocale(routing.locales, fromNextIntlHeader)) {
    return fromNextIntlHeader;
  }

  const cookieMatch = h.get("cookie")?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const fromCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : undefined;
  if (hasLocale(routing.locales, fromCookie)) {
    return fromCookie;
  }

  const acceptLanguage = h.get("accept-language") ?? "";
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.trim();
  return hasLocale(routing.locales, preferred) ? preferred : routing.defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "errors.page" });
  return { title: t("notFound.title") };
}

const QUICK_LINK_CLASS = "text-stone-600 hover:text-ink-950";

export default async function GlobalNotFound() {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "errors.page" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={locale} className={`${inter.variable} ${interTight.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper-50 font-sans text-stone-800">
        <StatusView
          icon={<Unlink />}
          title={t("notFound.title")}
          description={t("notFound.description")}
          primaryAction={
            <a
              href={`/${locale}`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] bg-brand-red-600 px-4 text-button font-semibold text-paper-50 hover:bg-brand-red-700"
            >
              {t("actions.home")}
            </a>
          }
          secondaryAction={<BackButton label={t("actions.back")} />}
          quickLinks={
            <>
              <p className="text-helper text-stone-400">{t("quickLinksTitle")}</p>
              <ul className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-body">
                <li>
                  <a href={`/${locale}#how-it-works`} className={QUICK_LINK_CLASS}>
                    {tNav("how")}
                  </a>
                </li>
                <li>
                  <a href={`/${locale}#pricing`} className={QUICK_LINK_CLASS}>
                    {tNav("pricing")}
                  </a>
                </li>
                <li>
                  <a href={`/${locale}#faq`} className={QUICK_LINK_CLASS}>
                    {tNav("faq")}
                  </a>
                </li>
                <li>
                  <a href={`/${locale}/login`} className={QUICK_LINK_CLASS}>
                    {tNav("login")}
                  </a>
                </li>
              </ul>
            </>
          }
          reference={{
            code: "REF-404",
            label: t("reference", { code: "REF-404" }),
            hint: t("referenceHint"),
          }}
        />
      </body>
    </html>
  );
}
