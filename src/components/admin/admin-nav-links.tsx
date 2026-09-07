"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** design.md §9 admin sidebar navigasyonu. "Yakında" öğeleri (Şablonlar,
 * Sistem bildirimleri, Destek talepleri) bilerek Link DEĞİL, tıklanamaz
 * satırlar — design.md §7.1'in "aktif olmayan özelliği ana özellik gibi
 * gösterme" kuralı admin panelinde de geçerli. */
export function AdminNavLinks() {
  const t = useTranslations("admin.sidebar");
  const pathname = usePathname();

  const items = [
    { href: "/admin/users" as const, label: t("users") },
    { href: "/admin/workspaces" as const, label: t("workspaces") },
    { href: "/admin/usage" as const, label: t("usage") },
    { href: "/admin/audit-log" as const, label: t("auditLog") },
    { href: "/admin/billing" as const, label: t("billing") },
  ];

  const comingSoon = [t("comingSoon.templates"), t("comingSoon.notifications"), t("comingSoon.support")];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-[var(--radius)] px-3 py-2 text-body transition-colors",
              active ? "bg-brand-red-600 text-paper-50" : "text-stone-400 hover:bg-paper-50/10 hover:text-paper-50",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="my-2 border-t border-ink-800" />
      {comingSoon.map((label) => (
        <span
          key={label}
          className="flex items-center justify-between rounded-[var(--radius)] px-3 py-2 text-body text-stone-600"
        >
          {label}
          <span className="text-helper">…</span>
        </span>
      ))}
      <div className="my-2 border-t border-ink-800" />
      <Link
        href="/dashboard"
        className="rounded-[var(--radius)] px-3 py-2 text-body text-stone-400 hover:bg-paper-50/10 hover:text-paper-50"
      >
        {t("backToApp")}
      </Link>
    </nav>
  );
}
