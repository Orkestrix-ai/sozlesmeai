import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { ContractWorkspace } from "@/components/contracts/contract-workspace";
import type { ChatMessage } from "@/components/contracts/chat-panel";
import type { Finding, VersionEntry } from "@/components/contracts/draft-panel";
import type { ShareEntry } from "@/components/contracts/share-panel";
import {
  getContract,
  getContractFindings,
  getContractMessages,
  getContractShares,
  getContractVersions,
  getMembershipRole,
} from "@/lib/dal";
import { sectionsSchema } from "@/lib/contracts/schema";
import type { AppLocale } from "@/i18n/routing";

/**
 * design.md §8 — sözleşme oluşturma/düzenleme ekranı. RLS zaten başka bir
 * workspace'in sözleşmesini döndürmez (getContract → null → notFound).
 */
export default async function ContractDetailPage({ params }: PageProps<"/[locale]/contracts/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const contract = await getContract(id);
  if (!contract) notFound();

  const t = await getTranslations("dashboard.contracts");

  const [role, rawMessages, rawVersions, rawFindings, rawShares] = await Promise.all([
    getMembershipRole(contract.workspace_id),
    getContractMessages(id),
    getContractVersions(id),
    getContractFindings(id),
    getContractShares(id),
  ]);

  const messages: ChatMessage[] = rawMessages.map((m) => ({
    id: String(m.id),
    role: m.role,
    content: m.content,
  }));

  const versions: VersionEntry[] = rawVersions.map((v) => ({
    id: v.id,
    versionNo: v.version_no,
    source: v.source,
    sections: sectionsSchema.safeParse(v.sections).data ?? [],
  }));

  const findings: Finding[] = rawFindings.map((f) => ({
    id: f.id,
    code: f.code,
    severity: f.severity,
    sectionKey: f.section_key,
    detail: f.detail,
  }));

  const shares: ShareEntry[] = rawShares.map((s) => ({ id: s.id, token: s.token }));

  return (
    <div>
      <h1 className="mb-4 text-page-title font-heading text-ink-950">
        {contract.title || t("untitled")}
      </h1>
      <ContractWorkspace
        contractId={id}
        locale={locale as AppLocale}
        initialStatus={contract.status}
        canEdit={role !== null && role !== "viewer"}
        initialMessages={messages}
        initialVersions={versions}
        initialFindings={findings}
        initialShares={shares}
      />
    </div>
  );
}
