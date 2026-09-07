"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { createContractAction } from "@/actions/contracts";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

/** design.md §5 — ekranın tek birincil aksiyonu: "Taslak oluştur". */
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

      <Field
        id="contract-type"
        label={t("typeLabel")}
        error={state?.fieldErrors?.contractType ? tValidation(state.fieldErrors.contractType) : undefined}
        required
      >
        <Select name="contractType" defaultValue="" disabled={pending}>
          <option value="" disabled>
            {t("typePlaceholder")}
          </option>
          <option value="service">{t("types.service")}</option>
          <option value="nda">{t("types.nda")}</option>
          <option value="freelance">{t("types.freelance")}</option>
        </Select>
      </Field>

      {state?.formError && <p className="text-helper text-state-error">{tErrors(state.formError)}</p>}

      <Button type="submit" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}

export { NewContractForm };
