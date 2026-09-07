import { createClient } from "@/lib/supabase/server";
import { anthropic, CONTRACT_MODEL } from "@/lib/ai/client";
import { REVIEW_TOOL, buildReviewSystemPrompt, reviewFindingsInputSchema } from "@/lib/ai/review-tool";
import { sectionsSchema } from "@/lib/contracts/schema";

export const dynamic = "force-dynamic";

/**
 * POST /api/contracts/[id]/review — FR-07 risk/tutarlılık kontrolü.
 * Akış GEREKTİRMEZ (plan B3): tek, sınırlı büyüklükte bir tool çağrısı.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/contracts/[id]/review">) {
  const { id: contractId } = await ctx.params;
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

  const { error: creditError } = await supabase.rpc("consume_credits", {
    p_workspace_id: contract.workspace_id,
    p_operation: "risk_check",
    p_contract_id: contractId,
  });
  if (creditError) {
    const isInsufficient = creditError.message?.includes("insufficient_credits");
    return Response.json({ error: isInsufficient ? "insufficient_credits" : "generic" }, { status: 402 });
  }

  let findings: { code: string; severity: string; sectionKey: string | null; detail: string }[] = [];
  try {
    const response = await anthropic.messages.create({
      model: CONTRACT_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: buildReviewSystemPrompt(),
      tools: [REVIEW_TOOL],
      tool_choice: { type: "tool", name: "report_findings" },
      messages: [
        {
          role: "user",
          content: `Sözleşme bölümleri (JSON):\n${JSON.stringify(sections, null, 2)}`,
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return Response.json({ error: "generic" }, { status: 500 });
    }
    const parsed = reviewFindingsInputSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      return Response.json({ error: "generic" }, { status: 500 });
    }
    findings = parsed.data.findings;
  } catch (error) {
    console.error("[contracts/review]", error);
    return Response.json({ error: "generic" }, { status: 500 });
  }

  // Önceki bulgular temizlenir — yeniden kontrol her zaman GÜNCEL durumu yansıtır.
  await supabase.from("contract_findings").delete().eq("contract_id", contractId);

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
      return Response.json({ error: "generic" }, { status: 500 });
    }
  }

  await supabase.from("contracts").update({ status: "review" }).eq("id", contractId);

  return Response.json({ findings });
}
