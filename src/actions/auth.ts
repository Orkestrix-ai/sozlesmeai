"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { authErrorKey } from "@/lib/auth-errors";
import {
  validateEmailOnly,
  validateLogin,
  validatePasswordReset,
  validateSignup,
  type FieldErrors,
} from "@/lib/validation";

export type AuthFormState =
  | { fieldErrors?: FieldErrors; formError?: string; success?: boolean }
  | undefined;

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = (await getLocale()) as AppLocale;

  const fieldErrors = validateSignup({ name, email, password });
  if (fieldErrors) return { fieldErrors };

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name.trim(), locale },
      emailRedirectTo: `${baseUrl}/auth/confirm?next=/${locale}/dashboard`,
    },
  });

  if (error) {
    return { formError: authErrorKey(error) };
  }

  redirect({
    href: `/verify-email?email=${encodeURIComponent(email)}`,
    locale,
  });
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = (await getLocale()) as AppLocale;

  const fieldErrors = validateLogin({ email, password });
  if (fieldErrors) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Kullanıcı sayımı hijyeni: yanlış parola ile bilinmeyen e-posta için
    // Supabase zaten aynı invalid_credentials kodunu döndürür.
    return { formError: authErrorKey(error) };
  }

  revalidatePath("/", "layout");
  redirect({ href: "/dashboard", locale });
}

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const locale = (await getLocale()) as AppLocale;

  const fieldErrors = validateEmailOnly(email);
  if (fieldErrors) return { fieldErrors };

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/confirm?next=/${locale}/reset-password`,
  });

  // Kullanıcı sayımı hijyeni: sonuç ne olursa olsun aynı başarı durumu
  // gösterilir; gerçek hata yalnızca sunucu tarafında loglanır.
  if (error) console.error("[auth] requestPasswordResetAction:", error.code, error.message);

  return { success: true };
}

export async function updatePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const locale = (await getLocale()) as AppLocale;

  const fieldErrors = validatePasswordReset({ password, confirmPassword });
  if (fieldErrors) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { formError: authErrorKey(error) };
  }

  redirect({ href: "/dashboard", locale });
}

export async function resendConfirmationAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const locale = (await getLocale()) as AppLocale;

  const fieldErrors = validateEmailOnly(email);
  if (fieldErrors) return { fieldErrors };

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${baseUrl}/auth/confirm?next=/${locale}/dashboard` },
  });

  if (error) {
    return { formError: authErrorKey(error) };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const locale = (await getLocale()) as AppLocale;
  revalidatePath("/", "layout");
  redirect({ href: "/login", locale });
}
