import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * design.md §12 — "Boş durumlar kullanıcıyı bir sonraki adıma yönlendiriyor
 * mu?" CTA burada bilerek `secondary`: sayfanın TEK kırmızı birincil
 * aksiyonu zaten PageHeader'da duruyor (design.md §5) — aynı ekranda iki
 * kırmızı CTA aynı anda göstermemek için (design.md §3).
 */
function EmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: Parameters<typeof Link>[0]["href"];
}) {
  return (
    <div className="py-8 text-center">
      <p className="text-body font-medium text-ink-950">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-helper text-stone-600">{body}</p>
      <Button asChild variant="secondary" size="sm" className="mt-4">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}

export { EmptyState };
