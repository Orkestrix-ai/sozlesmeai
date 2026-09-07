import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getContract } from "@/lib/dal";

/**
 * Faz 3'e kadar yer tutucu: AI destekli taslak/düzenleme ekranı (design.md
 * §8) burada oluşacak. Şimdilik yalnızca metadata + durum gösterilir — RLS
 * zaten başka bir workspace'in sözleşmesini döndürmez (getContract → null).
 */
export default async function ContractDetailPage({ params }: PageProps<"/[locale]/contracts/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const contract = await getContract(id);
  if (!contract) notFound();

  const t = await getTranslations("dashboard");
  const tTypes = await getTranslations("dashboard.newContract.types");
  const tStatus = await getTranslations("dashboard.status");
  const tDetail = await getTranslations("dashboard.contracts.detail");

  const typeLabel =
    contract.contract_type && ["service", "nda", "freelance"].includes(contract.contract_type)
      ? tTypes(contract.contract_type as "service" | "nda" | "freelance")
      : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-page-title font-heading text-ink-950">
          {contract.title || t("contracts.untitled")}
        </h1>
        <StatusBadge status={contract.status}>{tStatus(contract.status)}</StatusBadge>
      </div>
      {typeLabel && <p className="mb-6 text-body text-stone-600">{typeLabel}</p>}

      <Alert variant="neutral">
        <AlertTitle>{tDetail("stubTitle")}</AlertTitle>
        <AlertDescription>{tDetail("stubBody")}</AlertDescription>
      </Alert>

      <Button asChild variant="secondary" className="mt-6">
        <Link href="/contracts">{tDetail("backToList")}</Link>
      </Button>
    </div>
  );
}
