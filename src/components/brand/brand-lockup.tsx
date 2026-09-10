import { useTranslations } from "next-intl";

import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

/**
 * İşaret + wordmark kilidi. Tipografi ve renk ÇAĞIRANDAN gelir (kilit kendi
 * font-size'ını dayatmaz); işaretin yüksekliği ve aradaki boşluk `em` ile
 * verildiği için kilit hangi punto içine konursa oranlar kaynak logodaki
 * gibi korunur: kaynakta işaret, "S" cap yüksekliğinin 2.08 katı ve aradaki
 * boşluk işaret yüksekliğinin 0.26'sı — Inter Tight'ın 0.727em cap
 * yüksekliğine çevrilince 1.5em ve 0.38em.
 *
 * Kaynak logoda "AI" eki kırmızıdır. Burada paletin koyu yüzey kırmızısı
 * brand-red-500 kullanılır; logonun ham #FB021A'sı design.md §2 paletinde
 * tanımlı değil ve tek kullanım için token açmaya değmez.
 *
 * Wordmark hâlâ TEK kaynaktan (`nav.brand`) okunur — CLAUDE.md'nin "marka adı
 * dört yerde yaşar" kuralını bozmamak için ikinci bir çeviri anahtarı
 * açılmadı, dize burada bölünüyor. Ad "AI" ile bitmiyorsa bütün basılır.
 */
const ACCENT = "AI";

export function BrandLockup({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const brand = t("brand");
  const hasAccent = brand.length > ACCENT.length && brand.endsWith(ACCENT);

  return (
    <span className={cn("inline-flex items-center gap-[0.38em]", className)}>
      <LogoMark className="h-[1.5em] w-auto" />
      <span>
        {hasAccent ? (
          <>
            {brand.slice(0, -ACCENT.length)}
            <span className="text-brand-red-500">{ACCENT}</span>
          </>
        ) : (
          brand
        )}
      </span>
    </span>
  );
}
