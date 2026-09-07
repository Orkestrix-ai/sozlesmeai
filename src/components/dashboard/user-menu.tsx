"use client";

import { LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { logoutAction } from "@/actions/auth";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** design.md §7.1 — kullanıcı menüsü, sidebar/mobile-nav-drawer'ın altında. */
function UserMenu({ name, email }: { name: string; email: string }) {
  const t = useTranslations("dashboard.userMenu");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-[var(--radius)] p-2 text-left outline-none hover:bg-paper-50/10 focus-visible:ring-2 focus-visible:ring-brand-red-600">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-800 text-helper font-semibold text-paper-50">
          {initials(name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-medium text-paper-50">{name}</span>
          <span className="block truncate text-helper text-stone-400">{email}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="size-4" aria-hidden="true" />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logoutAction();
          }}
          className="flex items-center gap-2 text-state-error"
        >
          <LogOut className="size-4" aria-hidden="true" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
