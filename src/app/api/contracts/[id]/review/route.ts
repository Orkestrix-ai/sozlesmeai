import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getLlmProvider } from "@/lib/ai/provider";
import { REVIEW_TOOL, buildReviewSystemPrompt, reviewFindingsInputSchema } from "@/lib/ai/review-tool";
import { sectionsSchema } from "@/lib/contracts/schema";
import { uuidSchema, consumeCreditsResultSchema } from "@/lib/db/schemas";
import { dbRpc, dbResultToResponse, withApiErrors } from "@/lib/db/safe";

export const dynamic = "force-dynamic";

/**
 * POST /api/contracts/[id]/review — FR-07 risk/tutarlılık kontrolü.
 * Akış GEREKTİRMEZ (plan B3): tek, sınırlı büyüklükte bir tool çağrısı.
 *
 * Güvenlik sertleştirmesi: kredi artık LLM çağrısından ÖNCE değil, LLM
 * BAŞARIYLA sonuçlandıktan SONRA düşülür (B7'nin bu rotadaki karşılığı —
 * başarısız bir LLM çağrısı için kredi harcanmaz). `contract_findings`
 * yazımı kredi düşümünden SONRAKİ adımda başarısız olursa `refund_credits`
 * ile telafi edilir (B6). `can_afford` ile ucuz bir ön kapı, gerçek düşüm
 * hâlâ `consume_credits`'te — idempotency anahtarı çift harcamayı önler (B5).
 */
export const POST = withApiErrors("contracts/review", async function POST(
  _request: Request,
  ctx: RouteContext<"/api/contracts/[id]/review">,
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

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, workspace_id")
    .eq("id", contractId)
    .maybeSingle();
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

  const { data: latestVersion } = await supabase
    .from("contract_versions")
    .select("id, sections")
    .eq("contract_id", contractId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sections = latestVersion ? (sectionsSchema.safeParse(latestVersion.sections).data ?? []) : [];
  if (!latestVersion || sections.length === 0) {
    return Response.json({ error: "no_draft" }, { status: 400 });
  }

  const affordResult = await dbRpc(
    "contracts/review:can_afford",
    () => supabase.rpc("can_afford", { p_workspace_id: contract.workspace_id, p_operation: "risk_check" }),
    z.boolean(),
  );
  if (!affordResult.ok) return dbResultToResponse(affordResult);
  if (!affordResult.data) {
    return Response.json({ error: "insufficient_credits" }, { status: 402 });
  }

  let findings: { code: string; severity: string; sectionKey: string | null; detail: string }[] = [];
  try {
    // NOT: Anthropic tarafında thinking etkinken tool_choice yalnızca
    // "auto"/"none" olabilir — "tool"/"any" zorlaması 400 döner (bkz.
    // provider/anthropic.ts). forceTool bu yüzden Anthropic'te yok sayılır;
    // aracı çağırmama ihtimaline karşı sistem promptu zorunlu kılar ve
    // aşağıdaki toolCalls kontrolü zaten eksik çağrıyı generic hataya çevirir.
    // Groq'ta forceTool gerçekten uygulanır (tool_choice: {type:"function"}).
    const result = await getLlmProvider().createMessage({
      system: [{ text: buildReviewSystemPrompt() }],
      tools: [REVIEW_TOOL],
      forceTool: REVIEW_TOOL.name,
      maxTokens: 16000,
      messages: [
        { role: "user", content: `Sözleşme bölümleri (JSON):\n${JSON.stringify(sections, null, 2)}` },
      ],
    });

    const toolCall = result.toolCalls[0];
    if (!toolCall) {
      return Response.json({ error: "generic" }, { status: 500 });
    }
    const parsed = reviewFindingsInputSchema.safeParse(toolCall.input);
    if (!parsed.success) {
      return Response.json({ error: "generic" }, { status: 500 });
    }
    findings = parsed.data.findings;
  } catch (error) {
    console.error("[contracts/review]", error);
    return Response.json({ error: "generic" }, { status: 500 });
  }

  // LLM BAŞARILI oldu — kredi burada düşülür. idempotencyKey bu isteğe
  // özgü; bir sonraki adım (bulgu yazımı) başarısız olursa aynı anahtarla
  // refund_credits çağrılır.
  const idempotencyKey = crypto.randomUUID();
  const consumeResult = await dbRpc(
    "contracts/review:consume_credits",
    () =>
      supabase.rpc("consume_credits", {
        p_workspace_id: contract.workspace_id,
        p_operation: "risk_check",
        p_contract_id: contractId,
        p_idempotency_key: idempotencyKey,
      }),
    consumeCreditsResultSchema,
  );
  if (!consumeResult.ok) return dbResultToResponse(consumeResult);

  // Önceki bulgular temizlenir — yeniden kontrol her zaman GÜNCEL durumu yansıtır.
  const { error: deleteError } = await supabase.from("contract_findings").delete().eq("contract_id", contractId);
  if (deleteError) {
    await supabase.rpc("refund_credits", {
      p_workspace_id: contract.workspace_id,
      p_idempotency_key: idempotencyKey,
      p_reason: "findings_delete_failed",
    });
    return Response.json({ error: "generic" }, { status: 500 });
  }

  if (findings.length > 0) {
    const { error: insertError } = await supabase.from("contract_findings").insert(
      findings.map((f) => ({
        contract_id: contractId,
        version_id: latestVersion.id,
        code: f.code,
        severity: f.severity as "info" | "warning" | "error",
        section_key: f.sectionKey,
        detail: f.detail,
      })),
    );
    if (insertError) {
      // Kredi düşüldü ama bulgular yazılamadı — telafi et (B6). `status`
      // bilerek "review"a çevrilmez: kullanıcı hiçbir güncel bulgu görmez.
      await supabase.rpc("refund_credits", {
        p_workspace_id: contract.workspace_id,
        p_idempotency_key: idempotencyKey,
        p_reason: "findings_insert_failed",
      });
      return Response.json({ error: "generic" }, { status: 500 });
    }
  }

  await supabase.from("contracts").update({ status: "review" }).eq("id", contractId);

  return Response.json({ findings });
});
