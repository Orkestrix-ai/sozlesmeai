"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
// Locale'den bağımsız bir kontrol-akışı yardımcısı olduğu için `next/navigation`
// doğrudan kullanılıyor; @/i18n/navigation kuralı yalnızca Link/redirect/router
// için geçerli (bkz. CLAUDE.md i18n bölümü).
import { unstable_rethrow } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { verifySession, requireWorkspaceRole } from "@/lib/dal";
import { uuidSchema } from "@/lib/db/schemas";

/**
 * design.md/plan C4 — paylaşım. E-posta sağlayıcısı yapılandırılmadığı için
 * akış "bağlantıyı kopyala" temelli (bkz. contract_shares migration'ı).
 * Yalnızca onaylanmış ("ready") sürümler paylaşılabilir — design.md §8:
 * "AI çıktısı hiçbir zaman otomatik 'nihai' gösterilmemeli."
 *
 * Güvenlik sertleştirmesi: `verifySession()` zaten çağrılıyordu ama rol
 * kontrolü YOKTU — `contract_shares_insert` RLS politikası admin/editor
 * dışını reddediyordu, ama bu tek savunma hattıydı. `requireWorkspaceRole`
 * (dal.ts'te tanımlı ama hiç çağrılmıyordu) burada eklendi — hata artık
 * DB'ye gitmeden, daha net bir mesajla döner.
 */
export async function createShareAction(
  contractId: string,
): Promise<{ error?: string; token?: string }> {
  const parsedId = uuidSchema.safeParse(contractId);
  if (!parsedId.success) return { error: "invalid_input" };

  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("status, workspace_id")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (!contract || contract.status !== "ready") {
    return { error: "not_ready" };
  }

  try {
    await requireWorkspaceRole(contract.workspace_id, ["admin", "editor"]);
  } catch (err) {
    // requireWorkspaceRole -> verifySession() zinciri redirect() çağırabilir ve
    // onun NEXT_REDIRECT sinyali normal bir Error gibi görünür; çıplak bir
    // catch onu yutup yönlendirmeyi sessizce öldürür. Bugün erişilemez bir
    // durum (yukarıdaki verifySession() çağrısı try'ın dışında ve cache()'li),
    // ama o satır kalkarsa tuzak sessizce kurulur. unstable_rethrow framework
    // sinyallerini geçirir, yalnızca "yetersiz yetki" burada kalır.
    unstable_rethrow(err);
    return { error: "unauthorized" };
  }

  const token = randomBytes(24).toString("base64url");

  const { error } = await supabase
    .from("contract_shares")
    .insert({ contract_id: parsedId.data, token, created_by: userId });

  if (error) {
    console.error("[sharing] createShareAction:", error.code, error.message);
    return { error: "generic" };
  }

  revalidatePath(`/contracts/${parsedId.data}`);
  return { token };
}

export async function revokeShareAction(
  shareId: string,
  contractId: string,
): Promise<{ error?: string }> {
  const parsedShareId = uuidSchema.safeParse(shareId);
  const parsedContractId = uuidSchema.safeParse(contractId);
  if (!parsedShareId.success || !parsedContractId.success) return { error: "invalid_input" };

  await verifySession();
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("workspace_id")
    .eq("id", parsedContractId.data)
    .maybeSingle();
  if (!contract) return { error: "not_found" };

  try {
    await requireWorkspaceRole(contract.workspace_id, ["admin", "editor"]);
  } catch (err) {
    // Gerekçe için createShareAction'daki yorum.
    unstable_rethrow(err);
    return { error: "unauthorized" };
  }

  const { error } = await supabase
    .from("contract_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsedShareId.data);

  if (error) {
    console.error("[sharing] revokeShareAction:", error.code, error.message);
    revalidatePath(`/contracts/${parsedContractId.data}`);
    return { error: "generic" };
  }
  revalidatePath(`/contracts/${parsedContractId.data}`);
  return {};
}
