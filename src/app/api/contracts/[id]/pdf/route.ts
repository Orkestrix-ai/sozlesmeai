import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { renderContractPdf } from "@/lib/pdf/render";
import { sectionsSchema } from "@/lib/contracts/schema";
import { uuidSchema, consumeCreditsResultSchema } from "@/lib/db/schemas";
import { dbRpc, dbResultToResponse, withApiErrors } from "@/lib/db/safe";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 300;

/**
 * POST /api/contracts/[id]/pdf — FR-08. Plan C2: yalnız `ready` durumundaki
 * ("onaylanmış") sürümlerden üretilir; dosya adı sürüme bağlıdır
 * ({workspace_id}/{contract_id}/v{n}.pdf).
 *
 * Güvenlik sertleştirmesi: `storage_path` artık İSTEMCİDEN gönderilmiyor —
 * `contract_documents_normalize_path` tetikleyicisi contract_id + version_no
 * üzerinden sunucuda yeniden hesaplıyor (B1 — çapraz-kiracı dosya sızıntısı
 * zincirinin kökü kapatıldı). Kredi, render+upload BAŞARILI olduktan SONRA
 * düşülür (B6 — render/upload patlarsa kredi hiç yanmaz); idempotency
 * anahtarı çift harcamayı önler (B5).
 */
export const POST = withApiErrors("contracts/pdf", async function POST(
  _request: Request,
  ctx: RouteContext<"/api/contracts/[id]/pdf">,
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

  const affordResult = await dbRpc(
    "contracts/pdf:can_afford",
    () => supabase.rpc("can_afford", { p_workspace_id: contract.workspace_id, p_operation: "pdf_generate" }),
    z.boolean(),
  );
  if (!affordResult.ok) return dbResultToResponse(affordResult);
  if (!affordResult.data) {
    return Response.json({ error: "insufficient_credits" }, { status: 402 });
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

  // storage_path İSTEMCİDEN gelmiyor — tetikleyici contract_id + version_no
  // üzerinden sunucuda üretiyor (contract_documents_normalize_path, B1).
  // Upload yolu yalnızca o üretimin AYNISI olmak zorunda; burada iskeleti
  // yalnızca upload HEDEFİ için tekrar hesaplıyoruz, DB satırı için değil.
  const storagePath = `${contract.workspace_id}/${contractId}/v${latestVersion.version_no}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("contracts")
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    console.error("[contracts/pdf] upload:", uploadError.message);
    return Response.json({ error: "generic" }, { status: 500 });
  }

  // Render + upload BAŞARILI oldu — kredi burada düşülür.
  const idempotencyKey = crypto.randomUUID();
  const consumeResult = await dbRpc(
    "contracts/pdf:consume_credits",
    () =>
      supabase.rpc("consume_credits", {
        p_workspace_id: contract.workspace_id,
        p_operation: "pdf_generate",
        p_contract_id: contractId,
        p_idempotency_key: idempotencyKey,
      }),
    consumeCreditsResultSchema,
  );
  if (!consumeResult.ok) return dbResultToResponse(consumeResult);

  const { error: docError } = await supabase.from("contract_documents").upsert(
    {
      contract_id: contractId,
      version_id: latestVersion.id,
      // storage_path YİNE DE bir değer istiyor (kolon NOT NULL) — tetikleyici
      // BEFORE INSERT/UPDATE'te bunu üzerine yazıyor, burada gönderilen değer
      // asla DB'ye ulaşmıyor. Aynı iskelet olsun diye yine de doğru hesaplanmış
      // hali gönderiliyor (okunabilirlik; güvenlik burada YOK, tetikleyicide).
      storage_path: storagePath,
      created_by: userId,
    },
    { onConflict: "version_id" },
  );
  if (docError) {
    console.error("[contracts/pdf] document row:", docError.message);
    await supabase.rpc("refund_credits", {
      p_workspace_id: contract.workspace_id,
      p_idempotency_key: idempotencyKey,
      p_reason: "document_row_failed",
    });
    return Response.json({ error: "generic" }, { status: 500 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("contracts")
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (signError || !signed) {
    return Response.json({ error: "generic" }, { status: 500 });
  }

  return Response.json({ url: signed.signedUrl, path: storagePath });
});
