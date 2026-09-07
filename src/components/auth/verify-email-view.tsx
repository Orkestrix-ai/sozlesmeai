"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { resendConfirmationAction, type AuthFormState } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Kayıt sonrası e-posta doğrulama bekleme ekranı. `email` signupAction'ın
 * yönlendirme sorgu parametresinden gelir (bkz. src/actions/auth.ts); yoksa
 * (doğrudan gezinme) kullanıcı adresini kendisi girer.
 */
export function VerifyEmailView({ email }: { email?: string }) {
  const t = useTranslations("auth.verifyEmail");
  const tLogin = useTranslations("auth.login");
  const tErr = useTranslations("auth.errors");
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resendConfirmationAction,
    undefined,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-heading text-ink-950">{t("title")}</h1>
        <p className="mt-1 text-body text-stone-600">{t("body")}</p>
      </div>

      {state?.formError && (
        <Alert variant="error">
          <AlertDescription>{tErr(state.formError)}</AlertDescription>
        </Alert>
      )}
      {state?.success && (
        <Alert variant="success">
          <AlertDescription>{t("resent")}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} noValidate className="space-y-4">
        {email ? (
          <input type="hidden" name="email" value={email} />
        ) : (
          <Field id="email" label={tLogin("emailLabel")}>
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
        )}

        <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
          {t("resend")}
        </Button>
      </form>
    </div>
  );
}
