import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { LlmMessage, LlmProvider, LlmRequest, LlmResult, LlmToolCall } from "./types";

export const ANTHROPIC_MODEL = "claude-opus-5";

/**
 * İstemci TEMBEL kurulur — modül import edildiği anda değil, ilk istek
 * atıldığında. `LLM_PROVIDER=groq` iken `ANTHROPIC_API_KEY` boş/yer tutucu
 * olabilir; modül seviyesinde `new Anthropic()` bunu import anında patlatır
 * (bkz. eski src/lib/ai/client.ts).
 */
let client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

function toAnthropicMessages(messages: LlmMessage[]): Anthropic.MessageParam[] {
  return messages.map((m): Anthropic.MessageParam => {
    if (m.role === "user") {
      return { role: "user", content: m.content };
    }
    if (m.role === "assistant") {
      const content: Anthropic.ContentBlockParam[] = [];
      if (m.text) content.push({ type: "text", text: m.text });
      for (const tc of m.toolCalls) {
        content.push({ type: "tool_use", id: tc.id, name: tc.name, input: tc.input });
      }
      return { role: "assistant", content };
    }
    // tool_results — Anthropic'te tek bir user mesajı içinde tool_result bloklarının dizisi olur.
    const content: Anthropic.ToolResultBlockParam[] = m.results.map((r) => ({
      type: "tool_result",
      tool_use_id: r.id,
      content: r.content,
      is_error: r.isError,
    }));
    return { role: "user", content };
  });
}

function toAnthropicTools(tools: LlmRequest["tools"]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    strict: true,
    input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
  }));
}

function toAnthropicSystem(system: LlmRequest["system"]): Anthropic.TextBlockParam[] {
  return system.map((s) => ({
    type: "text",
    text: s.text,
    ...(s.cacheable ? { cache_control: { type: "ephemeral" as const } } : {}),
  }));
}

function extractResult(response: Anthropic.Message): LlmResult {
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  const toolUseBlocks = response.content.filter(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  const toolCalls: LlmToolCall[] = toolUseBlocks.map((b) => ({
    id: b.id,
    name: b.name,
    input: b.input,
  }));
  return { text: textBlocks.map((b) => b.text).join("\n"), toolCalls };
}

export const anthropicProvider: LlmProvider = {
  async streamTurn(req, onText) {
    // NOT: forceTool burada bilerek yok sayılır — thinking açıkken tool_choice
    // yalnızca "auto"/"none" olabilir, "tool"/"any" zorlaması 400 döner.
    const stream = getClient().messages.stream({
      model: ANTHROPIC_MODEL,
      max_tokens: req.maxTokens,
      thinking: { type: "adaptive" },
      system: toAnthropicSystem(req.system),
      tools: toAnthropicTools(req.tools),
      messages: toAnthropicMessages(req.messages),
    });
    stream.on("text", (delta) => onText(delta));
    const response = await stream.finalMessage();
    return extractResult(response);
  },

  async createMessage(req) {
    const response = await getClient().messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: req.maxTokens,
      thinking: { type: "adaptive" },
      system: toAnthropicSystem(req.system),
      tools: toAnthropicTools(req.tools),
      // thinking etkinken tool_choice yalnızca "auto"/"none" olabilir; forceTool
      // burada da yok sayılır (bkz. review/route.ts'teki mevcut yorum).
      tool_choice: { type: "auto" },
      messages: toAnthropicMessages(req.messages),
    });
    return extractResult(response);
  },
};
