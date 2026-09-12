import type { ContractSection, ContractSections } from "@/lib/contracts/schema";

/**
 * Ön izleme (contract-document.tsx) ile PDF (lib/pdf/contract-html.ts) TEK
 * belge modelinden beslensin diye burası saf tutulur: React yok, `server-only`
 * YOK. İkisinin yapısı buradan ayrılamaz — kullanıcının gördüğü, indirdiğidir.
 *
 * ContractSection şeması DEĞİŞMEZ (key/title/body/status/missing/lastEditedBy).
 * Taraflar için ayrı bir alan olmadığından (bkz. schema.ts) "taraflar" bölümü
 * yalnızca görsel olarak önsöz blokuna ayrıştırılır; veri aynen kalır.
 */

/** A4 @96dpi. Ölçüm katmanı da, sayfa kutusu da bu sayıları kullanır. */
export const A4 = {
  widthPx: 794,
  heightPx: 1123,
  padX: 56,
  padTop: 56,
  padBottom: 64,
} as const;

/** İçerik kutusu: 682 × 1003 px */
export const A4_CONTENT_WIDTH = A4.widthPx - A4.padX * 2;
export const A4_CONTENT_HEIGHT = A4.heightPx - A4.padTop - A4.padBottom;

export type DocLine = { label: string | null; value: string };

export type DocumentBlock =
  | { kind: "preamble"; key: string; lines: DocLine[]; section: ContractSection }
  | {
      kind: "article";
      key: string;
      no: number;
      heading: string;
      body: string;
      section: ContractSection;
    };

/** Türkçe diyakritikleri sadeleştirip karşılaştırılabilir hale getirir. */
function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[_\-\s]+/g, " ")
    .trim();
}

const PREAMBLE_PATTERNS = ["taraflar", "taraf bilgileri", "parties", "the parties"];

/**
 * YALNIZCA index 0 önsöz olabilir. Ortada duran bir "Taraflar" bölümü madde
 * numaralandırmasını bozmasın diye kasten bu kadar dar.
 */
function isPreamble(section: ContractSection, index: number): boolean {
  if (index !== 0) return false;
  const key = normalize(section.key);
  const title = normalize(section.title);
  return PREAMBLE_PATTERNS.some((p) => key === p || title === p);
}

const LABELLED_LINE = /^\s*([^:\n]{1,40}):\s*(.*)$/;

/** "Kiracı: Ahmet Yılmaz" → {label, value}; eşleşmeyen satır düz metin kalır. */
export function parseDocLines(body: string): DocLine[] {
  return body
    .split("\n")
    .map((raw) => raw.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = LABELLED_LINE.exec(line);
      if (!match) return { label: null, value: line };
      return { label: match[1].trim(), value: match[2].trim() };
    });
}

export function buildDocumentBlocks(sections: ContractSections): DocumentBlock[] {
  let articleNo = 0;
  return sections.map((section, index) => {
    if (isPreamble(section, index)) {
      return {
        kind: "preamble" as const,
        key: section.key,
        lines: parseDocLines(section.body),
        section,
      };
    }
    articleNo += 1;
    return {
      kind: "article" as const,
      key: section.key,
      no: articleNo,
      heading: `${articleNo}. ${section.title}`,
      body: section.body,
      section,
    };
  });
}

/**
 * Taraf ETİKETİ değil, tarafın ÖZNİTELİĞİ olan satırlar. "Taraflar" bölümü
 * tipik olarak `Kiraya Veren: … / T.C. Kimlik No: … / Adres: …` diye akar;
 * bunları elemezsek imza sütunu "T.C. KİMLİK NO" diye başlıklanır.
 */
const ATTRIBUTE_HINTS = [
  "kimlik",
  "tckn",
  "vergi",
  "adres",
  "telefon",
  "posta",
  "mail",
  "iban",
  "unvan",
  "sicil",
  "address",
  "phone",
  "tax",
  "id no",
];

function isAttributeLabel(label: string): boolean {
  const normalized = normalize(label);
  return ATTRIBUTE_HINTS.some((hint) => normalized.includes(hint));
}

/**
 * İmza sütunu başlıkları — önsözdeki taraf rolleri ("Kiraya Veren",
 * "Kiracı"). Önsöz yoksa, etiketli satır yoksa veya rol gibi görünen iki
 * etiket çıkmıyorsa BOŞ döner; çağıran taraf kendi i18n yedeğine
 * ("Taraf 1" / "Taraf 2") düşer. Yanlış bir başlık yazmaktansa jenerik
 * olanı yazmak yeğdir.
 */
export function partyLabels(blocks: DocumentBlock[]): string[] {
  const preamble = blocks.find((b) => b.kind === "preamble");
  if (!preamble) return [];
  const roles = preamble.lines
    .map((line) => line.label)
    .filter((label): label is string => label !== null && label.length > 0)
    .filter((label) => !isAttributeLabel(label));
  return roles.length >= 2 ? roles.slice(0, 2) : [];
}

/**
 * Bir maddeyi ölçülebilir parçalara böler: [başlık + ilk paragraf], sonra her
 * boş satırla ayrılmış paragraf. Başlık ilk paragrafla aynı parçada kaldığı
 * için sayfa sonunda asla yetim kalmaz.
 */
export function splitBodyParagraphs(body: string): string[] {
  const parts = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return parts.length > 0 ? parts : [""];
}
