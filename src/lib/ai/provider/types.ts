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

export type LlmResult = {
  text: string;
  toolCalls: LlmToolCall[];
};

export interface LlmProvider {
  streamTurn(req: LlmRequest, onText: (delta: string) => void): Promise<LlmResult>;
  createMessage(req: LlmRequest): Promise<LlmResult>;
}
