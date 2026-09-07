"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { loginAction, type AuthFormState } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tErr = useTranslations("auth.errors");
  const tV = useTranslations("validation");
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
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
          id="email"
          label={t("emailLabel")}
          error={state?.fieldErrors?.email ? tV(state.fieldErrors.email) : undefined}
        >
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field
          id="password"
          label={t("passwordLabel")}
          error={state?.fieldErrors?.password ? tV(state.fieldErrors.password) : undefined}
        >
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-helper text-stone-600 hover:text-ink-950"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        {/* Ekranın tek birincil aksiyonu (design.md §5). */}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {t("submit")}
        </Button>
      </form>

      <p className="text-center text-helper text-stone-600">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-brand-red-600 hover:text-brand-red-700">
          {t("signupLink")}
        </Link>
      </p>
    </div>
  );
}
