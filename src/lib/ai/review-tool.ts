import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/**
 * FR-07 — risk/tutarlılık kontrolü. `code` sabit bir enum: her değerin
 * messages/*.json'da dashboard.review.findings.<code> karşılığı var (UI
 * çeviriyor); `detail` sözleşmeye özgü serbest metin, çevrilmez.
 */
export const FINDING_CODES = [
  "party_name_mismatch",
  "date_inconsistency",
  "payment_mismatch",
  "undefined_term",
  "empty_critical_field",
  "conflicting_clause",
  "other",
] as const;

export const REVIEW_TOOL: Anthropic.Tool = {
  name: "report_findings",
  description:
    "Taslaktaki tutarsızlıkları ve riskli noktaları raporlar (FR-07). Bu bir hukuki görüş veya geçerlilik garantisi DEĞİLDİR — yalnızca metindeki tutarsızlıkları işaretler.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            code: { type: "string", enum: [...FINDING_CODES] },
            severity: { type: "string", enum: ["info", "warning", "error"] },
            sectionKey: {
              type: ["string", "null"],
              description: "İlgili bölümün key'i, genel bir bulguysa null.",
            },
            detail: { type: "string", description: "Kısa, somut açıklama." },
          },
          required: ["code", "severity", "sectionKey", "detail"],
          additionalProperties: false,
        },
      },
    },
    required: ["findings"],
    additionalProperties: false,
  },
};

export const reviewFindingsInputSchema = z.object({
  findings: z.array(
    z.object({
      code: z.enum(FINDING_CODES),
      severity: z.enum(["info", "warning", "error"]),
      sectionKey: z.string().nullable(),
      detail: z.string(),
    }),
  ),
});

export function buildReviewSystemPrompt() {
  return `Sen bir sözleşme taslağının tutarlılık kontrolünü yapan bir asistansın. Aşağıdaki türde sorunları ara:
- Taraf isimlerinde tutarsızlık
- Tarih ve süre uyuşmazlıkları
- Ödeme tutarı ve takvimi uyuşmazlıkları
- Tanımsız veya belirsiz terimler
- Boş bırakılmış kritik alanlar
- Birbiriyle çelişen maddeler

Cevabını HER ZAMAN report_findings aracını çağırarak ver — serbest metin yazma, başka bir araç kullanma. Sorun bulamazsan boş bir findings dizisiyle yine bu aracı çağır. Bu bir hukuki görüş veya geçerlilik garantisi değildir — yalnızca metindeki tutarsızlıkları tespit ediyorsun, kesinlik iddia etme.`;
}
