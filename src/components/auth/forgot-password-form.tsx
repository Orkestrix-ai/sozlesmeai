"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { requestPasswordResetAction, type AuthFormState } from "@/actions/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tV = useTranslations("validation");
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordResetAction,
    undefined,
  );

  if (state?.success) {
    return (
      <div className="space-y-6">
        <Alert variant="success">
          <AlertTitle>{t("sentTitle")}</AlertTitle>
          <AlertDescription>{t("sentBody")}</AlertDescription>
        </Alert>
        <Link
          href="/login"
          className="text-helper font-medium text-brand-red-600 hover:text-brand-red-700"
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-heading text-ink-950">{t("title")}</h1>
        <p className="mt-1 text-body text-stone-600">{t("description")}</p>
      </div>

      <form action={formAction} noValidate className="space-y-4">
        <Field
          id="email"
          label={t("emailLabel")}
          error={state?.fieldErrors?.email ? tV(state.fieldErrors.email) : undefined}
        >
          <Input name="email" type="email" autoComplete="email" required />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {t("submit")}
        </Button>
      </form>

      <Link href="/login" className="block text-center text-helper text-stone-600 hover:text-ink-950">
        {t("backToLogin")}
      </Link>
    </div>
  );
}
