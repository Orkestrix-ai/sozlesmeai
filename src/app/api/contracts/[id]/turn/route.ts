import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getLlmProvider } from "@/lib/ai/provider";
import type { LlmMessage, LlmToolCall, LlmToolResult } from "@/lib/ai/provider";
import { CONTRACT_TOOLS } from "@/lib/ai/contract-tools";
import { buildDynamicStateBlock, buildSystemPrompt } from "@/lib/ai/prompts";
import {
  askMissingInfoInputSchema,
  proposeContractTypeInputSchema,
  upsertSectionsInputSchema,
} from "@/lib/ai/tool-schemas";
import { sectionsSchema, upsertSections, type ContractSections } from "@/lib/contracts/schema";
import { routing } from "@/i18n/routing";
import { uuidSchema, createContractVersionResultSchema } from "@/lib/db/schemas";
import { dbRpc, dbResultToResponse, withApiErrors } from "@/lib/db/safe";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_ITERATIONS = 4;

const turnRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  locale: z.enum(routing.locales).default(routing.defaultLocale),
});

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
 *
 * Güvenlik sertleştirmesi: kredi düşümü + sürüm yazımı artık TEK
 * `create_contract_version` RPC'sinde (B6 — telafisiz kredi kaybı kapatıldı,
 * B5 — idempotency anahtarı ile çift harcama önlendi). LLM çağrısından
 * ÖNCE bir `can_afford` ön kapısı var (B7 — bakiyesi sıfır bir workspace
 * artık ücretsiz LLM token'ı yakamaz).
 */
export const POST = withApiErrors("contracts/turn", async function POST(
  request: Request,
  ctx: RouteContext<"/api/contracts/[id]/turn">,
) {
  const { id: rawContractId } = await ctx.params;
  const parsedId = uuidSchema.safeParse(rawContractId);
  if (!parsedId.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const contractId = parsedId.data;

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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsedBody = turnRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return Response.json({ error: "invalid_message" }, { status: 400 });
  }
  const { message, locale } = parsedBody.data;

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

  // Ön uçuş kredi kapısı — LLM çağrılmadan ÖNCE.
  //
  // DİKKAT, kontrol edilen işlem bu turun işlemi DEĞİL: taslak üretimi ve
  // düzenleme 0 kredi (ücret PDF'te düşüyor, 20260910120000_pay_as_you_go.sql),
  // dolayısıyla `draft_generate`/`ai_edit` sorulsaydı kapı her zaman açık
  // olurdu ve sıfır bakiyeli bir hesap sınırsız Anthropic/Groq token'ı
  // yakabilirdi. Kapı "bu tur kaça mal olur"u değil, "kullanıcı sonunda
  // çıktının parasını ödeyebilir mi"yi sorar.
  const affordResult = await dbRpc(
    "contracts/turn:can_afford",
    () => supabase.rpc("can_afford", { p_workspace_id: contract.workspace_id, p_operation: "pdf_generate" }),
    z.boolean(),
  );
  if (!affordResult.ok) return dbResultToResponse(affordResult);
  if (!affordResult.data) {
    return Response.json({ error: "insufficient_credits" }, { status: 402 });
  }

  const { error: insertUserMessageError } = await supabase
    .from("contract_messages")
    .insert({ contract_id: contractId, role: "user", content: message });
  if (insertUserMessageError) {
    return Response.json({ error: "generic" }, { status: 500 });
  }

  const messages: LlmMessage[] = (history ?? []).map((m) =>
    m.role === "user"
      ? { role: "user" as const, content: m.content }
      : { role: "assistant" as const, text: m.content, toolCalls: [] },
  );
  // Bu POST çağrısının kendi mantıksal kimliği — istemci ileride
  // X-Idempotency-Key göndermeye başlarsa aynı retry aynı anahtarı taşır;
  // göndermiyorsa (bugünkü durum) burada üretilir ve YALNIZCA bu çağrı
  // için geçerlidir (gerçek ağ-seviyesi retry koruması istemci desteği
  // gerektirir — bkz. plan notu).
  const idemBase = request.headers.get("x-idempotency-key")?.slice(0, 128) || crypto.randomUUID();

  const provider = getLlmProvider();

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
          const system = [
            { text: buildSystemPrompt(locale), cacheable: true },
            { text: buildDynamicStateBlock({ contractType: currentContractType, sections: sectionsState }) },
          ];

          const { text, toolCalls } = await provider.streamTurn(
            { system, tools: CONTRACT_TOOLS, messages, maxTokens: 64000 },
            (delta) => emit({ type: "text", text: delta }),
          );

          messages.push({ role: "assistant", text, toolCalls });

          if (text) finalText = text;

          if (toolCalls.length === 0) break;

          const toolResults: LlmToolResult[] = [];

          // Anahtar tool call BAŞINA benzersiz olmak zorunda: tek bir tur iki
          // upsert_sections çağırırsa, aynı anahtarla giden ikinci çağrıda
          // consume_credits mükerrer sayıp erken döner (credit_integrity.sql:86)
          // ama create_contract_version sürümü yine de yazar — sürüm var, defter
          // satırı yok. Sağlayıcının tool call id'si bir retry'da aynı gelmediği
          // için indeks kullanılıyor; kapatılması gereken çakışma tek istek içi.
          for (const [toolIndex, toolCall] of toolCalls.entries()) {
            const result = await executeTool({
              toolCall,
              supabase,
              contractId,
              currentSections: sectionsState,
              latestVersionNo,
              idempotencyKey: `${idemBase}:${iteration}:${toolIndex}`,
            });

            emit({ type: "tool", name: toolCall.name, input: toolCall.input });

            if (result.updatedSections) {
              sectionsState = result.updatedSections;
              latestVersionNo += 1;
              emit({ type: "sections", sections: sectionsState });
            }
            if (result.contractType) currentContractType = result.contractType;
            if (result.narrative) narrativeParts.push(result.narrative);

            toolResults.push({ id: toolCall.id, content: result.output, isError: result.isError });
          }

          messages.push({ role: "tool_results", results: toolResults });
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
});

async function executeTool(params: {
  toolCall: LlmToolCall;
  supabase: Awaited<ReturnType<typeof createClient>>;
  contractId: string;
  currentSections: ContractSections;
  latestVersionNo: number;
  idempotencyKey: string;
}): Promise<{
  output: string;
  isError?: boolean;
  updatedSections?: ContractSections;
  contractType?: string;
  narrative?: string;
}> {
  const { toolCall, supabase, contractId, currentSections, latestVersionNo, idempotencyKey } = params;

  switch (toolCall.name) {
    case "propose_contract_type": {
      const parsed = proposeContractTypeInputSchema.safeParse(toolCall.input);
      if (!parsed.success) return { output: "invalid_input", isError: true };

      const { error } = await supabase
        .from("contracts")
        .update({ contract_type: parsed.data.code })
        .eq("id", contractId);
      if (error) {
        console.error("[contracts/turn] propose_contract_type:", error.message);
        return { output: "db_error", isError: true };
      }

      return { output: "ok", contractType: parsed.data.code };
    }

    case "ask_missing_info": {
      const parsed = askMissingInfoInputSchema.safeParse(toolCall.input);
      if (!parsed.success) return { output: "invalid_input", isError: true };

      const narrative = parsed.data.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
      return { output: "ok", narrative };
    }

    case "upsert_sections": {
      const parsed = upsertSectionsInputSchema.safeParse(toolCall.input);
      if (!parsed.success) return { output: "invalid_input", isError: true };

      // Birleştirilmiş TAM diziyi create_contract_version'a göndeririz,
      // kısmi diziyi değil — RPC her sürümü sıfırdan yazar.
      const merged = upsertSections(currentSections, parsed.data.sections, "ai");

      // Kredi düşümü + sürüm yazımı AYNI transaction'da (B6): biri olmadan
      // diğeri olmaz. version_no de RPC içinde kilitli hesaplanır (B5/yarış).
      // İlk sürüm "ai_draft" (draft_generate maliyeti), sonrakiler "ai_edit"
      // (bugüne kadarki davranışla birebir aynı ayrım).
      const source = latestVersionNo === 0 ? "ai_draft" : "ai_edit";
      const result = await dbRpc(
        "contracts/turn:upsert_sections",
        () =>
          supabase.rpc("create_contract_version", {
            p_contract_id: contractId,
            p_sections: merged,
            p_source: source,
            p_idempotency_key: idempotencyKey,
          }),
        createContractVersionResultSchema,
      );

      if (!result.ok) {
        // İki etiket BİLEREK ayrı tutuluyor: sistem prompt'u (src/lib/ai/prompts.ts)
        // tam olarak bu ikisine göre yazılı. Tek bir "db_error" etiketi
        // verildiğinde model elindeki TEK hata senaryosunu (kredi) uydurup
        // kullanıcıya "paketinizi yükseltin" diyordu — oysa gerçek hata 42702
        // (create_contract_version'daki isim çakışması) idi ve bakiye yerindeydi
        // (2026-09-11). Ham hata + reference kodu dbRpc tarafından zaten sunucu
        // loguna yazılıyor; modele giden etiket yalnızca "ne söylenmeli"yi seçer.
        return {
          output: result.code === "insufficient_credits" ? "insufficient_credits" : "save_failed",
          isError: true,
        };
      }

      return { output: "ok", updatedSections: merged };
    }

    default:
      return { output: `unknown_tool: ${toolCall.name}`, isError: true };
  }
}
