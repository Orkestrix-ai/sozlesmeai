"use client";

import * as React from "react";
import { Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { createShareAction, revokeShareAction } from "@/actions/sharing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AppLocale } from "@/i18n/routing";

export type ShareEntry = { id: string; token: string };

/**
 * Plan C4 — paylaşım. Yalnızca `ready` durumundaki sözleşmelerde etkin
 * (design.md §8: AI çıktısı asla otomatik "nihai" gösterilmez, paylaşım da
 * ancak kullanıcı onayından sonra anlamlıdır).
 */
function SharePanel({
  contractId,
  locale,
  status,
  canEdit,
  initialShares,
}: {
  contractId: string;
  locale: AppLocale;
  status: "draft" | "review" | "ready" | "shared" | "error";
  canEdit: boolean;
  initialShares: ShareEntry[];
}) {
  const t = useTranslations("dashboard.contractScreen.share");
  const [open, setOpen] = React.useState(false);
  const [shares, setShares] = React.useState(initialShares);
  const [creating, setCreating] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!canEdit || status !== "ready") return null;

  const shareUrl = (token: string) => `${window.location.origin}/${locale}/s/${token}`;

  const create = async () => {
    setCreating(true);
    const result = await createShareAction(contractId);
    setCreating(false);
    if (result.token) {
      setShares((prev) => [{ id: `pending-${Date.now()}`, token: result.token! }, ...prev]);
    }
  };

  const copy = async (entry: ShareEntry) => {
    await navigator.clipboard.writeText(shareUrl(entry.token));
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revoke = async (entry: ShareEntry) => {
    setShares((prev) => prev.filter((s) => s.id !== entry.id));
    await revokeShareAction(entry.id, contractId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Share2 className="size-4" aria-hidden="true" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <Button size="sm" onClick={create} disabled={creating} className="mb-4">
          {creating ? t("creating") : t("create")}
        </Button>

        <p className="mb-2 text-helper font-medium text-stone-600">{t("activeLinks")}</p>
        {shares.length === 0 ? (
          <p className="text-helper text-stone-600">{t("noActiveLinks")}</p>
        ) : (
          <ul className="space-y-2">
            {shares.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-stone-200 p-2.5"
              >
                <span className="truncate text-helper text-stone-800">{entry.token}</span>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => copy(entry)}
                    aria-label={t("copy")}
                    className="flex size-8 items-center justify-center rounded-[var(--radius)] text-stone-600 hover:bg-paper-100"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </button>
                  <Button variant="secondary" size="sm" onClick={() => revoke(entry)}>
                    {t("revoke")}
                  </Button>
                </div>
                {copiedId === entry.id && (
                  <span className="text-helper text-state-success">{t("copied")}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { SharePanel };
