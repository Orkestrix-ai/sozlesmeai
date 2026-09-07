import { setRequestLocale, getTranslations } from "next-intl/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sectionsSchema } from "@/lib/contracts/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Herkese açık, oturum GEREKTİRMEYEN paylaşım görünümü (plan C4). `[locale]`
 * altında ama (app) grubunun DIŞINDA — dashboard kabuğunu (sidebar vb.)
 * miras almaz, yalnızca kök layout'un (html/body/font) içinde render olur.
 * Doğrulama service-role ile yapılır; token'ın kendisi tek yetki kanıtıdır.
 */
export default async function SharedContractPage({ params }: PageProps<"/[locale]/s/[token]">) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("sharedContract");
  const tStatus = await getTranslations("dashboard.status");

  const admin = createAdminClient();

  const { data: share } = await admin
    .from("contract_shares")
    .select("contract_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  const isValid =
    !!share && !share.revoked_at && (!share.expires_at || new Date(share.expires_at) > new Date());

  const contract = isValid
    ? (
        await admin
          .from("contracts")
          .select("id, title, status")
          .eq("id", share!.contract_id)
          .maybeSingle()
      ).data
    : null;

  if (!isValid || !contract) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper-100 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-page-title font-heading text-ink-950">{t("invalid.title")}</h1>
          <p className="mt-2 text-body text-stone-600">{t("invalid.body")}</p>
        </div>
      </div>
    );
  }

  const { data: version } = await admin
    .from("contract_versions")
    .select("id, sections")
    .eq("contract_id", contract.id)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sections = version ? (sectionsSchema.safeParse(version.sections).data ?? []) : [];

  let pdfUrl: string | null = null;
  if (version) {
    const { data: document } = await admin
      .from("contract_documents")
      .select("storage_path")
      .eq("version_id", version.id)
      .maybeSingle();
    if (document) {
      const { data: signed } = await admin.storage
        .from("contracts")
        .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS);
      pdfUrl = signed?.signedUrl ?? null;
    }
  }

  return (
    <div className="min-h-dvh bg-paper-100">
      <header className="border-b border-stone-200 bg-paper-50 px-6 py-4">
        <span className="text-card-title font-heading text-ink-950">Sözleşme Stüdyosu</span>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Alert variant="neutral" className="mb-6">
          <AlertDescription>{t("readOnlyNote")}</AlertDescription>
        </Alert>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-page-title font-heading text-ink-950">{contract.title}</h1>
          <StatusBadge status={contract.status}>{tStatus(contract.status)}</StatusBadge>
        </div>

        {sections.length > 0 && (
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.key} className="rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-4">
                <h2 className="text-card-title font-heading text-ink-950">{section.title}</h2>
                <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-contract)] text-contract text-stone-800">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          {pdfUrl ? (
            <Button asChild>
              <a href={pdfUrl}>{t("downloadPdf")}</a>
            </Button>
          ) : (
            <p className="text-helper text-stone-600">{t("pdfNotReady")}</p>
          )}
        </div>
      </main>
    </div>
  );
}
