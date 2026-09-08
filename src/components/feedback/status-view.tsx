import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Paylaşılan 404/hata sunum bileşeni. Bilerek `"use client"` DEĞİL ve
 * `useTranslations` İÇERMEZ: hem Server Component'lerden (`not-found.tsx`)
 * hem Client Component'lerden (`error.tsx`, `global-error.tsx`) çağrılabilmesi
 * için tüm metinler prop olarak gelir — bkz. plan §3.
 *
 * design.md §5 — sayfada YALNIZCA bir birincil (kırmızı) aksiyon bulunur;
 * bunu her zaman `primaryAction` taşır, ikinci bir kırmızı buton eklenmez.
 * design.md §5 — gölge yerine çizgi: hızlı bağlantı bloğu `border-t` ile
 * ayrılır, `shadow-card` kullanılmaz.
 */
type StatusViewProps = {
  icon: ReactNode;
  title: string;
  description: string;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  quickLinks?: ReactNode;
  reference?: {
    code: string;
    label: string;
    hint: string;
  };
  /** true: tam ekran ortalı (public sayfalar) — false: dashboard içine gömülü, py-16. */
  fullScreen?: boolean;
  className?: string;
};

function StatusView({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  quickLinks,
  reference,
  fullScreen = true,
  className,
}: StatusViewProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-5 text-center",
        fullScreen ? "grow justify-center py-20" : "py-16",
        className,
      )}
    >
      <div className="w-full max-w-lg">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[var(--radius)] border border-stone-200 bg-paper-100 text-stone-600 [&_svg]:size-5">
          {icon}
        </div>

        <h1 className="mt-5 text-page-title text-ink-950">{title}</h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-body text-stone-600">
          {description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {primaryAction}
          {secondaryAction}
        </div>

        {(quickLinks || reference) && (
          <div className="mt-10 border-t border-stone-200 pt-6">
            {quickLinks}
            {reference && (
              <p className="mt-4 font-mono text-helper text-stone-400" title={reference.hint}>
                {reference.label}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { StatusView };
export type { StatusViewProps };
