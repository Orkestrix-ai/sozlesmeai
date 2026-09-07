import { useTranslations } from "next-intl";

/**
 * design.md §7.3 — "Harcama ve kullanım grafikleri: brand-red-600 tek vurgu
 * serisi, diğer seriler gri." Burada tek seri (haftalık tüketim) olduğu için
 * kural otomatik sağlanır. Harici grafik kütüphanesi yok — CSS bar'lar.
 */
function CreditChart({ series }: { series: { weekStart: string; consumed: number }[] }) {
  const t = useTranslations("dashboard.chart");
  const max = Math.max(1, ...series.map((w) => w.consumed));
  const hasData = series.some((w) => w.consumed > 0);

  if (!hasData) {
    return <p className="text-helper text-stone-600">{t("noData")}</p>;
  }

  return (
    <div>
      <p className="sr-only">{t("srCaption")}</p>
      <div className="flex h-32 items-end gap-2" aria-hidden="true">
        {series.map((week) => (
          <div
            key={week.weekStart}
            className="flex-1 rounded-t-[4px] bg-brand-red-600"
            style={{ height: `${Math.max(4, (week.consumed / max) * 100)}%` }}
            title={`${new Date(week.weekStart).toLocaleDateString()}: ${week.consumed}`}
          />
        ))}
      </div>
    </div>
  );
}

export { CreditChart };
