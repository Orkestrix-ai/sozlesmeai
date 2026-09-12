import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { NewContractForm } from "@/components/dashboard/new-contract-form";
import { TemplateGallery } from "@/components/templates/template-gallery";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getWorkspaceContext } from "@/lib/dal";

/**
 * Sözleşme oluşturmanın TEK giriş noktası: hazır şablonla ya da sıfırdan.
 * Eskiden bu iki yol ayrı menü öğelerindeydi ("Yeni sözleşme" / "Şablonlar"),
 * dolayısıyla kullanıcı hangisini istediğini tıklamadan önce bilmek zorundaydı.
 *
 * İki yol da aynı yere çıkar (`/contracts/[id]`); tek fark şablon yolunun ilk
 * sürümü de yazması. Bu yüzden çatallanma yalnızca burada, oluşturmadan önce.
 *
 * design.md §5 (ekran başına tek birincil aksiyon): şablon kartlarının CTA'ları
 * bilerek `secondary`, PageHeader'a `action` verilmiyor — ekrandaki tek kırmızı
 * buton aşağıdaki formun submit'i.
 */
export default async function NewContractPage({ params }: PageProps<"/[locale]/contracts/new">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const tErrors = await getTranslations("errors");
  const { workspace } = await getWorkspaceContext();

  return (
    <>
      <PageHeader
        title={t("pages.newContract.title")}
        description={t("pages.newContract.description")}
      />
      {workspace.role === "viewer" ? (
        <Alert variant="neutral" className="max-w-lg">
          <AlertDescription>{tErrors("unauthorized")}</AlertDescription>
        </Alert>
      ) : (
        <>
          <section>
            <h2 className="text-card-title font-heading text-ink-950">
              {t("newContract.fromTemplateTitle")}
            </h2>
            <p className="mt-1 mb-4 text-helper text-stone-600">
              {t("newContract.fromTemplateDescription")}
            </p>
            <TemplateGallery />
          </section>

          <hr className="my-8 border-stone-200" />

          <section>
            <h2 className="text-card-title font-heading text-ink-950">
              {t("newContract.fromScratchTitle")}
            </h2>
            <p className="mt-1 mb-4 text-helper text-stone-600">
              {t("newContract.fromScratchDescription")}
            </p>
            <NewContractForm />
          </section>
        </>
      )}
    </>
  );
}
