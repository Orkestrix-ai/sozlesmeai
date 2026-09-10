import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { SidebarNavLinks } from "@/components/dashboard/sidebar-nav-links";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { UserMenu } from "@/components/dashboard/user-menu";

type WorkspaceSummary = { id: string; name: string; isPersonal: boolean };

/**
 * design.md §7.1 ortak sidebar (ink-950). Eskiden §7.2 gereği Starter'da
 * ink-900'e hafifliyordu; paket kademesi kalktığı için (bkz.
 * 20260910120000_pay_as_you_go.sql) tek yüzey kaldı. Yalnızca masaüstünde
 * görünür (`lg:flex`) — mobil karşılığı mobile-nav-drawer.tsx'te aynı
 * SidebarNavLinks'i paylaşır.
 */
function Sidebar({
  workspaces,
  activeWorkspaceId,
  userName,
  userEmail,
}: {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
  userName: string;
  userEmail: string;
}) {
  const tNav = useTranslations("nav");

  return (
    <aside className="hidden bg-ink-950 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-ink-800">
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link href="/dashboard" className="text-card-title font-heading text-paper-50">
          {tNav("brand")}
        </Link>
      </div>
      <div className="px-3">
        <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNavLinks />
      </div>
      <div className="shrink-0 border-t border-ink-800 p-3">
        <UserMenu name={userName} email={userEmail} />
      </div>
    </aside>
  );
}

export { Sidebar };
