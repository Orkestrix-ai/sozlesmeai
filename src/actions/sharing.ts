"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";

/**
 * design.md/plan C4 — paylaşım. E-posta sağlayıcısı yapılandırılmadığı için
 * akış "bağlantıyı kopyala" temelli (bkz. contract_shares migration'ı).
 * Yalnızca onaylanmış ("ready") sürümler paylaşılabilir — design.md §8:
 * "AI çıktısı hiçbir zaman otomatik 'nihai' gösterilmemeli."
 */
export async function createShareAction(
  contractId: string,
): Promise<{ error?: string; token?: string }> {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("status")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract || contract.status !== "ready") {
    return { error: "not_ready" };
  }

  const token = randomBytes(24).toString("base64url");

  const { error } = await supabase
    .from("contract_shares")
    .insert({ contract_id: contractId, token, created_by: userId });

  if (error) {
    console.error("[sharing] createShareAction:", error.code, error.message);
    return { error: "generic" };
  }

  revalidatePath(`/contracts/${contractId}`);
  return { token };
}

export async function revokeShareAction(shareId: string, contractId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contract_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId);

  if (error) console.error("[sharing] revokeShareAction:", error.code, error.message);
  revalidatePath(`/contracts/${contractId}`);
}
