"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/landing/container";
import { LocaleSwitcher } from "@/components/landing/locale-switcher";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "product", href: "#product" },
  { key: "how", href: "#how-it-works" },
  { key: "pricing", href: "#pricing" },
  { key: "faq", href: "#faq" },
] as const;

/**
 * design.md §6.1 — ink-950 zemin, stone-400 navigasyon metni,
 * paper-50 hover, brand-red-600 ana buton. Menü sade tutulur.
 */
export function SiteHeader() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-ink-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius)] focus:bg-paper-50 focus:px-4 focus:py-2 focus:text-ink-950"
      >
        {t("skipToContent")}
      </a>

      <Container className="flex h-16 items-center justify-between gap-6">
        <a
          href="#main"
          className="text-card-title font-heading font-bold tracking-tight text-paper-50"
        >
          {t("brand")}
        </a>

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label={t("brand")}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-helper text-stone-400 transition-colors hover:text-paper-50"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LocaleSwitcher />
          <a
            href="#pricing"
            className="text-helper text-stone-400 transition-colors hover:text-paper-50"
          >
            {t("login")}
          </a>
          {/*
            Sticky header CTA bilerek İKİNCİL: hero'nun kırmızı CTA'sı ile aynı
            anda ekranda olduğu için kırmızı olsaydı design.md §3 ("aynı anda
            birden fazla kırmızı CTA") ve §5 ("ekranda tek birincil aksiyon")
            ihlal edilirdi. Her bölüm kendi tek birincil aksiyonunu taşır.
          */}
          <Button size="sm" variant="onDark" asChild>
            <a href="#final-cta">{t("cta")}</a>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          className="inline-flex size-10 items-center justify-center rounded-[var(--radius)] text-paper-50 transition-colors hover:bg-paper-50/10 lg:hidden"
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </Container>

      <div
        id="mobile-menu"
        className={cn(
          "border-t border-ink-800 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <Container className="flex flex-col gap-1 py-4">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius)] px-2 py-2.5 text-stone-400 transition-colors hover:bg-paper-50/5 hover:text-paper-50"
            >
              {t(item.key)}
            </a>
          ))}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-ink-800 pt-4">
            <LocaleSwitcher />
            <Button size="sm" variant="onDark" asChild>
              <a href="#final-cta" onClick={() => setOpen(false)}>
                {t("cta")}
              </a>
            </Button>
          </div>
        </Container>
      </div>
    </header>
  );
}
