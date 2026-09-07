import type Anthropic from "@anthropic-ai/sdk";

import { createClient } from "@/lib/supabase/server";
import { anthropic, CONTRACT_MODEL } from "@/lib/ai/client";
import { CONTRACT_TOOLS } from "@/lib/ai/contract-tools";
import { buildDynamicStateBlock, buildSystemPrompt } from "@/lib/ai/prompts";
import {
  askMissingInfoInputSchema,
  proposeContractTypeInputSchema,
  upsertSectionsInputSchema,
} from "@/lib/ai/tool-schemas";
import { sectionsSchema, upsertSections, type ContractSections } from "@/lib/contracts/schema";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_ITERATIONS = 4;

type TurnEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: unknown }
  | { type: "sections"; sections: ContractSections }
  | { type: "error"; message: string }
  | { type: "done" };

/**
 * POST /api/contracts/[id]/turn — sohbetin bir turu. Yetki BURADA yeniden
 * doğrulanır (design.md/plan: proxy iyimser kapı, gerçek kontrol veriye
 * komşu yerde). dal.ts'teki verifySession() KULLANILMAZ — o redirect() atar,
 * bir Route Handler içinde anlamsızdır.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/contracts/[id]/turn">) {
  const { id: contractId } = await ctx.params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("id, workspace_id, contract_type, status")
    .eq("id", contractId)
    .maybeSingle();

  if (contractError) {
    return Response.json({ error: "generic" }, { status: 500 });
  }
  if (!contract) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", contract.workspace_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || !["admin", "editor"].includes(membership.role)) {
    return Response.json({ error: "unauthorized" }, { status: 403 });
  }

  let body: { message?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const locale: AppLocale = body.locale === "en" ? "en" : "tr";
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: "invalid_message" }, { status: 400 });
  }

  const { error: insertUserMessageError } = await supabase
    .from("contract_messages")
    .insert({ contract_id: contractId, role: "user", content: message });
  if (insertUserMessageError) {
    return Response.json({ error: "generic" }, { status: 500 });
  }

  const { data: history } = await supabase
    .from("contract_messages")
    .select("role, content")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });

  const { data: latestVersion } = await supabase
    .from("contract_versions")
    .select("id, version_no, sections")
    .eq("contract_id", contractId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentSections: ContractSections = latestVersion
    ? (sectionsSchema.safeParse(latestVersion.sections).data ?? [])
    : [];
  let currentContractType = contract.contract_type;
  let latestVersionNo = latestVersion?.version_no ?? 0;

  const messages: Anthropic.MessageParam[] = (history ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: TurnEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        let sectionsState = currentSections;
        let finalText = "";
        const narrativeParts: string[] = [];

        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const system: Anthropic.TextBlockParam[] = [
            { type: "text", text: buildSystemPrompt(locale), cache_control: { type: "ephemeral" } },
            {
              type: "text",
              text: buildDynamicStateBlock({ contractType: currentContractType, sections: sectionsState }),
            },
          ];

          const apiStream = anthropic.messages.stream({
            model: CONTRACT_MODEL,
            max_tokens: 64000,
            thinking: { type: "adaptive" },
            system,
            tools: CONTRACT_TOOLS,
            messages,
          });

          apiStream.on("text", (delta) => emit({ type: "text", text: delta }));

          const response = await apiStream.finalMessage();
          messages.push({ role: "assistant", content: response.content });

          const toolUses = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
          );

          const textBlocks = response.content.filter(
            (block): block is Anthropic.TextBlock => block.type === "text",
          );
          if (textBlocks.length > 0) {
            finalText = textBlocks.map((b) => b.text).join("\n");
          }

          if (toolUses.length === 0) break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            const result = await executeTool({
              toolUse,
              supabase,
              contractId,
              workspaceId: contract.workspace_id,
              userId,
              currentSections: sectionsState,
              latestVersionNo,
            });

            emit({ type: "tool", name: toolUse.name, input: toolUse.input });

            if (result.updatedSections) {
              sectionsState = result.updatedSections;
              latestVersionNo += 1;
              emit({ type: "sections", sections: sectionsState });
            }
            if (result.contractType) currentContractType = result.contractType;
            if (result.narrative) narrativeParts.push(result.narrative);

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: result.output,
              is_error: result.isError,
            });
          }

          messages.push({ role: "user", content: toolResults });
        }

        const persistedText = [finalText, ...narrativeParts].filter(Boolean).join("\n\n") ||
          (locale === "en" ? "Done." : "Tamamlandı.");

        await supabase
          .from("contract_messages")
          .insert({ contract_id: contractId, role: "assistant", content: persistedText });

        emit({ type: "done" });
      } catch (error) {
        console.error("[contracts/turn]", error);
        emit({ type: "error", message: "generic" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}

async function executeTool(params: {
  toolUse: Anthropic.ToolUseBlock;
  supabase: Awaited<ReturnType<typeof createClient>>;
  contractId: string;
  workspaceId: string;
  userId: string;
  currentSections: ContractSections;
  latestVersionNo: number;
}): Promise<{
  output: string;
  isError?: boolean;
  updatedSections?: ContractSections;
  contractType?: string;
  narrative?: string;
}> {
  const { toolUse, supabase, contractId, workspaceId, userId, currentSections, latestVersionNo } = params;

  switch (toolUse.name) {
    case "propose_contract_type": {
      const parsed = proposeContractTypeInputSchema.safeParse(toolUse.input);
      if (!parsed.success) return { output: "invalid_input", isError: true };

      const { error } = await supabase
        .from("contracts")
        .update({ contract_type: parsed.data.code })
        .eq("id", contractId);
      if (error) return { output: error.message, isError: true };

      return { output: "ok", contractType: parsed.data.code };
    }

    case "ask_missing_info": {
      const parsed = askMissingInfoInputSchema.safeParse(toolUse.input);
      if (!parsed.success) return { output: "invalid_input", isError: true };

      const narrative = parsed.data.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
      return { output: "ok", narrative };
    }

    case "upsert_sections": {
      const parsed = upsertSectionsInputSchema.safeParse(toolUse.input);
      if (!parsed.success) return { output: "invalid_input", isError: true };

      const merged = upsertSections(currentSections, parsed.data.sections, "ai");
      const versionNo = latestVersionNo + 1;
      const source = latestVersionNo === 0 ? "ai_draft" : "ai_edit";

      // Faz 4 kredi muhasebesi: yalnızca İLK taslak (draft_generate) kredi
      // düşer — ai_edit yer tutucu olarak 0 (bkz. operation_costs migration'ı).
      const { error: creditError } = await supabase.rpc("consume_credits", {
        p_workspace_id: workspaceId,
        p_operation: source === "ai_draft" ? "draft_generate" : "ai_edit",
        p_contract_id: contractId,
      });
      if (creditError) {
        const isInsufficient = creditError.message?.includes("insufficient_credits");
        return { output: isInsufficient ? "insufficient_credits" : creditError.message, isError: true };
      }

      const { data: version, error: versionError } = await supabase
        .from("contract_versions")
        .insert({ contract_id: contractId, version_no: versionNo, sections: merged, source, created_by: userId })
        .select("id")
        .maybeSingle();
      if (versionError) return { output: versionError.message, isError: true };

      if (version) {
        await supabase.from("contracts").update({ current_version_id: version.id }).eq("id", contractId);
      }

      return { output: "ok", updatedSections: merged };
    }

    default:
      return { output: `unknown_tool: ${toolUse.name}`, isError: true };
  }
}
