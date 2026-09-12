import "server-only";

import { getContractFontDataUrls } from "@/lib/pdf/fonts";
import { buildDocumentBlocks, partyLabels } from "@/lib/contracts/document-model";
import type { ContractSections } from "@/lib/contracts/schema";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * FR-08 — "başlık, taraflar, tarih ve içerik". Taraf isimleri ayrı bir
 * yapılandırılmış alan olarak şemada yok; "taraflar" bölümü bu bilgiyi metin
 * içinde taşır ve document-model.ts onu görsel olarak önsöz blokuna ayırır.
 *
 * Belge YAPISI contract-document.tsx (ekrandaki ön izleme) ile AYNI kaynaktan
 * (buildDocumentBlocks) gelir — kullanıcının gördüğü, indirdiğidir. Ekrandaki
 * taslak/onay tonları ve "eksik bilgi" notları buraya BİLEREK taşınmaz: PDF
 * nihai belgedir, çalışma izlerini taşımaz.
 *
 * Chromium'a verilecek TAM bir HTML sayfası döndürür (page.setContent).
 * Sayfa numaraları burada DEĞİL, page.pdf()'in footerTemplate'inde —
 * Puppeteer'ın kendi pageNumber/totalPages mekanizması bunun için var.
 *
 * Kenar boşlukları da burada DEĞİL, page.pdf({ margin }) içinde (render.ts):
 * gövdeye verilen bir padding yalnızca ilk sayfaya uygulanır, sonraki
 * sayfalarda metin kağıdın kenarına yapışır.
 */
export function buildContractHtml(params: {
  title: string;
  versionNo: number;
  generatedAt: Date;
  sections: ContractSections;
}): string {
  const { title, versionNo, generatedAt, sections } = params;
  const fonts = getContractFontDataUrls();
  const blocks = buildDocumentBlocks(sections);

  const bodyHtml = blocks
    .map((block) => {
      if (block.kind === "preamble") {
        const rows = block.lines
          .map((line) =>
            line.label
              ? `<div class="party-row"><span class="party-label">${escapeHtml(line.label)}</span><span class="party-value">${escapeHtml(line.value)}</span></div>`
              : `<div class="party-row"><span class="party-value">${escapeHtml(line.value)}</span></div>`,
          )
          .join("\n");
        return `
        <section class="preamble">
          <h2 class="preamble-heading">TARAFLAR</h2>
          ${rows}
        </section>`;
      }
      return `
        <section>
          <h2>${escapeHtml(block.heading)}</h2>
          <p>${escapeHtml(block.body)}</p>
        </section>`;
    })
    .join("\n");

  const parties = partyLabels(blocks);
  const [partyOne, partyTwo] = parties.length === 2 ? parties : ["Taraf 1", "Taraf 2"];

  const signatureColumn = (party: string) => `
        <div class="sign-col">
          <p class="sign-party">${escapeHtml(party)}</p>
          <div class="sign-line"></div><p class="sign-caption">Ad Soyad</p>
          <div class="sign-line"></div><p class="sign-caption">İmza</p>
          <div class="sign-line"></div><p class="sign-caption">Tarih</p>
        </div>`;

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @font-face {
    font-family: "ContractSerif";
    src: url(${fonts.body}) format("woff");
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: "ContractSerif";
    src: url(${fonts.bodyBold}) format("woff");
    font-weight: 700;
    font-style: normal;
  }
  @font-face {
    font-family: "ContractSerif";
    src: url(${fonts.bodyItalic}) format("woff");
    font-weight: 400;
    font-style: italic;
  }
  @font-face {
    font-family: "ContractHeading";
    src: url(${fonts.heading}) format("woff");
    font-weight: 700;
    font-style: normal;
  }
  @page { size: A4; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: "ContractSerif", serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #393633;
  }
  h1 {
    font-family: "ContractHeading", sans-serif;
    font-size: 18pt;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.01em;
    text-align: center;
    color: #0d0d0f;
    margin: 0 0 6px;
  }
  .meta {
    font-size: 9pt;
    color: #6d6862;
    text-align: center;
    margin: 0 0 28px;
  }
  section {
    break-inside: auto;
    margin-bottom: 2px;
  }
  h2 {
    font-family: "ContractHeading", sans-serif;
    font-weight: 700;
    font-size: 12pt;
    line-height: 1.35;
    color: #0d0d0f;
    margin: 18px 0 6px;
    /* Başlık asla sayfa sonunda yetim kalmasın. */
    break-after: avoid;
  }
  p {
    margin: 0;
    white-space: pre-wrap;
    text-align: justify;
    hyphens: auto;
    orphans: 2;
    widows: 2;
  }
  .preamble-heading {
    font-size: 10pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 0;
  }
  .party-row {
    display: flex;
    gap: 12px;
    margin-bottom: 3px;
  }
  .party-label {
    min-width: 140px;
    font-weight: 700;
    color: #0d0d0f;
  }
  .party-value {
    flex: 1;
  }
  .signatures {
    display: flex;
    gap: 48px;
    margin-top: 48px;
    break-inside: avoid;
  }
  .sign-col {
    flex: 1;
  }
  .sign-party {
    font-family: "ContractHeading", sans-serif;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0d0d0f;
    text-align: left;
    margin: 0 0 18px;
  }
  .sign-line {
    border-bottom: 1px solid #aaa49d;
    height: 26px;
  }
  .sign-caption {
    font-size: 8.5pt;
    color: #6d6862;
    text-align: left;
    margin: 3px 0 18px;
  }
  .disclaimer {
    margin-top: 32px;
    font-size: 8.5pt;
    line-height: 1.5;
    color: #6d6862;
    text-align: left;
    break-inside: avoid;
  }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Sürüm ${versionNo} · ${generatedAt.toLocaleDateString("tr-TR")}</p>
  ${bodyHtml}
  <div class="signatures">
${signatureColumn(partyOne)}
${signatureColumn(partyTwo)}
  </div>
  <p class="disclaimer">Bu belge bir sözleşme taslağıdır; hukuki görüş veya geçerlilik garantisi değildir.</p>
</body>
</html>`;
}

/** page.pdf({ footerTemplate }) — Puppeteer'ın kendi sayfa numarası sınıfları. */
export function buildContractFooterTemplate(): string {
  return `
    <div style="width: 100%; font-size: 8px; color: #888; padding: 0 16mm; display: flex; justify-content: space-between; font-family: sans-serif;">
      <span>SözleşmeAI</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`;
}
