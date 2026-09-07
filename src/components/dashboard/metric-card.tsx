import { Card } from "@/components/ui/card";

/** design.md §7.4 — "KPI kartları: açık yüzey, güçlü tipografi, az dekorasyon." */
function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-helper text-stone-600">{label}</p>
      <p className="mt-1 text-page-title font-heading text-ink-950" data-numeric>
        {value}
      </p>
    </Card>
  );
}

export { MetricCard };
