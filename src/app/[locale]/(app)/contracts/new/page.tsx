import { setRequestLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";
import { NewContractForm } from "@/components/dashboard/new-contract-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getWorkspaceContext } from "@/lib/dal";

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
        <NewContractForm />
      )}
    </>
  );
}
