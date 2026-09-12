import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { CATEGORY_ICONS } from "@/components/templates/template-icons";
import { getActiveTemplates } from "@/lib/contracts/templates";

const STRIP_LIMIT = 4;

/**
 * Dashboard'daki "hazır sözleşmeler" şeridi.
 *
 * Metrik satırının hemen ALTINDA duruyor: design.md §7.2'nin açık amacı
 * "yeni sözleşmeye giden yolu tek tık uzakta tutmak". Kart grid'i yerine
 * tek satırlık liste biçimi ise aynı bölümün "sakin, düşük yoğunluk"
 * kuralını korur — galerinin tam hâli `/templates`te.
 *
 * Tek bir kırmızı öge yok: ekranın birincil aksiyonu dashboard'da kredi
 * kartıdır, burası bir kestirme.
 */
function ReadyTemplatesStrip() {
  const t = useTranslations("dashboard.templates");
  const templates = getActiveTemplates().slice(0, STRIP_LIMIT);

  if (templates.length === 0) return null;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-card-title font-heading text-ink-950">{t("gallery.stripTitle")}</h2>
          <p className="mt-1 text-helper text-stone-600">{t("gallery.stripDescription")}</p>
        </div>
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-1 text-helper font-medium text-ink-900 underline-offset-4 hover:underline"
        >
          {t("gallery.seeAll")}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {templates.map((template) => {
          const Icon = CATEGORY_ICONS[template.category];
          return (
            <li key={template.id}>
              <Link
                href={`/templates/${template.id}`}
                className="flex items-center gap-3 rounded-[var(--radius)] border border-stone-200 px-3 py-2.5 transition-colors hover:bg-paper-100"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius)] bg-paper-100 text-stone-600">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-ink-950">
                    {t(template.nameKey)}
                  </span>
                  <span className="block text-helper text-stone-600">
                    {t(`categories.${template.category}`)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export { ReadyTemplatesStrip };
