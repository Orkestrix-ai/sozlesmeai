"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { authErrorKey } from "@/lib/auth-errors";
import type { AuthErrorKey } from "@/lib/i18n-keys";
import {
  validateEmailOnly,
  validateLogin,
  validatePasswordReset,
  validateSignup,
  type FieldErrors,
} from "@/lib/validation";

export type AuthFormState =
  | { fieldErrors?: FieldErrors; formError?: AuthErrorKey; success?: boolean }
  | undefined;

/**
 * E-posta bağlantılarının (onay, parola sıfırlama) mutlak kökü.
 *
 * `NEXT_PUBLIC_SITE_URL` tanımlıysa O kazanır. Sebebi: Supabase bu değeri
 * "Redirect URLs" allow-list'iyle karşılaştırır ve eşleşmezse SESSİZCE atıp
 * Dashboard'daki Site URL'e düşer (hata döndürmez, e-posta yine gider) —
 * `Host` başlığından türetilen kök ise her origin'de değişir (apex/www,
 * preview dağıtımı, LAN IP, localhost) ve hepsinin ayrı ayrı listede olması
 * gerekir. Sabit bir env değeri bu sınıf hatayı kökten kapatır.
 *
 * Host hiç yoksa `http://null/...` gibi GoTrue'nun reddedeceği bir dize
 * üretmemek için localhost'a düşülür.
 */
async function getBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("host");
  if (!host) return "http://localhost:3000";

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
  // İşaretlenmemiş bir checkbox FormData'da hiç bulunmaz.
  const terms = String(formData.get("terms") ?? "");
  const privacy = String(formData.get("privacy") ?? "");
  const locale = (await getLocale()) as AppLocale;

  const fieldErrors = validateSignup({ name, email, password, terms, privacy });
  if (fieldErrors) return { fieldErrors };

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  // İki belge ayrı ayrı onaylanıyor; damgalar aynı istekte üretildiği için
  // aynı değeri taşır ama bağımsız iki onaya karşılık gelir.
  // Not: raw_user_meta_data kullanıcının kendi updateUser({ data }) çağrısıyla
  // değiştirilebilir — bu bir kayıt izi, denetim kanıtı değil.
  const consentedAt = new Date().toISOString();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name.trim(),
        locale,
        terms_accepted_at: consentedAt,
        privacy_accepted_at: consentedAt,
      },
      emailRedirectTo: `${baseUrl}/auth/confirm?next=/${locale}/dashboard`,
    },
  });

  if (error) {
    return { formError: authErrorKey(error) };
  }

  // Supabase'in "Confirm email" ayarı KAPALIYSA GoTrue oturumu doğrudan
  // döndürür, SSR istemcisi çerezleri yazar ve doğrulama maili hiç gitmez —
  // kullanıcı zaten girmiş durumdadır, /verify-email'e göndermek yanlış olur.
  // Ayar AÇIKSA session null gelir ve eski akış (onay maili) sürer. Ayar
  // Dashboard'da yaşıyor, repoda izlenmiyor; bu yüzden davranış koda
  // gömülmüyor, dönen oturuma bakılıyor.
  //
  // Var olan bir e-postayla kayıt denendiğinde GoTrue oturumsuz sahte bir
  // kullanıcı döndürür; o durumda da bu dal çalışmaz ve kullanıcı sayımı
  // hijyeni korunur (bkz. loginAction'daki aynı gerekçe).
  if (data.session) {
    revalidatePath("/", "layout");
    redirect({ href: "/dashboard", locale });
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
