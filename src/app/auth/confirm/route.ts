import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { authNextPathSchema } from "@/lib/db/schemas";

/**
 * Supabase e-posta bağlantılarının (doğrulama, parola sıfırlama) hedefi.
 * Locale ÖNEKSİZDİR — src/proxy.ts bu yolu next-intl yönlendirmesinden
 * bilerek muaf tutar (bkz. proxy.ts üstündeki yorum).
 *
 * `next` sorgu parametresi actions/auth.ts tarafından ZATEN locale önekli
 * üretilir (`/${locale}/dashboard` gibi); burada yalnızca hata durumunda
 * locale'i `next`den çıkarmamız gerekiyor.
 *
 * İKİ ŞABLON DA DESTEKLENİR — hangisinin geldiği Supabase Dashboard'daki
 * e-posta şablonuna bağlıdır ve şablonlar repoda izlenmez:
 *
 * - `token_hash` + `type`: şablon `{{ .TokenHash }}` ile özelleştirilmişse.
 *   Doğrulamayı BU rota yapar (`verifyOtp`). Cihazdan bağımsızdır — link
 *   telefonda açılsa da çalışır.
 * - `code`: STOK şablon (`{{ .ConfirmationURL }}`). Doğrulamayı GoTrue'nun
 *   `/auth/v1/verify` ucu yapar, buraya yalnızca PKCE kodunu bırakır; kodu
 *   oturuma çevirmek `exchangeCodeForSession`'ın işidir. Code verifier
 *   çerezi kaydı BAŞLATAN tarayıcıda durduğu için link aynı tarayıcıda
 *   açılmalıdır.
 *
 * Güvenlik sertleştirmesi (B16): `next` doğrulanmadan `new URL(next,
 * request.url)`'e geçiyordu — `//evil.com/x` gibi protokol-göreli bir
 * değer origin DIŞINA çıkabilirdi (bu uç token taşıyor, doğrulama
 * başarılıysa OTP kullanıcıyı `next`e yönlendirir). `authNextPathSchema`
 * tek `/` ile başlamayan her değeri `/`'a düşürür.
 */

/** `auth-code-error` sayfası yalnızca "expired" ve "invalid" tanır. */
const EXPIRED_CODES = new Set(["otp_expired", "flow_state_expired"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = authNextPathSchema.parse(searchParams.get("next") ?? "/");

  const localeFromNext = next.split("/")[1];
  const locale = (routing.locales as readonly string[]).includes(localeFromNext)
    ? localeFromNext
    : routing.defaultLocale;

  const fail = (errorCode: string | null | undefined) => {
    const reason = errorCode && EXPIRED_CODES.has(errorCode) ? "expired" : "invalid";
    return NextResponse.redirect(
      new URL(`/${locale}/auth-code-error?reason=${reason}`, request.url),
    );
  };

  // GoTrue kendi doğrulaması başarısız olduğunda buraya token/code yerine
  // `?error=...&error_code=...` ile döner; bunu okumazsak süresi dolmuş bir
  // link kullanıcıya sebepsiz "geçersiz" olarak görünür.
  if (searchParams.has("error") || searchParams.has("error_code")) {
    return fail(searchParams.get("error_code"));
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    return fail(error.code);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    return fail(error.code);
  }

  return fail(null);
}
