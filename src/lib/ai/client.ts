import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Tekil istemci — ANTHROPIC_API_KEY ortam değişkeninden otomatik okunur.
 * claude-api skill'i: model her zaman `claude-opus-5`, adaptive thinking.
 */
export const anthropic = new Anthropic();

export const CONTRACT_MODEL = "claude-opus-5";
