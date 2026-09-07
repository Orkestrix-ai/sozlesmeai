import { getTranslations } from "next-intl/server";

import { requirePlatformAdmin } from "@/lib/admin/dal";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";

/**
 * design.md §9 — admin paneli, son kullanıcı dashboard'undan daha yoğun ama
 * marka dilini korur. Ana arka plan `--color-admin-bg` (#ECEAE7), sidebar
 * yine `ink-950`. requirePlatformAdmin() burada çağrılır (erken çıkış); asıl
 * güvenlik sınırı yine de her admin DAL fonksiyonunun kendisindedir (Next.js
 * auth rehberi: layout istemci gezinmesinde yeniden render olmaz).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  const t = await getTranslations("admin.sidebar");

  return (
    <div className="flex min-h-dvh bg-admin-bg">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-950 lg:flex">
        <div className="flex h-16 shrink-0 items-center px-4">
          <span className="text-card-title font-heading text-paper-50">{t("brand")}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AdminNavLinks />
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
