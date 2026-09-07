"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/admin/dal";

/**
 * Plan D1/D3 — kritik admin aksiyonu, onay modalı ile birlikte kullanılır
 * (bkz. src/components/admin/add-credits-dialog.tsx). Service-role RLS'i
 * atlar; bu yüzden yetki kontrolü BURADA yapılır ve her çağrı bir
 * admin_audit_log satırı bırakır — service-role kullanan tek yazma yolu bu
 * ikisinin birlikte garanti edildiği yerdir (bkz. migration'daki yorum).
 */
export async function addCreditsAction(
  workspaceId: string,
  amount: number,
): Promise<{ error?: string }> {
  const { userId } = await requirePlatformAdmin();

  if (!Number.isInteger(amount) || amount <= 0) {
    return { error: "invalid_amount" };
  }

  const admin = createAdminClient();

  const { error: ledgerError } = await admin.from("credit_ledger").insert({
    workspace_id: workspaceId,
    actor_id: userId,
    entry_type: "adjustment",
    amount,
    reason: "adjustment",
  });
  if (ledgerError) {
    console.error("[admin] addCreditsAction ledger:", ledgerError.code, ledgerError.message);
    return { error: "generic" };
  }

  const { error: logError } = await admin.from("admin_audit_log").insert({
    actor_id: userId,
    action: "add_credits",
    resource_type: "workspace",
    resource_id: workspaceId,
    detail: { amount },
  });
  if (logError) {
    console.error("[admin] addCreditsAction audit log:", logError.code, logError.message);
  }

  revalidatePath("/admin/billing");
  return {};
}
