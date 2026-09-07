/**
 * Faz 2'nin doğrulama yüzeyi küçük (e-posta biçimi, parola uzunluğu, parola
 * eşleşmesi, ad/başlık uzunluğu) — zod eklemek yerine burada elle yazıldı.
 * zod'un asıl faydası (şema + hata mesajı üretimi) burada işe yaramaz çünkü
 * mesajlar zaten Türkçe-öncelikli olarak i18n anahtarına eşlenecekti.
 *
 * Doğrulayıcılar CÜMLE değil messages/*.json'daki `validation.*` namespace'i
 * altındaki ANAHTARI döndürür — çağıran taraf `useTranslations("validation")`
 * ile çevirir.
 */

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validateSignup(input: {
  name: string;
  email: string;
  password: string;
}): FieldErrors | null {
  const errors: FieldErrors = {};
  const name = input.name.trim();

  if (name.length < 2) errors.name = "nameTooShort";
  else if (name.length > 80) errors.name = "nameTooLong";

  if (!isValidEmail(input.email)) errors.email = "emailInvalid";

  if (input.password.length < 8) errors.password = "passwordTooShort";

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateLogin(input: {
  email: string;
  password: string;
}): FieldErrors | null {
  const errors: FieldErrors = {};

  if (!isValidEmail(input.email)) errors.email = "emailInvalid";
  if (input.password.length === 0) errors.password = "required";

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateEmailOnly(email: string): FieldErrors | null {
  return isValidEmail(email) ? null : { email: "emailInvalid" };
}

export function validatePasswordReset(input: {
  password: string;
  confirmPassword: string;
}): FieldErrors | null {
  const errors: FieldErrors = {};

  if (input.password.length < 8) errors.password = "passwordTooShort";
  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "passwordsDoNotMatch";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/** workspace adı 1–80 (design.md §7.4 workspace seçici / yeni workspace formu). */
export function validateWorkspaceName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "required";
  if (trimmed.length > 80) return "nameTooLong";
  return null;
}

/** sözleşme başlığı 1–140 (Faz 2'nin metadata-only contracts tablosu). */
export function validateContractTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) return "titleRequired";
  if (trimmed.length > 140) return "titleTooLong";
  return null;
}
