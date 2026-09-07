import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

/**
 * strict:true + additionalProperties:false + required — claude-api skill'in
 * "yapılandırılmış çıktı" kuralı. Şema src/lib/contracts/schema.ts'teki zod
 * tanımıyla ELLE senkron tutulur (strict tool şemaları zod'dan otomatik
 * türetilmiyor); sunucu tarafında tool sonucu yine de sectionSchema'dan
 * geçirilir (bkz. app/api/contracts/[id]/turn/route.ts).
 */
const sectionInputSchema = {
  type: "object",
  properties: {
    key: {
      type: "string",
      description: "Kısa, makine-okunur bölüm anahtarı (ör. 'payment'). Var olan bir anahtarla aynıysa o bölüm GÜNCELLENİR.",
    },
    title: { type: "string", description: "Bölümün görünen başlığı." },
    body: { type: "string", description: "Bölümün tam metni." },
    status: { type: "string", enum: ["draft", "approved"] },
    missing: {
      type: "array",
      items: { type: "string" },
      description: "Bu bölümde eksik veya belirsiz kalan bilgilerin kısa açıklamaları. Bilinmeyen bilgi UYDURULMAZ, buraya yazılır.",
    },
  },
  required: ["key", "title", "body", "status", "missing"],
  additionalProperties: false,
} as const;

export const CONTRACT_TOOLS: Anthropic.Tool[] = [
  {
    name: "propose_contract_type",
    description:
      "Kullanıcının anlattığı ihtiyaca göre uygun sözleşme türünü önerir (FR-03). Kullanıcı onaylayana veya değiştirene kadar tür kesinleşmiş sayılmaz.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        code: { type: "string", enum: ["service", "nda", "freelance"] },
        reason: { type: "string", description: "Bu türün neden uygun olduğuna dair tek cümlelik gerekçe." },
      },
      required: ["code", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "ask_missing_info",
    description:
      "Taslak için eksik olan bilgileri kullanıcıya kısa ve sıralı sorular halinde sorar (FR-02). Aynı bilgiyi tekrar sorma — sohbet geçmişinde zaten cevaplanmışsa bu aracı kullanma.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 4,
          description: "En fazla 4 kısa soru.",
        },
      },
      required: ["questions"],
      additionalProperties: false,
    },
  },
  {
    name: "upsert_sections",
    description:
      "Sözleşme taslağının bir veya daha fazla bölümünü yazar/günceller (FR-04, FR-05). Yeni bir taslak oluştururken TÜM bölümleri; bir düzenleme isteğinde YALNIZCA değişen bölümleri gönder.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        sections: { type: "array", items: sectionInputSchema, minItems: 1 },
      },
      required: ["sections"],
      additionalProperties: false,
    },
  },
];
