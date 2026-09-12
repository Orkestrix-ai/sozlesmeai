"use client";

import { Archive, FilePlus, FileText, LayoutDashboard, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * design.md §7.1 ortak menü. Sidebar (masaüstü) ve mobile-nav-drawer aynı
 * listeyi kullanır — tek kaynak burada. İmza özellikleri MVP dışında
 * olduğu için listeye eklenmedi (design.md §7.1 son satırı).
 *
 * "Hatırlatmalar" da AYNI gerekçeyle listede yok: arkasında tablo, DAL
 * fonksiyonu veya action yoktu; menü kullanıcıyı hiçbir koşulda dolamayacak
 * boş bir ekrana götürüyordu. Özellik gerçekten yazıldığında geri eklenir.
 *
 * "Şablonlar" ise silinmedi, TAŞINDI: sözleşme oluşturmanın tek giriş noktası
 * artık /contracts/new — şablon galerisi orada, "sıfırdan" formuyla aynı
 * ekranda duruyor. /templates adresi oraya yönleniyor.
 */
export function SidebarNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("dashboardNav");
  const pathname = usePathname();

  const items = [
    { href: "/dashboard" as const, label: t("overview"), icon: LayoutDashboard },
    { href: "/contracts/new" as const, label: t("newContract"), icon: FilePlus },
    { href: "/contracts" as const, label: t("contracts"), icon: FileText },
    { href: "/archive" as const, label: t("archive"), icon: Archive },
    { href: "/settings" as const, label: t("settings"), icon: Settings },
  ];

  // En uzun (en özgül) eşleşen tek href aktif sayılır — aksi halde
  // /contracts/new hem "Sözleşmeler" hem "Yeni sözleşme oluştur"u birlikte
  // kırmızıya boyardı (ikisi de /contracts ile başlıyor).
  const activeHref = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav aria-label={t("mainNavLabel")} className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-body transition-colors",
              active
                ? "bg-brand-red-600 text-paper-50"
                : "text-stone-400 hover:bg-paper-50/10 hover:text-paper-50",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
