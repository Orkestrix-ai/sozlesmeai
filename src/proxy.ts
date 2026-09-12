import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing, type AppLocale } from "./i18n/routing";
import { getPathname } from "./i18n/navigation";
import { refreshSession } from "./lib/supabase/proxy";

/**
 * Next.js 16'da Middleware'in adı Proxy oldu; dosya `src/proxy.ts` olmalı ve
 * `app/` ile aynı seviyede durmalı. İşlevi değişmedi.
 *
 * Bu proxy iki işi sırayla yapar:
 * 1) next-intl locale algılaması (dil öneki olmayan istekleri yönlendirir).
 * 2) Supabase oturum yenilemesi + İYİMSER auth kapısı (gerçek kontrol
 *    src/lib/dal.ts'te — bkz. Next.js authentication rehberi: "Proxy should
 *    not be used as a full session management or authorization solution.").
 *
 * KOMPOZİSYON SIRASI KRİTİK: Supabase'in kendi "yanıtı setAll içinde yeniden
 * kur" kalıbı burada KULLANILMAZ. Onun yerine: Supabase isteği günceller ve
 * yazılacak çerezleri kaydeder → next-intl KENDİ yanıtını üretir (yönlendirme
 * veya rewrite) → kaydedilen çerezler o yanıta basılır. Sıra tersine
 * çevrilirse ya intl'in rewrite başlıkları kaybolur (locale algılama bozulur)
 * ya da tazelenmiş auth çerezi tarayıcıya hiç ulaşmaz (rastgele oturum
 * düşmeleri). Bkz. src/lib/supabase/proxy.ts'teki yorum.
 */
const intlMiddleware = createMiddleware(routing);

const PROTECTED = ["/dashboard", "/contracts", "/templates", "/archive", "/settings", "/admin"];
const AUTH_ONLY = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

export default async function proxy(request: NextRequest) {
  // /auth/* (e-posta onay/kurtarma) locale önekli DEĞİLDİR ve kendi Route
  // Handler'ı çerezleri zaten yazar; next-intl bunları /tr/auth/... diye
  // yönlendirip 404 üretmesin.
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // 1) Supabase: isteği güncelle + yazılacak çerezleri topla.
  const { claims, cookiesToSet } = await refreshSession(request);

  // 2) next-intl: yanıtı O üretsin (yönlendirme veya rewrite).
  const response = intlMiddleware(request);

  // 3) Tazelenmiş oturum çerezlerini yanıta bas — HER dalda.
  const applySupabaseCookies = (res: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  };
  applySupabaseCookies(response);

  // 4) intl yönlendirdiyse (dil öneki ekleme/kaldırma) burada bitir; auth
  //    kapısı bir sonraki, önekli istekte çalışır.
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // 5) İYİMSER auth kapısı.
  //
  // Server Action POST'ları React'in flight protokolünü bekler: yanıt ya
  // `content-type: text/x-component` olmalı ya da `x-action-redirect`
  // taşımalı. Buradan NextResponse.redirect() dönersek tarayıcı 307'yi POST
  // olarak takip eder, hedef sayfanın HTML'ini alır ve istemci
  // "An unexpected response was received from the server." diye patlar
  // (next/dist/client/.../server-action-reducer.js). Hata React katmanının
  // ALTINDA oluştuğu için error.tsx sınırları da devreye giremez.
  //
  // Bu yüzden iyimser kapı action isteklerinde atlanır: yetkiyi zaten
  // action'ın kendi verifySession() / requirePlatformAdmin() çağrısı veriyor
  // ve onun redirect()'ini Next doğru başlıkla serileştiriyor.
  const isServerAction = request.method === "POST" && request.headers.has("next-action");

  const [, maybeLocale, ...rest] = request.nextUrl.pathname.split("/");
  const locale = (routing.locales as readonly string[]).includes(maybeLocale)
    ? (maybeLocale as AppLocale)
    : routing.defaultLocale;
  const relativePath = "/" + rest.join("/");

  const isProtected = PROTECTED.some(
    (p) => relativePath === p || relativePath.startsWith(p + "/"),
  );
  const isAuthOnly = AUTH_ONLY.some((p) => relativePath === p);

  const redirectTo = (href: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = getPathname({ href, locale });
    url.search = "";
    Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
    const redirectResponse = NextResponse.redirect(url);
    // intl'in bu dalda ürettiği çerezleri (varsa) taşı, sonra Supabase'inkileri bas.
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return applySupabaseCookies(redirectResponse);
  };

  if (!isServerAction) {
    if (isProtected && !claims?.sub) {
      return redirectTo("/login", { next: request.nextUrl.pathname });
    }
    if (isAuthOnly && claims?.sub) {
      return redirectTo("/dashboard");
    }
  }

  return response;
}

export const config = {
  // API rotalarını, Next.js iç dosyalarını ve uzantılı statik dosyaları atla.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
