import { z } from "zod";

/**
 * contract_versions.sections jsonb'sinin TEK kaynağı. Hem AI tool
 * sonuçlarını hem elle düzenleme formundan gelen veriyi bu şemadan geçirin —
 * DB'ye asla doğrulanmamış jsonb yazılmaz.
 *
 * `missing` FR-04'ün "eksik ve belirsiz alanlar açıkça işaretlenir" kuralıdır:
 * AI bilmediği bir bilgiyi UYDURMAZ, o alanın adını buraya ekler.
 */
export const sectionSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  status: z.enum(["draft", "approved"]),
  missing: z.array(z.string()),
  lastEditedBy: z.enum(["ai", "user"]),
});

export type ContractSection = z.infer<typeof sectionSchema>;

export const sectionsSchema = z.array(sectionSchema);

export type ContractSections = z.infer<typeof sectionsSchema>;

/** upsert_sections tool girdisi — lastEditedBy'siz, sunucu ekler (her zaman "ai"). */
export const sectionToolInputSchema = sectionSchema.omit({ lastEditedBy: true });
export type SectionToolInput = z.infer<typeof sectionToolInputSchema>;

/** Var olan bir bölümü anahtarına göre değiştirir, yoksa sona ekler. */
export function upsertSections(
  current: ContractSections,
  incoming: Omit<ContractSection, "lastEditedBy">[],
  lastEditedBy: ContractSection["lastEditedBy"],
): ContractSections {
  const next = [...current];
  for (const section of incoming) {
    const withEditor: ContractSection = { ...section, lastEditedBy };
    const index = next.findIndex((s) => s.key === section.key);
    if (index >= 0) next[index] = withEditor;
    else next.push(withEditor);
  }
  return next;
}
