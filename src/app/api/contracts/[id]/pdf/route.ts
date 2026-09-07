import { createClient } from "@/lib/supabase/server";
import { renderContractPdf } from "@/lib/pdf/render";
import { sectionsSchema } from "@/lib/contracts/schema";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 300;

/**
 * POST /api/contracts/[id]/pdf — FR-08. Plan C2: yalnız `ready` durumundaki
 * ("onaylanmış") sürümlerden üretilir; dosya adı sürüme bağlıdır
 * ({workspace_id}/{contract_id}/v{n}.pdf — bkz. migration'daki Storage RLS
 * yorumu, bu iskelet orada da varsayılıyor).
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/contracts/[id]/pdf">) {
  const { id: contractId } = await ctx.params;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, title, status, workspace_id")
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (contract.status !== "ready") {
    return Response.json({ error: "not_ready" }, { status: 400 });
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
    .select("id, version_no, sections")
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
    p_operation: "pdf_generate",
    p_contract_id: contractId,
  });
  if (creditError) {
    const isInsufficient = creditError.message?.includes("insufficient_credits");
    return Response.json({ error: isInsufficient ? "insufficient_credits" : "generic" }, { status: 402 });
  }

  let buffer: Buffer;
  try {
    buffer = await renderContractPdf({
      title: contract.title,
      versionNo: latestVersion.version_no,
      generatedAt: new Date(),
      sections,
    });
  } catch (error) {
    console.error("[contracts/pdf] render:", error);
    return Response.json({ error: "generic" }, { status: 500 });
  }

  const storagePath = `${contract.workspace_id}/${contractId}/v${latestVersion.version_no}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("contracts")
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    console.error("[contracts/pdf] upload:", uploadError.message);
    return Response.json({ error: "generic" }, { status: 500 });
  }

  const { error: docError } = await supabase.from("contract_documents").upsert(
    {
      contract_id: contractId,
      version_id: latestVersion.id,
      storage_path: storagePath,
      created_by: userId,
    },
    { onConflict: "version_id" },
  );
  if (docError) {
    console.error("[contracts/pdf] document row:", docError.message);
    return Response.json({ error: "generic" }, { status: 500 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("contracts")
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (signError || !signed) {
    return Response.json({ error: "generic" }, { status: 500 });
  }

  return Response.json({ url: signed.signedUrl, path: storagePath });
}
