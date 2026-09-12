"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { createContractAction } from "@/actions/contracts";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * design.md §5 — ekranın tek birincil aksiyonu: "Taslak oluştur".
 *
 * Tek alan var: başlık. "Sözleşme türü" seçimi bilerek KALDIRILDI — listesi
 * şablon adlarıyla örtüşüyordu ("Kira sözleşmesi" seçen kullanıcı neden kira
 * şablonunu almadığını haklı olarak soruyordu) ve türü AI zaten sohbetin ilk
 * turunda `propose_contract_type` ile öneriyor (`contracts.contract_type`
 * nullable). Başlık ise KALMALI: sözleşmeyi sonradan yeniden adlandırma yolu
 * yok, alan kalkarsa her sözleşme kalıcı olarak "Adsız sözleşme" olurdu.
 */
function NewContractForm() {
  const t = useTranslations("dashboard.newContract");
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(createContractAction, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <Field
        id="contract-title"
        label={t("titleLabel")}
        error={state?.fieldErrors?.title ? tValidation(state.fieldErrors.title) : undefined}
        required
      >
        <Input name="title" autoComplete="off" disabled={pending} />
      </Field>

      {state?.formError && <p className="text-helper text-state-error">{tErrors(state.formError)}</p>}

      <Button type="submit" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}

export { NewContractForm };
