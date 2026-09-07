import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];

/**
 * design.md §7.4 — "Rol ve yetki badge'leri: nötr tonlar; admin için
 * ink-900, editör için brand-red-100 benzeri açık kırmızı yüzey,
 * görüntüleyici için paper-100." brand-red-100 globals.css'te tam bu amaç
 * için tanımlı (bkz. o dosyadaki yorum) — burada ilk kez kullanılıyor.
 */
const roleBadgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-helper font-medium", {
  variants: {
    role: {
      admin: "bg-ink-900 text-paper-50",
      editor: "bg-brand-red-100 text-ink-950",
      viewer: "bg-paper-100 text-stone-800",
    } satisfies Record<WorkspaceRole, string>,
  },
});

function RoleBadge({
  role,
  className,
  children,
}: {
  role: WorkspaceRole;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn(roleBadgeVariants({ role }), className)}>{children}</span>;
}

export { RoleBadge };
