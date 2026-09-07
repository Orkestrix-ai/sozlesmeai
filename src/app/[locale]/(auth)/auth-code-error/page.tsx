import { setRequestLocale } from "next-intl/server";

import { AuthCodeErrorView } from "@/components/auth/auth-code-error-view";

export default async function AuthCodeErrorPage({
  params,
  searchParams,
}: PageProps<"/[locale]/auth-code-error">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { reason } = await searchParams;
  return <AuthCodeErrorView reason={reason === "expired" ? "expired" : "invalid"} />;
}
