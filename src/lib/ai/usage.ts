import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LlmUsage } from "@/lib/ai/provider";

/**
 * Bir LLM çağrısının token tüketimini `llm_usage`'a yazar.
 *
 * ÇAĞRI BAŞINA BİR SATIR. turn/route.ts bir kullanıcı mesajı için tool
 * döngüsünde 4'e kadar ayrı LLM çağrısı yapar (MAX_TOOL_ITERATIONS) ve her
 * çağrının kendi usage'ı vardır — faturalanan birim de budur. Toplamayı
 * burada yapmıyoruz; satırlar sonradan her zaman toplanabilir, ama toplanmış
 * bir satır geri ayrıştırılamaz.
 *
 * HİÇBİR KOŞULDA FIRLATMAZ. Bu telemetri; bir sözleşme turunu ya da risk
 * kontrolünü düşürmesi kabul edilemez. Yazma başarısız olursa sunucuya loglar
 * ve sessizce döner — kullanıcı tarafında hiçbir etkisi olmaz.
 */
export async function recordLlmUsage(
  usage: LlmUsage | null,
  context: { workspaceId: string; contractId: string; operation: "turn" | "review" },
): Promise<void> {
  // Sağlayıcı usage döndürmediyse satır YAZILMAZ — sıfır yazmak maliyeti
  // sessizce eksik gösterirdi (bkz. LlmResult.usage yorumu).
  if (!usage) return;

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_llm_usage", {
      p_workspace_id: context.workspaceId,
      p_contract_id: context.contractId,
      p_operation: context.operation,
      p_provider: usage.provider,
      p_model: usage.model,
      p_input_tokens: usage.inputTokens,
      p_output_tokens: usage.outputTokens,
      p_cached_input_tokens: usage.cachedInputTokens,
    });
    if (error) {
      console.error("[llm_usage] kayıt başarısız:", error.message);
    }
  } catch (cause) {
    console.error("[llm_usage] kayıt başarısız:", cause);
  }
}
