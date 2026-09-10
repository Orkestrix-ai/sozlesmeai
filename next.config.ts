import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // `[locale]/layout.tsx` kök layout olduğu için (üstte `app/layout.tsx`
    // yok), eşleşmeyen URL'ler için `app/global-not-found.tsx` gerekiyor —
    // bkz. Next.js docs, not-found.md "Your root layout is defined using
    // top-level dynamic segments".
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
