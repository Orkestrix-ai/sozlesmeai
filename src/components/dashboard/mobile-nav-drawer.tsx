"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SidebarNavLinks } from "@/components/dashboard/sidebar-nav-links";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { UserMenu } from "@/components/dashboard/user-menu";

type WorkspaceSummary = { id: string; name: string; isPersonal: boolean };

/**
 * design.md §11 mobil çekmece — dialog.tsx'in `side="left"` varyantı için
 * yazıldığı tam kullanım yeri. Masaüstü sidebar'ıyla aynı SidebarNavLinks'i
 * paylaşır; `showClose={false}` çünkü DialogContent'in varsayılan kapatma
 * ikonu koyu zeminde okunmuyor, burada kendi paper-50 ikonumuzu koyuyoruz.
 */
function MobileNavDrawer({
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
  const tDashNav = useTranslations("dashboardNav");
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={tDashNav("openMenu")}
          className="flex size-9 items-center justify-center rounded-[var(--radius)] text-ink-950 outline-none hover:bg-paper-100 focus-visible:ring-2 focus-visible:ring-brand-red-600"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent
        side="left"
        showClose={false}
        className="flex flex-col overflow-y-auto bg-ink-950 text-paper-50"
      >
        <DialogTitle className="sr-only">{tDashNav("mainNavLabel")}</DialogTitle>
        <div className="flex h-16 shrink-0 items-center justify-between">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-card-title font-heading text-paper-50"
          >
            {tNav("brand")}
          </Link>
          <DialogClose asChild>
            <button
              type="button"
              aria-label={tDashNav("closeMenu")}
              className="flex size-9 items-center justify-center rounded-[var(--radius)] text-paper-50 outline-none hover:bg-paper-50/10 focus-visible:ring-2 focus-visible:ring-brand-red-600"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </DialogClose>
        </div>
        <div className="mb-4">
          <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
        </div>
        <div className="flex-1">
          <SidebarNavLinks onNavigate={() => setOpen(false)} />
        </div>
        <div className="mt-4 shrink-0 border-t border-ink-800 pt-3">
          <UserMenu name={userName} email={userEmail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { MobileNavDrawer };
