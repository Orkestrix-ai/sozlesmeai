"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { signupAction, type AuthFormState } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxField } from "@/components/ui/checkbox-field";

export function SignupForm() {
  const t = useTranslations("auth.signup");
  const tErr = useTranslations("auth.errors");
  const tV = useTranslations("validation");
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signupAction,
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
          id="name"
          label={t("nameLabel")}
          error={state?.fieldErrors?.name ? tV(state.fieldErrors.name) : undefined}
        >
          <Input name="name" type="text" autoComplete="name" required />
        </Field>
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
          <Input name="password" type="password" autoComplete="new-password" required />
        </Field>

        {/*
          İki kutu da işaretsiz başlar: ön-işaretli onay KVKK/GDPR anlamında
          geçerli bir açık rıza sayılmaz. Zorunluluk `required` ile tarayıcıya
          değil sunucudaki `validateSignup`a bırakılır — form zaten
          `noValidate`. Belge başına ayrı onay, ayrı hata: birini işaretleyip
          diğerini unutan kullanıcıya yalnızca eksik olan gösterilir.

          Belgeler yeni sekmede açılır: form `useActionState` ile çalışıyor ve
          alanlar kontrolsüz, dolayısıyla aynı sekmede gezinmek doldurulmuş
          ad/e-posta/parolayı silerdi. `checkbox-field.tsx` zaten `<a>`ya gelen
          tıklamada kutuyu toggle etmiyor.
        */}
        <div className="space-y-3">
          <CheckboxField
            id="terms"
            required
            label={t.rich("termsConsentLabel", {
              link: (chunks) => (
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-red-600 hover:text-brand-red-700"
                >
                  {chunks}
                  <span className="sr-only"> {t("opensInNewTab")}</span>
                </Link>
              ),
            })}
            error={state?.fieldErrors?.terms ? tV(state.fieldErrors.terms) : undefined}
          >
            <Checkbox name="terms" value="accepted" />
          </CheckboxField>
          <CheckboxField
            id="privacy"
            required
            label={t.rich("privacyConsentLabel", {
              link: (chunks) => (
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-red-600 hover:text-brand-red-700"
                >
                  {chunks}
                  <span className="sr-only"> {t("opensInNewTab")}</span>
                </Link>
              ),
            })}
            error={state?.fieldErrors?.privacy ? tV(state.fieldErrors.privacy) : undefined}
          >
            <Checkbox name="privacy" value="accepted" />
          </CheckboxField>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {t("submit")}
        </Button>
      </form>

      <p className="text-center text-helper text-stone-600">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-brand-red-600 hover:text-brand-red-700">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
