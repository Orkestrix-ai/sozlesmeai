"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/admin/dal";
import { addCreditsSchema, adminAddCreditsResultSchema } from "@/lib/db/schemas";
import { dbRpc } from "@/lib/db/safe";

/**
 * Plan D1/D3 — kritik admin aksiyonu, onay modalı ile birlikte kullanılır
 * (bkz. src/components/admin/add-credits-dialog.tsx).
 *
 * Güvenlik sertleştirmesi: artık service-role İSTEMCİSİ KULLANMIYOR.
 * Defter kaydı + denetim kaydı `admin_add_credits` RPC'sinde TEK
 * transaction'da yazılıyor (B9 — eskiden iki ayrı service-role çağrısıydı;
 * ikincisi (audit log) başarısız olursa yalnızca console.error'a yazılıp
 * başarı dönülüyordu, migration'ın verdiği "birlikte garanti" gerçek
 * değildi). Yetki kontrolü hem burada (requirePlatformAdmin) hem RPC
 * içinde (private.is_platform_admin()) — savunma derinliği.
 */
export async function addCreditsAction(
  workspaceId: string,
  amount: number,
): Promise<{ error?: string }> {
  await requirePlatformAdmin();

  const parsed = addCreditsSchema.safeParse({ workspaceId, amount });
  if (!parsed.success) {
    return { error: "invalid_amount" };
  }

  const supabase = await createClient();

  const result = await dbRpc(
    "admin:addCreditsAction",
    () =>
      supabase.rpc("admin_add_credits", {
        p_workspace_id: parsed.data.workspaceId,
        p_amount: parsed.data.amount,
        p_idempotency_key: crypto.randomUUID(),
      }),
    adminAddCreditsResultSchema,
  );

  if (!result.ok) {
    return { error: result.code };
  }

  revalidatePath("/admin/billing");
  return {};
}
