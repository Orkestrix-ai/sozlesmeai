import { Unlink } from "lucide-react";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { StatusView } from "@/components/feedback/status-view";
import { BackButton } from "@/components/feedback/back-button";

/**
 * `[locale]` bir catch-all gibi davrandığı için (bkz. `layout.tsx`), bu dosya
 * landing, `(auth)` ve `s/[token]` altındaki her `notFound()` çağrısını VE
 * eşleşmeyen `/tr/...` yollarını kapsar — plan §4 Katman 1.
 *
 * `not-found.js` prop ALMAZ; locale'i `next/root-params`'tan okuyoruz
 * (CLAUDE.md'nin işaret ettiği yol, Next 16.3'te geldi). `getTranslations`'a
 * locale'i AÇIKÇA veriyoruz — yoksa varsayılan `en`'e düşer ve TR ziyaretçi
 * İngilizce metin görür.
 *
 * Header/Footer bilerek EKLENMEDİ: header'ın kendi kırmızı CTA'sı var,
 * eklenirse ekranda iki kırmızı birincil aksiyon olurdu (design.md §3/§5).
 */
export default async function LocaleNotFound() {
  const locale = await rootLocale();
  const t = await getTranslations({ locale, namespace: "errors.page" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <StatusView
      icon={<Unlink />}
      title={t("notFound.title")}
      description={t("notFound.description")}
      primaryAction={
        <Button asChild>
          <Link href="/">{t("actions.home")}</Link>
        </Button>
      }
      secondaryAction={<BackButton label={t("actions.back")} />}
      quickLinks={
        <>
          <p className="text-helper text-stone-400">{t("quickLinksTitle")}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-body">
            <li>
              <Link
                href={{ pathname: "/", hash: "how-it-works" }}
                className="text-stone-600 hover:text-ink-950"
              >
                {tNav("how")}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: "/", hash: "pricing" }}
                className="text-stone-600 hover:text-ink-950"
              >
                {tNav("pricing")}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: "/", hash: "faq" }}
                className="text-stone-600 hover:text-ink-950"
              >
                {tNav("faq")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-stone-600 hover:text-ink-950">
                {tNav("login")}
              </Link>
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
  );
}
