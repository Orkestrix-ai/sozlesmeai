import { AuthShell } from "@/components/auth/auth-shell";

/**
 * Bu grup için ayrı bir `params`/`setRequestLocale` yok — locale zaten
 * `src/app/[locale]/layout.tsx`de ayarlandı, her sayfa kendi `setRequestLocale`
 * çağrısını tekrarlar (statik render için next-intl'in beklediği desen).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
