import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export default async function AdminIndexPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  redirect({ href: "/admin/users", locale: locale as AppLocale });
}
