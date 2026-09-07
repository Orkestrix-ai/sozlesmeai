import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/**
 * Auth ekranları design.md'de hiç tanımlı değil (bkz. Faz 2 planı §9 madde 1).
 * §10 (butonlar), §5 (tek birincil aksiyon) ve §3 (60/25/10/5 renk oranı) ile
 * landing'in mevcut dilinden çıkarıldı: solda ink-950 marka paneli, sağda
 * paper-50 form kartı. Mobilde koyu panel ince bir başlık şeridine iner.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const tNav = useTranslations("nav");
  const tBrand = useTranslations("auth.brandPanel");

  const bullets = ["b1", "b2", "b3"] as const;

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="bg-ink-950 px-6 py-8 lg:flex lg:w-2/5 lg:flex-col lg:justify-center lg:px-12 lg:py-10">
        <Link href="/" className="text-card-title font-heading text-paper-50">
          {tNav("brand")}
        </Link>
        <h1 className="mt-6 hidden font-heading text-section text-paper-50 lg:block">
          {tBrand("title")}
        </h1>
        <p className="mt-3 hidden max-w-sm text-body text-stone-400 lg:block">
          {tBrand("body")}
        </p>
        <ul className="mt-8 hidden space-y-3 lg:block">
          {bullets.map((key) => (
            <li key={key} className="flex items-start gap-2 text-helper text-stone-400">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-red-500" aria-hidden="true" />
              {tBrand(`bullets.${key}`)}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-1 items-center justify-center bg-paper-50 px-6 py-10 lg:px-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
