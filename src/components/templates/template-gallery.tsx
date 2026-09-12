import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CATEGORY_ICONS } from "@/components/templates/template-icons";
import { getActiveTemplates } from "@/lib/contracts/templates";

/**
 * Hazır sözleşme galerisi — `/templates`.
 *
 * Kartların aksiyonu bilerek `secondary`: design.md §3 "kullanıcıyı aynı anda
 * birden fazla kırmızı CTA ile karşılaştırma" der, beş kırmızı buton tam
 * olarak o olurdu. Seçim kartın kendisidir; kırmızı, akışın sonundaki
 * "Sözleşmeyi oluştur" adımına saklanır.
 */
function TemplateGallery({ limit }: { limit?: number }) {
  const t = useTranslations("dashboard.templates");
  const templates = limit ? getActiveTemplates().slice(0, limit) : getActiveTemplates();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => {
        const Icon = CATEGORY_ICONS[template.category];
        return (
          <Card key={template.id} className="flex flex-col">
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-stone-200 bg-paper-100 text-stone-600">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-paper-100 px-2.5 py-1 text-helper text-stone-600">
                {t(`categories.${template.category}`)}
              </span>
            </div>

            <CardTitle className="text-ink-950">{t(template.nameKey)}</CardTitle>
            <CardDescription className="mt-1.5 flex-1">
              {t(template.descriptionKey)}
            </CardDescription>

            <div className="mt-5">
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/templates/${template.id}`}>{t("gallery.start")}</Link>
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export { TemplateGallery };
