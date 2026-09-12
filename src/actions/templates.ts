"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext, verifySession } from "@/lib/dal";
import { sectionsSchema } from "@/lib/contracts/schema";
import {
  buildContractTitle,
  buildTemplateLabels,
  getTemplate,
  renderTemplateSections,
  type ContractTemplate,
  type TemplateValues,
} from "@/lib/contracts/templates";
import { validateContractTitle, type FieldErrors } from "@/lib/validation";
import type { AppErrorKey } from "@/lib/i18n-keys";
import { createContractVersionResultSchema } from "@/lib/db/schemas";
import { dbRpc } from "@/lib/db/safe";

export type TemplateFormState = {
  formError?: AppErrorKey;
  fieldErrors?: FieldErrors;
};

/** Bir tur içinde makul üst sınır; şablon alanlarının kendi maxLength'i ayrıca uygulanır. */
const MAX_FIELD_LENGTH = 4000;

/**
 * Şablonun KENDİ alan tanımından çalışma anında kurulan şema
 * (`src/lib/db/schemas.ts` felsefesi: DB sınırına ulaşmadan hemen önce dar bir
 * doğrulama). İstemcinin gönderdiği fazladan anahtarlar burada düşer —
 * `renderTemplateSections` zaten yalnızca tanımlı alanları okur, ama
 * doğrulanmamış veriyi taşımanın da anlamı yok.
 */
function buildValuesSchema(template: ContractTemplate) {
  const shape: Record<string, z.ZodType<string>> = {};

  for (const field of template.fields) {
    let schema = z.string().max(Math.min(field.maxLength ?? MAX_FIELD_LENGTH, MAX_FIELD_LENGTH));

    if (field.type === "select" && field.options) {
      const allowed = field.options.map((option) => option.value);
      schema = schema.refine((value) => value === "" || allowed.includes(value));
    }
    if (field.type === "date") {
      schema = schema.refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value));
    }
    if (field.type === "number") {
      schema = schema.refine((value) => value === "" || Number.isFinite(Number(value)));
    }

    shape[field.name] = schema;
  }

  return z.object(shape).partial();
}

/**
 * Hazır şablondan sözleşme üretir ve kullanıcıyı mevcut sözleşme ekranına
 * bırakır. Buradan sonrası zaten var: AI ile düzenleme, risk kontrolü, onay,
 * PDF, arşiv, paylaşım — hiçbiri yeniden yazılmadı.
 *
 * Kredi notu: bu yol LLM çağırmaz ve `create_contract_version`ın 'manual'
 * kaynağı `manual_edit` işlemine eşlenir (maliyet 0, bkz.
 * 20260910120000_pay_as_you_go.sql). Bu yüzden `/turn` ve `/review`daki
 * `can_afford` ön kapısının buradaki karşılığı YOKTUR: orada kapı "sağlayıcı
 * token'ı yakmadan önce kullanıcı çıktının parasını ödeyebilir mi" sorusuydu,
 * burada yakılacak token yok. Ücret, her zamanki gibi, PDF adımında düşer.
 */
export async function createFromTemplateAction(
  templateId: string,
  rawValues: TemplateValues,
): Promise<TemplateFormState | undefined> {
  const template = getTemplate(templateId);
  if (!template) return { formError: "notFound" };

  const parsed = buildValuesSchema(template).safeParse(rawValues);
  if (!parsed.success) return { formError: "generic" };
  const values = parsed.data as TemplateValues;

  // Zorunlu alanlar — istemci zaten uyarıyor, ama tek doğrulama yeri istemci olamaz.
  const fieldErrors: FieldErrors = {};
  for (const field of template.fields) {
    if (field.required && (values[field.name] ?? "").trim().length === 0) {
      fieldErrors[field.name] = "required";
    }
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("dashboard.templates");
  const labels = buildTemplateLabels(template, t);

  const title = buildContractTitle(template, values, t(template.nameKey)).slice(0, 140);
  if (validateContractTitle(title)) return { formError: "generic" };

  const sections = renderTemplateSections(template, values, locale, labels);
  const validSections = sectionsSchema.safeParse(sections);
  if (!validSections.success || validSections.data.length === 0) {
    console.error("[templates] rendered sections failed schema:", templateId);
    return { formError: "generic" };
  }

  // Aktif workspace ve rol her zaman sunucuda yeniden okunur; istemciden gelen
  // hiçbir workspace kimliğine güvenilmez (createContractAction ile aynı desen).
  const { userId } = await verifySession();
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();

  const { data: contract, error: insertError } = await supabase
    .from("contracts")
    .insert({
      workspace_id: workspace.id,
      title,
      contract_type: template.contractTypeCode,
      created_by: userId,
    })
    .select("id")
    .single();

  if (insertError || !contract) {
    // RLS contracts_insert politikası viewer rolünü zaten reddeder.
    console.error("[templates] insert contract:", insertError?.code, insertError?.message);
    return { formError: "generic" };
  }

  const result = await dbRpc(
    "templates:createFromTemplateAction",
    () =>
      supabase.rpc("create_contract_version", {
        p_contract_id: contract.id,
        p_sections: validSections.data,
        p_source: "manual",
        p_idempotency_key: crypto.randomUUID(),
      }),
    createContractVersionResultSchema,
  );

  if (!result.ok) {
    // Sözleşme satırı boş bir taslak olarak KALIR, silinmez: silme yolu
    // workspace_activity'nin append-only tarafıyla birlikte tasarlanmalı
    // (bkz. CLAUDE.md "Append-only audit tables"). Kullanıcı sözleşmeyi
    // /contracts listesinde görür ve oradan arşivleyebilir.
    console.error("[templates] create_contract_version:", result.code);
    return { formError: "generic" };
  }

  revalidatePath("/", "layout");
  redirect({ href: `/contracts/${contract.id}`, locale });
}
