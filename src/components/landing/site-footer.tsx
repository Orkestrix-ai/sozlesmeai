import { useTranslations } from "next-intl";

import { Container } from "@/components/landing/container";

const COLUMNS = [
  { title: "productTitle", links: ["how", "pricing", "faq"] },
  { title: "companyTitle", links: ["about", "contact"] },
  { title: "legalTitle", links: ["privacy", "terms"] },
] as const;

const HREFS: Record<string, string> = {
  how: "#how-it-works",
  pricing: "#pricing",
  faq: "#faq",
  about: "#product",
  contact: "#final-cta",
  privacy: "#faq",
  terms: "#faq",
};

/**
 * Footer design.md'de ayrıca tanımlanmadı; landing'i ink-950 ile açıp
 * ink-950 ile kapatmak için aynı koyu marka yüzeyi kullanıldı.
 *
 * Not: kurumsal ve yasal bağlantılar Faz 1'de gerçek sayfalara değil,
 * sayfa içi bölümlere işaret ediyor. İlgili sayfalar açıldığında
 * `HREFS` güncellenmeli.
 */
export function SiteFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-950 py-14">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <p className="font-heading text-card-title font-bold tracking-tight text-paper-50">
              {tNav("brand")}
            </p>
            <p className="mt-3 max-w-xs text-helper leading-relaxed text-stone-400">
              {t("tagline")}
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-helper font-semibold text-paper-50">
                {t(column.title)}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href={HREFS[link]}
                      className="text-helper text-stone-400 transition-colors hover:text-paper-50"
                    >
                      {t(`links.${link}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Koyu yüzeyde stone-400: stone-600 AA kontrast eşiğini geçmiyor. */}
        <div className="mt-12 flex flex-col gap-2 border-t border-ink-800 pt-6 text-helper text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p data-numeric>
            © {year} {tNav("brand")}. {t("rights")}
          </p>
          <p>{t("disclaimer")}</p>
        </div>
      </Container>
    </footer>
  );
}
