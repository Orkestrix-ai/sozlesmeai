import "server-only";

import Groq from "groq-sdk";
import type { ChatCompletionChunk, ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

import type { LlmMessage, LlmProvider, LlmRequest, LlmToolCall } from "./types";

/**
 * Groq'ta mevcut en güçlü genel amaçlı model: 131k bağlam, 65.536 çıktı
 * token'ı (turn route'un max_tokens:64000'i sığar). Bu oturumda araç
 * çağırma, strict şema, akış ve Türkçe kalitesi bu modele karşı doğrulandı.
 */
export const GROQ_MODEL = "openai/gpt-oss-120b";

let client: Groq | undefined;
function getClient(): Groq {
  if (!client) client = new Groq();
  return client;
}

function toGroqMessages(system: LlmRequest["system"], messages: LlmMessage[]): ChatCompletionMessageParam[] {
  // Groq'ta prompt cache yok — cache_control ayrımı anlamsız, tüm system
  // blokları tek bir system mesajında birleştirilir.
  const systemText = system.map((s) => s.text).join("\n\n");
  const out: ChatCompletionMessageParam[] = [{ role: "system", content: systemText }];

  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content });
    } else if (m.role === "assistant") {
      out.push({
        role: "assistant",
        content: m.text || null,
        ...(m.toolCalls.length > 0
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: JSON.stringify(tc.input) },
              })),
            }
          : {}),
      });
    } else {
      // tool_results — Anthropic'in aksine, açılmış her tool_call id'si için
      // AYRI bir {role:"tool"} mesajı gerekir; aksi halde 400 döner.
      for (const r of m.results) {
        out.push({
          role: "tool",
          tool_call_id: r.id,
          content: r.isError ? `ERROR: ${r.content}` : r.content,
        });
      }
    }
  }
  return out;
}

function toGroqTools(tools: LlmRequest["tools"]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema as Record<string, unknown>,
      strict: true,
    },
  }));
}

function toGroqToolChoice(forceTool: string | undefined) {
  if (!forceTool) return "auto" as const;
  return { type: "function" as const, function: { name: forceTool } };
}

/** Parça parça gelen tool_calls delta'larını index'e göre biriktirir. */
class ToolCallAccumulator {
  private byIndex = new Map<number, { id: string; name: string; args: string }>();

  push(deltas: ChatCompletionChunk.Choice.Delta.ToolCall[] | undefined) {
    if (!deltas) return;
    for (const d of deltas) {
      const entry = this.byIndex.get(d.index) ?? { id: "", name: "", args: "" };
      if (d.id) entry.id = d.id;
      if (d.function?.name) entry.name = d.function.name;
      if (d.function?.arguments) entry.args += d.function.arguments;
      this.byIndex.set(d.index, entry);
    }
  }

  finalize(): LlmToolCall[] {
    return [...this.byIndex.entries()]
      .sort(([a], [b]) => a - b) // modelin ürettiği sırayı korur (Groq'un stream index'i)
      .map(([, e]) => ({ id: e.id, name: e.name, input: safeParseJson(e.args) }));
  }
}

function safeParseJson(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const groqProvider: LlmProvider = {
  async streamTurn(req, onText) {
    const stream = await getClient().chat.completions.create({
      model: GROQ_MODEL,
      max_completion_tokens: req.maxTokens,
      reasoning_effort: "medium",
      tool_choice: toGroqToolChoice(req.forceTool),
      tools: toGroqTools(req.tools),
      messages: toGroqMessages(req.system, req.messages),
      stream: true,
    });

    const acc = new ToolCallAccumulator();
    let text = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      // delta.reasoning bilerek yok sayılır — düşünce zinciri kullanıcıya
      // gösterilmez ve DB'ye yazılmaz.
      if (delta.content) {
        text += delta.content;
        onText(delta.content);
      }
      acc.push(delta.tool_calls);
    }

    return { text, toolCalls: acc.finalize() };
  },

  async createMessage(req) {
    const response = await getClient().chat.completions.create({
      model: GROQ_MODEL,
      max_completion_tokens: req.maxTokens,
      reasoning_effort: "medium",
      tool_choice: toGroqToolChoice(req.forceTool),
      tools: toGroqTools(req.tools),
      messages: toGroqMessages(req.system, req.messages),
    });

    const message = response.choices[0]?.message;
    const toolCalls: LlmToolCall[] = (message?.tool_calls ?? []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      input: safeParseJson(tc.function.arguments),
    }));
    return { text: message?.content ?? "", toolCalls };
  },
};
