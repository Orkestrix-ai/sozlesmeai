"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { updatePasswordAction, type AuthFormState } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const tErr = useTranslations("auth.errors");
  const tV = useTranslations("validation");
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updatePasswordAction,
    undefined,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-heading text-ink-950">{t("title")}</h1>
        <p className="mt-1 text-body text-stone-600">{t("description")}</p>
      </div>

      {state?.formError && (
        <Alert variant="error">
          <AlertDescription>{tErr(state.formError)}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} noValidate className="space-y-4">
        <Field
          id="password"
          label={t("passwordLabel")}
          error={state?.fieldErrors?.password ? tV(state.fieldErrors.password) : undefined}
        >
          <Input name="password" type="password" autoComplete="new-password" required />
        </Field>
        <Field
          id="confirmPassword"
          label={t("confirmPasswordLabel")}
          error={
            state?.fieldErrors?.confirmPassword ? tV(state.fieldErrors.confirmPassword) : undefined
          }
        >
          <Input name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}
