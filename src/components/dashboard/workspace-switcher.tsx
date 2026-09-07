"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { createWorkspaceAction, switchWorkspaceAction } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type WorkspaceSummary = {
  id: string;
  name: string;
  isPersonal: boolean;
};

/**
 * design.md §7.4 — "Üst navigasyon ve workspace seçici: ink-900." Workspace
 * değiştirme çerez yazan bir Server Action'dır (form YOK, doğrudan çağrı);
 * yeni workspace oluşturma ayrı bir Dialog'a taşınır çünkü aynı anda hem
 * DropdownMenu hem Dialog açık tutmak Radix'in odak tuzağını karıştırır.
 */
function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
}) {
  const t = useTranslations("dashboard.workspaceSwitcher");
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(createWorkspaceAction, undefined);

  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  // React'in "render sırasında state ayarlama" deseni (efekt DEĞİL): başarı
  // bayrağı değiştiği anda dialog'u kapatır, ekstra bir render turu yaratmaz.
  // https://react.dev/learn/you-might-not-need-an-effect
  const [prevSuccess, setPrevSuccess] = React.useState(state?.success);
  if (state?.success !== prevSuccess) {
    setPrevSuccess(state?.success);
    if (state?.success) setCreateOpen(false);
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-[var(--radius)] bg-ink-900 px-3 py-2 text-left text-body text-paper-50 outline-none hover:bg-ink-800 focus-visible:ring-2 focus-visible:ring-brand-red-600">
          <span className="truncate">
            {active ? (active.isPersonal ? t("personal") : active.name) : ""}
          </span>
          <ChevronDown className="size-4 shrink-0 text-stone-400" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onSelect={() => {
                if (ws.id === activeWorkspaceId) return;
                startTransition(() => {
                  void switchWorkspaceAction(ws.id);
                });
              }}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate">{ws.isPersonal ? t("personal") : ws.name}</span>
              {ws.id === activeWorkspaceId && (
                <Check className="size-4 shrink-0 text-brand-red-600" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setMenuOpen(false);
              setCreateOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("create")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <Field
              id="workspace-name"
              label={t("nameLabel")}
              error={state?.fieldErrors?.name ? tValidation(state.fieldErrors.name) : undefined}
              required
            >
              <Input name="name" autoComplete="off" disabled={pending} />
            </Field>
            {state?.formError && (
              <p className="text-helper text-state-error">{tErrors(state.formError)}</p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {t("submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { WorkspaceSwitcher };
