import { useTranslations } from "next-intl";

import { Progress } from "@/components/ui/progress";

/**
 * design.md §7.2 — "Kullanım limiti: ince progress bar; doluluk kırmızıya
 * yaklaştıkça brand-red-500." Renk eşiği progress.tsx'in belirttiği gibi
 * bu bileşenin sorumluluğu.
 */
function UsageMeter({
  used,
  total,
  resetsOn,
  isPlaceholder,
}: {
  used: number;
  total: number;
  resetsOn: string;
  isPlaceholder: boolean;
}) {
  const t = useTranslations("dashboard.usage");
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  const percent = Math.round(ratio * 100);

  const indicatorClassName =
    ratio >= 0.9 ? "bg-brand-red-500" : ratio >= 0.7 ? "bg-state-warning" : "bg-ink-800";

  const resetDate = new Date(resetsOn);
  const formattedReset = Number.isNaN(resetDate.getTime())
    ? resetsOn
    : resetDate.toLocaleDateString();

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-helper text-stone-600">
        <span>{t("usedOf", { used, total })}</span>
        <span>{t("resetsOn", { date: formattedReset })}</span>
      </div>
      <Progress value={percent} indicatorClassName={indicatorClassName} />
      <p className="mt-2 text-helper text-stone-600">
        {t(isPlaceholder ? "placeholderNote" : "helper")}
      </p>
    </div>
  );
}

export { UsageMeter };
