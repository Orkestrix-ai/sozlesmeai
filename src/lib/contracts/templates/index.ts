import { employmentTemplate } from "./employment";
import { ndaTemplate } from "./nda";
import { rentalTemplate } from "./rental";
import { resignationTemplate } from "./resignation";
import { serviceTemplate } from "./service";
import type { ContractTemplate } from "./types";

/**
 * Şablon kayıt defteri (requirement §9). Yeni bir sözleşme türü eklemek
 * = bir dosya yazmak + bu diziye bir satır eklemek; ekranların, formun,
 * ön izlemenin veya server action'ın hiçbirine dokunulmaz.
 *
 * Tek DB bağı `contractTypeCode`: `contracts.contract_type` sütunu
 * `contract_types(code)`a FK ile bağlı, dolayısıyla YENİ BİR KOD KULLANAN
 * şablon eklemeden önce migration yazılmalıdır (bkz.
 * 20260912100000_template_contract_types.sql).
 */
const ALL_TEMPLATES: readonly ContractTemplate[] = [
  rentalTemplate,
  employmentTemplate,
  ndaTemplate,
  serviceTemplate,
  resignationTemplate,
];

export const CONTRACT_TEMPLATES = ALL_TEMPLATES;

/** Kullanıcıya gösterilecek şablonlar — "draft"/"deprecated" olanlar gizlidir. */
export function getActiveTemplates(): ContractTemplate[] {
  return ALL_TEMPLATES.filter((template) => template.status === "active");
}

/**
 * Yalnızca AKTİF şablonu döndürür: id doğrudan URL'den (`/templates/[templateId]`)
 * geliyor, bu yüzden yayından kaldırılmış bir şablona derin bağlantıyla
 * ulaşılamamalı. Bulunamazsa çağıran taraf `notFound()` atar.
 */
export function getTemplate(id: string): ContractTemplate | undefined {
  return ALL_TEMPLATES.find((template) => template.id === id && template.status === "active");
}

export type {
  ContractTemplate,
  MessageKey,
  TemplateArticle,
  TemplateCategory,
  TemplateField,
  TemplateFieldGroup,
  TemplateFieldOption,
  TemplateFieldType,
  TemplateValues,
} from "./types";
export { FIELD_GROUPS, TEMPLATE_CATEGORIES } from "./types";
export {
  buildContractTitle,
  formatFieldValue,
  missingRequiredFields,
  renderTemplateSections,
  type TemplateLabels,
} from "./render";
export { buildTemplateLabels, type Translate } from "./labels";
