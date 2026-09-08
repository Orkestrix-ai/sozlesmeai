import { setRequestLocale, getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sectionsSchema } from "@/lib/contracts/schema";
import { shareTokenSchema, sharedContractResultSchema } from "@/lib/db/schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Herkese açık, oturum GEREKTİRMEYEN paylaşım görünümü (plan C4). `[locale]`
 * altında ama (app) grubunun DIŞINDA — dashboard kabuğunu (sidebar vb.)
 * miras almaz, yalnızca kök layout'un (html/body/font) içinde render olur.
 *
 * Güvenlik sertleştirmesi: dört ayrı service-role sorgusu (RLS'i TAMAMEN
 * atlayan, dolayısıyla bu sayfadaki bir kodlama hatasının tüm veritabanını
 * açığa çıkarabileceği bir istemci) tek `get_shared_contract` RPC'sine
 * indirgendi — o RPC yalnızca TEK bir paylaşıma karşılık gelen satırları
 * döndürebilir, token'ın kendisi yetki kanıtıdır (B11). Service-role
 * istemcisi artık YALNIZCA imzalı URL üretmek için kalıyor; o da güvenli,
 * çünkü storage_path artık istemciden değil bir tetikleyiciden geliyor (B1).
 */
export default async function SharedContractPage({ params }: PageProps<"/[locale]/s/[token]">) {
  const { locale, token: rawToken } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("sharedContract");
  const tStatus = await getTranslations("dashboard.status");

  const parsedToken = shareTokenSchema.safeParse(rawToken);

  const supabase = await createClient();

  const row = parsedToken.success
    ? await (async () => {
        const { data, error } = await supabase.rpc("get_shared_contract", { p_token: parsedToken.data });
        if (error) {
          console.error("[s/token] get_shared_contract:", error.code, error.message);
          return null;
        }
        const parsed = sharedContractResultSchema.safeParse(data);
        return parsed.success ? (parsed.data[0] ?? null) : null;
      })()
    : null;

  if (!row) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper-100 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-page-title font-heading text-ink-950">{t("invalid.title")}</h1>
          <p className="mt-2 text-body text-stone-600">{t("invalid.body")}</p>
        </div>
      </div>
    );
  }

  const sections = sectionsSchema.safeParse(row.sections).data ?? [];

  let pdfUrl: string | null = null;
  if (row.storage_path) {
    // İmzalı URL üretimi RLS'e tabi değildir (Storage nesne meta verisi
    // değil, geçici bir erişim jetonu üretimidir) — bu yüzden bunun için
    // service-role gerekli, ama artık storage_path RPC'nin (dolayısıyla
    // tetikleyicinin) ürettiği değer, istemciden gelmiyor.
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("contracts")
      .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
    pdfUrl = signed?.signedUrl ?? null;
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
          <h1 className="text-page-title font-heading text-ink-950">{row.title}</h1>
          <StatusBadge status={row.status}>{tStatus(row.status)}</StatusBadge>
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
