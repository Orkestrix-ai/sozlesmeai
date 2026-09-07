import { setRequestLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ContractsTable } from "@/components/dashboard/contracts-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getRecentContracts, getWorkspaceContext } from "@/lib/dal";

/**
 * Filtre çubuğu (design.md §7.3 "sonraki aksiyon" + gelişmiş filtreler)
 * Aşama B5'te eklenecek; Faz 2 kapsamında basit liste + boş durum yeterli.
 */
export default async function ContractsPage({ params }: PageProps<"/[locale]/contracts">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const { workspace } = await getWorkspaceContext();
  const contracts = await getRecentContracts(workspace.id, 100);

  return (
    <>
      <PageHeader
        title={t("pages.contracts.title")}
        description={t("pages.contracts.description")}
        action={
          <Button asChild>
            <Link href="/contracts/new">{t("empty.contracts.cta")}</Link>
          </Button>
        }
      />
      {contracts.length === 0 ? (
        <EmptyState
          title={t("empty.contracts.title")}
          body={t("empty.contracts.body")}
          ctaLabel={t("empty.contracts.cta")}
          ctaHref="/contracts/new"
        />
      ) : (
        <ContractsTable contracts={contracts} canArchive={workspace.role !== "viewer"} />
      )}
    </>
  );
}
