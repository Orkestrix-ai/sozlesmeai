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
 * Güvenlik sertleştirmesi (B16): `next` doğrulanmadan `new URL(next,
 * request.url)`'e geçiyordu — `//evil.com/x` gibi protokol-göreli bir
 * değer origin DIŞINA çıkabilirdi (bu uç token taşıyor, doğrulama
 * başarılıysa OTP kullanıcıyı `next`e yönlendirir). `authNextPathSchema`
 * tek `/` ile başlamayan her değeri `/`'a düşürür.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = authNextPathSchema.parse(searchParams.get("next") ?? "/");

  const localeFromNext = next.split("/")[1];
  const locale = (routing.locales as readonly string[]).includes(localeFromNext)
    ? localeFromNext
    : routing.defaultLocale;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    const reason = error.code === "otp_expired" ? "expired" : "invalid";
    return NextResponse.redirect(
      new URL(`/${locale}/auth-code-error?reason=${reason}`, request.url),
    );
  }

  return NextResponse.redirect(new URL(`/${locale}/auth-code-error?reason=invalid`, request.url));
}
