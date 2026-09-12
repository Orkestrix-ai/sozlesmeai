"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext, verifySession } from "@/lib/dal";
import { validateContractTitle, type FieldErrors } from "@/lib/validation";
import type { AppErrorKey } from "@/lib/i18n-keys";
import { sectionToolInputSchema, type ContractSection } from "@/lib/contracts/schema";
import { uuidSchema, createContractVersionResultSchema } from "@/lib/db/schemas";
import { dbRpc } from "@/lib/db/safe";
import { z } from "zod";

export type ContractFormState =
  | { fieldErrors?: FieldErrors; formError?: AppErrorKey }
  | undefined;

/**
 * "Sıfırdan" akışı yalnızca başlık sorar; sözleşme türü BİLEREK sorulmaz ve
 * `contract_type` null olarak açılır. Türü sohbetin ilk turunda model
 * `propose_contract_type` ile belirler (bkz. src/lib/ai/prompts.ts). Şablon
 * yolu ise türü kendi taşır (`actions/templates.ts` → contractTypeCode).
 */
export async function createContractAction(
  _prev: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const title = String(formData.get("title") ?? "");
  const locale = (await getLocale()) as AppLocale;

  const fieldErrors: FieldErrors = {};
  const titleError = validateContractTitle(title);
  if (titleError) fieldErrors.title = titleError;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // Aktif workspace + rol her zaman sunucuda yeniden okunur; formdan gelen
  // hiçbir workspace kimliğine güvenilmez (dal.ts zaten çerezi doğrular).
  const { userId } = await verifySession();
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      workspace_id: workspace.id,
      title: title.trim(),
      contract_type: null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    // RLS contracts_insert politikası viewer rolünü zaten reddeder — bu dal
    // öncelikle beklenmeyen hatalar (ağ, kısıt ihlali) içindir.
    console.error("[contracts] createContractAction:", error?.code, error?.message);
    return { formError: "generic" };
  }

  revalidatePath("/", "layout");
  redirect({ href: `/contracts/${data.id}`, locale });
}

// archiveContractAction/restoreContractAction bir <form action={...}>'a
// DOĞRUDAN bağlanıyor (bkz. contracts-table.tsx, archive/page.tsx) — bu,
// dönüş tipini `void | Promise<void>` ile sınırlar (TS'in "void kabul eden
// fonksiyon tipi her şeyi kabul eder" istisnası Promise<T> için GEÇERLİ
// DEĞİL). Buradaki sertleştirme dönüş DEĞERİNDE değil: eskiden hiçbir
// kimlik/girdi kontrolü yoktu (yalnızca RLS'e güveniliyordu) ve DB hatası
// sessizce yutuluyordu (yalnızca console.error, revalidate her koşulda
// çalışıyordu). Şimdi geçersiz contractId RLS'e/DB'ye hiç gitmiyor.

export async function archiveContractAction(formData: FormData): Promise<void> {
  await verifySession();
  const parsed = uuidSchema.safeParse(formData.get("contractId"));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", parsed.data);

  if (error) {
    console.error("[contracts] archiveContractAction:", error.code, error.message);
  }
  revalidatePath("/", "layout");
}

export async function restoreContractAction(formData: FormData): Promise<void> {
  await verifySession();
  const parsed = uuidSchema.safeParse(formData.get("contractId"));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ archived_at: null })
    .eq("id", parsed.data);

  if (error) {
    console.error("[contracts] restoreContractAction:", error.code, error.message);
  }
  revalidatePath("/", "layout");
}

const manualSectionsInputSchema = z.array(sectionToolInputSchema).min(1);

/**
 * FR-06 — elle düzenleme. İstemci TÜM bölüm dizisini (ekleme/silme/sıra
 * dahil) tek seferde gönderir, tek bir "manual" sürüm olarak kaydedilir.
 *
 * Güvenlik sertleştirmesi: artık `create_contract_version` RPC'sinden
 * geçer (bu, `contract_versions` INSERT grant'inin authenticated'tan
 * kaldırılmasının doğrudan sonucu — tek yazma yolu RPC). Elle düzenleme
 * AI kredisi yakmaz (bugüne kadarki davranışla aynı): RPC 'manual'
 * kaynağını 'manual_edit' işlem koduna eşler, o işlemin maliyeti 0'dır.
 */
export async function saveManualSectionsAction(
  contractId: string,
  sections: ContractSection[],
): Promise<{ error?: string; sections?: ContractSection[] }> {
  const parsedId = uuidSchema.safeParse(contractId);
  if (!parsedId.success) return { error: "invalid_input" };

  const parsedSections = manualSectionsInputSchema.safeParse(sections);
  if (!parsedSections.success) return { error: "invalid_input" };

  await verifySession();
  const supabase = await createClient();

  // İstemci TÜM bölüm dizisini (ekleme/silme/sıra dahil) tek seferde
  // gönderir — mevcut sürümle BİRLEŞTİRİLMEZ, olduğu gibi yeni sürüm olur.
  const merged: ContractSection[] = parsedSections.data.map((s) => ({ ...s, lastEditedBy: "user" as const }));

  const result = await dbRpc(
    "contracts:saveManualSectionsAction",
    () =>
      supabase.rpc("create_contract_version", {
        p_contract_id: parsedId.data,
        p_sections: merged,
        p_source: "manual",
        p_idempotency_key: crypto.randomUUID(),
      }),
    createContractVersionResultSchema,
  );

  if (!result.ok) {
    return { error: result.code };
  }

  revalidatePath(`/contracts/${parsedId.data}`);
  return { sections: merged };
}

/**
 * Kullanıcı onayı — design.md §8: "AI çıktısı hiçbir zaman otomatik olarak
 * 'nihai' gösterilmemeli." Bu yüzden `ready` durumuna YALNIZCA bu açık
 * aksiyon geçirir, hiçbir AI tool çağrısı otomatik geçiremez.
 */
export async function approveContractAction(contractId: string): Promise<{ error?: string }> {
  await verifySession();
  const parsed = uuidSchema.safeParse(contractId);
  if (!parsed.success) return { error: "invalid_input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ status: "ready" })
    .eq("id", parsed.data)
    .in("status", ["draft", "review"]);

  if (error) {
    console.error("[contracts] approveContractAction:", error.code, error.message);
    return { error: "generic" };
  }
  revalidatePath(`/contracts/${parsed.data}`);
  return {};
}
