import "server-only";

/**
 * Sağlayıcı-nötr tipler — turn/review rotaları bu tiplere karşı yazılır,
 * `@anthropic-ai/sdk` tiplerine doğrudan bağımlı değildir. Bu sayede
 * `LLM_PROVIDER` ile Anthropic/Groq arasında geçiş rota kodunu etkilemez.
 * Şekiller `src/lib/ai/contract-tools.ts` ve `review-tool.ts`'teki mevcut
 * JSON şemalarını (strict, additionalProperties:false) taşıyacak kadar
 * geniş; her iki sağlayıcı da bu oturumda bu şekillere karşı test edildi.
 */

export type LlmToolDef = {
  name: string;
  description: string;
  inputSchema: object;
};

export type LlmToolCall = {
  id: string;
  name: string;
  input: unknown;
};

export type LlmToolResult = {
  id: string;
  content: string;
  isError?: boolean;
};

export type LlmMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; text: string; toolCalls: LlmToolCall[] }
  | { role: "tool_results"; results: LlmToolResult[] };

export type LlmSystemBlock = { text: string; cacheable?: boolean };

export type LlmRequest = {
  system: LlmSystemBlock[];
  tools: LlmToolDef[];
  messages: LlmMessage[];
  maxTokens: number;
  /**
   * Yalnızca destekleyen sağlayıcı uygular. Anthropic tarafında thinking
   * açıkken tool_choice "auto"/"none" dışında bir şey kabul etmiyor
   * (bkz. review/route.ts'teki mevcut yorum) — bu yüzden Anthropic adaptörü
   * bunu YOK SAYAR; Groq'ta karşılığı var ve uygulanır.
   */
  forceTool?: string;
};

/**
 * Bir LLM ÇAĞRISININ token tüketimi. Yönetim panelindeki API gideri KPI'ı
 * bunu `llm_usage` tablosuna yazar (bkz. src/lib/ai/usage.ts).
 *
 * `provider`/`model` burada taşınır çünkü sağlayıcı `LLM_PROVIDER` env'i ile
 * değişebiliyor ve her modelin birim fiyatı farklı: hangi fiyatın uygulanacağını
 * çağrının KENDİSİ söylemeli, sonradan env'e bakılarak tahmin edilmemeli.
 */
export type LlmUsage = {
  provider: "anthropic" | "groq";
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Yalnızca Anthropic (prompt caching açık); Groq'ta karşılığı yok, 0 kalır. */
  cachedInputTokens: number;
};

export type LlmResult = {
  text: string;
  toolCalls: LlmToolCall[];
  /**
   * Sağlayıcı usage döndürmezse `null` — sıfır UYDURULMAZ. Sıfır yazmak
   * maliyeti sessizce eksik gösterirdi; null ise çağıran taraf satırı hiç
   * yazmaz ve eksiklik görünür kalır.
   */
  usage: LlmUsage | null;
};

export interface LlmProvider {
  streamTurn(req: LlmRequest, onText: (delta: string) => void): Promise<LlmResult>;
  createMessage(req: LlmRequest): Promise<LlmResult>;
}
