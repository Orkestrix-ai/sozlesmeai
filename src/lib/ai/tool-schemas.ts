import "server-only";

import { z } from "zod";

import { sectionToolInputSchema } from "@/lib/contracts/schema";

/**
 * contract-tools.ts'teki JSON şemalarının zod karşılığı. `strict: true`
 * Anthropic tarafında şekli garanti eder ama DB'ye yazmadan önce yine de
 * burada doğrulanır (savunma derinliği + tip güvenliği).
 */
export const proposeContractTypeInputSchema = z.object({
  code: z.enum(["service", "nda", "freelance"]),
  reason: z.string(),
});

export const askMissingInfoInputSchema = z.object({
  questions: z.array(z.string()).min(1).max(4),
});

export const upsertSectionsInputSchema = z.object({
  sections: z.array(sectionToolInputSchema).min(1),
});
