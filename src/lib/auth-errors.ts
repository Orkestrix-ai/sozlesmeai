import type { AuthError } from "@supabase/supabase-js";

import type { AuthErrorKey } from "@/lib/i18n-keys";

/**
 * Supabase Auth `error.code` → messages/*.json'daki `auth.errors.*` anahtarı.
 * Kod tanınmıyorsa sunucu tarafında loglanır ve kullanıcıya `generic`
 * gösterilir — ham Supabase mesajı asla kullanıcıya sızmaz.
 */
export function authErrorKey(error: AuthError): AuthErrorKey {
  switch (error.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "emailTaken";
    case "weak_password":
      return "weakPassword";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rateLimited";
    case "otp_expired":
      return "expiredLink";
    default:
      console.error("[auth] handled error with no mapped key:", error.code, error.message);
      return "generic";
  }
}
