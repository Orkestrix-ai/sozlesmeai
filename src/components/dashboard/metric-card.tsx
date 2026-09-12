import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * design.md §7.4 — "KPI kartları: açık yüzey, güçlü tipografi, az dekorasyon."
 *
 * `valueClassName` yalnızca DEĞERİN rengini değiştirmek içindir (ör. negatif
 * net için `text-state-error`). Kart YÜZEYİNİ renklendirmek için kullanmayın —
 * design.md §3 ekranda tek kırmızı vurguya izin verir.
 */
function MetricCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-helper text-stone-600">{label}</p>
      <p className={cn("mt-1 text-page-title font-heading text-ink-950", valueClassName)} data-numeric>
        {value}
      </p>
    </Card>
  );
}

export { MetricCard };
