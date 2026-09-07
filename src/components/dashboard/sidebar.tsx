import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SidebarNavLinks } from "@/components/dashboard/sidebar-nav-links";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { UserMenu } from "@/components/dashboard/user-menu";

type WorkspaceSummary = { id: string; name: string; isPersonal: boolean };

/**
 * design.md §7.1 ortak sidebar (ink-950); §7.2 Free/Starter'da ink-900'e
 * hafifler ("Sidebar: ink-900"). Yalnızca masaüstünde görünür (`lg:flex`) —
 * mobil karşılığı mobile-nav-drawer.tsx'te aynı SidebarNavLinks'i paylaşır.
 */
function Sidebar({
  plan,
  workspaces,
  activeWorkspaceId,
  userName,
  userEmail,
}: {
  plan: "starter" | "pro" | "business";
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
  userName: string;
  userEmail: string;
}) {
  const tNav = useTranslations("nav");
  const surface = plan === "starter" ? "bg-ink-900" : "bg-ink-950";

  return (
    <aside
      className={cn(
        "hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-ink-800",
        surface,
      )}
    >
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
