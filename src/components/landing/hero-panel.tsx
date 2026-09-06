import { useTranslations } from "next-intl";
import { Check, CircleAlert } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";

/**
 * design.md §6.2 — hero'nun sağ tarafı.
 *
 * Bilinçli olarak SOYUT BİR AI GÖRSELİ DEĞİL: gerçek sözleşme oluşturma
 * ekranını (design.md §8) andıran, soru-cevap + taslak + ilerleme gösteren
 * statik bir panel. Robot/beyin/sihirli değnek görseli eklemeyin.
 */
export function HeroPanel() {
  const t = useTranslations("hero.panel");

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-card">
      {/* Panel başlığı */}
      <div className="flex items-center justify-between gap-4 border-b border-ink-800 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-helper font-semibold text-paper-50">
            {t("title")}
          </p>
          <p className="mt-0.5 truncate text-helper text-stone-400">
            <span data-numeric>{t("stepLabel")}</span> · {t("stepName")}
          </p>
        </div>
        <StatusBadge status="draft">{t("statusValue")}</StatusBadge>
      </div>

      {/* Sol panel karşılığı: bilgi toplama (design.md §8) */}
      <div className="space-y-3 px-5 py-5">
        <div className="max-w-[85%]">
          <p className="mb-1.5 text-helper text-stone-400">
            {t("assistantLabel")}
          </p>
          <div className="rounded-[var(--radius)] bg-ink-800 px-3.5 py-2.5 text-helper leading-relaxed text-paper-50">
            {t("assistantMessage")}
          </div>
        </div>

        <div className="ml-auto max-w-[85%]">
          <p className="mb-1.5 text-right text-helper text-stone-400">
            {t("userLabel")}
          </p>
          <div className="rounded-[var(--radius)] bg-brand-red-700 px-3.5 py-2.5 text-helper leading-relaxed text-paper-50">
            {t("userMessage")}
          </div>
        </div>

        {/* Eksik alan uyarısı — design.md §8: #FFF4D6 yüzey, #8A5A00 metin */}
        <div className="flex items-start gap-2 rounded-[var(--radius)] bg-state-warning-surface px-3.5 py-2.5">
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-state-warning-text"
            aria-hidden="true"
          />
          <p className="text-helper leading-relaxed text-state-warning-text">
            <span className="font-semibold">{t("missingLabel")}:</span>{" "}
            {t("missingField")}
          </p>
        </div>
      </div>

      {/* Sağ panel karşılığı: sözleşme taslağı (design.md §8) */}
      <div className="border-t border-ink-800 bg-paper-100 px-5 py-5">
        <div className="rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-4">
          <p className="font-heading text-card-title font-bold text-ink-950">
            {t("draftTitle")}
          </p>
          <p className="mt-1 text-helper text-stone-600">
            <span data-numeric>{t("draftSectionLabel")}</span> ·{" "}
            {t("draftSectionTitle")}
          </p>

          {/* AI'ın son değiştirdiği satır — çok açık kırmızı zemin */}
          <p className="mt-3 rounded-[calc(var(--radius)*0.6)] bg-draft-ai-changed px-2.5 py-2 font-contract text-helper leading-relaxed text-stone-800">
            {t("draftBody")}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-draft-ai-changed px-2.5 py-1 text-helper font-medium text-brand-red-700">
              {t("changedBadge")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-state-success-surface px-2.5 py-1 text-helper font-medium text-state-success-text">
              <Check className="size-3.5" aria-hidden="true" />
              {t("approvedBadge")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
