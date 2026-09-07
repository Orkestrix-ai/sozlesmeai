import { getCurrentUser, getWorkspaceContext } from "@/lib/dal";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNavDrawer } from "@/components/dashboard/mobile-nav-drawer";

/**
 * design.md §7.1 — dashboard kabuğu. Auth kontrolü BURADA değil, dal.ts'teki
 * verifySession()'da yapılır (layout'lar istemci gezinmesinde yeniden render
 * olmaz, bu yüzden bir güvenlik sınırı olamaz — Next.js auth rehberi).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [currentUser, { workspace, workspaces, subscription }] = await Promise.all([
    getCurrentUser(),
    getWorkspaceContext(),
  ]);

  const workspaceSummaries = workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    isPersonal: w.isPersonal,
  }));

  return (
    <div className="flex min-h-dvh bg-paper-50">
      <Sidebar
        plan={subscription.plan}
        workspaces={workspaceSummaries}
        activeWorkspaceId={workspace.id}
        userName={currentUser.full_name}
        userEmail={currentUser.email}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center border-b border-stone-200 bg-paper-50 px-4 lg:hidden">
          <MobileNavDrawer
            workspaces={workspaceSummaries}
            activeWorkspaceId={workspace.id}
            userName={currentUser.full_name}
            userEmail={currentUser.email}
          />
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
