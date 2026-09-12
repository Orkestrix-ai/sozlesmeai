import { redirect } from "@/i18n/navigation";

/**
 * Şablon galerisi artık `/contracts/new` içinde, "sıfırdan başla" formuyla
 * aynı ekranda duruyor — sözleşme oluşturmanın tek giriş noktası orası.
 *
 * Rota silinmedi, yönlendirildi: eski yer imleri ve paylaşılmış bağlantılar
 * ölmesin. `@/i18n/navigation`'ın redirect'i dil ön ekini korur.
 * Şablon doldurma ekranı (`/templates/[templateId]`) yerinde duruyor.
 */
export default async function TemplatesPage({ params }: PageProps<"/[locale]/templates">) {
  const { locale } = await params;
  redirect({ href: "/contracts/new", locale });
}
