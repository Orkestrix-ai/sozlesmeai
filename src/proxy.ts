import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Next.js 16'da Middleware'in adı Proxy oldu; dosya `src/proxy.ts` olmalı ve
 * `app/` ile aynı seviyede durmalı. İşlevi değişmedi.
 *
 * Bu proxy locale algılamayı yapar: dil öneki olmayan istekleri
 * (`/paketler` → `/tr/paketler`) yönlendirir.
 */
export default createMiddleware(routing);

export const config = {
  // API rotalarını, Next.js iç dosyalarını ve uzantılı statik dosyaları atla.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
