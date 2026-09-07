"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext, verifySession } from "@/lib/dal";
import { validateContractTitle, type FieldErrors } from "@/lib/validation";

export type ContractFormState =
  | { fieldErrors?: FieldErrors; formError?: string }
  | undefined;

/** messages/*.json → dashboard.newContract.types ile birebir. */
const CONTRACT_TYPES = ["service", "nda", "freelance"] as const;

export async function createContractAction(
  _prev: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const title = String(formData.get("title") ?? "");
  const contractType = String(formData.get("contractType") ?? "");
  const locale = (await getLocale()) as AppLocale;

  const fieldErrors: FieldErrors = {};
  const titleError = validateContractTitle(title);
  if (titleError) fieldErrors.title = titleError;
  if (!CONTRACT_TYPES.includes(contractType as (typeof CONTRACT_TYPES)[number])) {
    fieldErrors.contractType = "required";
  }
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
      contract_type: contractType,
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

export async function archiveContractAction(formData: FormData) {
  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", contractId);

  if (error) console.error("[contracts] archiveContractAction:", error.code, error.message);
  revalidatePath("/", "layout");
}

export async function restoreContractAction(formData: FormData) {
  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ archived_at: null })
    .eq("id", contractId);

  if (error) console.error("[contracts] restoreContractAction:", error.code, error.message);
  revalidatePath("/", "layout");
}
