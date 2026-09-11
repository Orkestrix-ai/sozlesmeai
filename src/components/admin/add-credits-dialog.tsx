"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { addCreditsAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * design.md §9/§10 — kritik admin aksiyonu, onay modalı zorunlu. Kredi
 * eklemek teknik olarak "silme" değildir ama geri döndürülemez bir mali
 * kayıt yarattığı için aynı disipline tabi tutuldu (bkz. addCreditsAction —
 * audit log'a yazar).
 */
function AddCreditsDialog({
  workspaceId,
  /** Kredinin kime yazıldığını modalda göstermek için — /admin/users satırında
   * kullanıcı adı + e-posta veriliyor. /admin/billing workspace listesinde
   * satırın kendisi zaten bağlamı taşıdığı için boş bırakılır. */
  subject,
}: {
  workspaceId: string;
  subject?: string;
}) {
  const t = useTranslations("admin.billing.dialog");
  const tBilling = useTranslations("admin.billing");
  const tErrors = useTranslations("errors");
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(false);

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError(true);
      return;
    }
    setPending(true);
    const result = await addCreditsAction(workspaceId, value);
    setPending(false);
    if (result.error) {
      setError(true);
      return;
    }
    setOpen(false);
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          {tBilling("addCredits")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {subject ? (
          <p className="text-sm font-medium text-ink-950">{t("subject", { subject })}</p>
        ) : null}
        <Field
          id="add-credits-amount"
          label={t("amountLabel")}
          error={error ? tErrors("generic") : undefined}
        >
          <Input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(false);
            }}
          />
        </Field>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AddCreditsDialog };
