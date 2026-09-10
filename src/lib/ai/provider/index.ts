import "server-only";

import { anthropicProvider } from "./anthropic";
import { groqProvider } from "./groq";
import type { LlmProvider } from "./types";

export type { LlmMessage, LlmProvider, LlmRequest, LlmResult, LlmSystemBlock, LlmToolCall, LlmToolDef, LlmToolResult } from "./types";

/**
 * `LLM_PROVIDER` env değişkenine göre tekil sağlayıcı seçilir. Varsayılan
 * "anthropic" (prod). Bilinmeyen bir değer sessizce Anthropic'e düşmez —
 * yanlış yapılandırmayı erken ve açık şekilde patlatır.
 */
export function getLlmProvider(): LlmProvider {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase() || "anthropic";
  if (raw === "groq") return groqProvider;
  if (raw === "anthropic") return anthropicProvider;
  throw new Error(`unknown LLM_PROVIDER: "${raw}" (beklenen: "groq" | "anthropic")`);
}
