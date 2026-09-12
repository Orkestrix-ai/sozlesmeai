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

  /* `exact`: /admin artık bir yönlendirme değil, gerçek bir genel bakış
     sayfası. startsWith ile eşleştirilirse her alt sayfada da aktif görünür. */
  const items = [
    { href: "/admin" as const, label: t("overview"), exact: true },
    { href: "/admin/users" as const, label: t("users"), exact: false },
    { href: "/admin/workspaces" as const, label: t("workspaces"), exact: false },
    { href: "/admin/contracts" as const, label: t("contracts"), exact: false },
    { href: "/admin/usage" as const, label: t("usage"), exact: false },
    { href: "/admin/audit-log" as const, label: t("auditLog"), exact: false },
    { href: "/admin/billing" as const, label: t("billing"), exact: false },
  ];

  const comingSoon = [t("comingSoon.templates"), t("comingSoon.notifications"), t("comingSoon.support")];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
