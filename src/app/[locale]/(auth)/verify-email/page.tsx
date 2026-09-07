import { setRequestLocale } from "next-intl/server";

import { VerifyEmailView } from "@/components/auth/verify-email-view";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: PageProps<"/[locale]/verify-email">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { email } = await searchParams;
  return <VerifyEmailView email={typeof email === "string" ? email : undefined} />;
}
