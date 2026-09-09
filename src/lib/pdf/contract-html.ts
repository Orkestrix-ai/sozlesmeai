import "server-only";

import { getContractFontDataUrls } from "@/lib/pdf/fonts";
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
 * yapılandırılmış alan olarak şemada yok (bkz. contract-document.tsx'in
 * eski yorumu, aynı gerekçe geçerli); FR-04'ün "parties" bölümü bu bilgiyi
 * metin içinde zaten taşıyor.
 *
 * Chromium'a verilecek TAM bir HTML sayfası döndürür (page.setContent).
 * Sayfa numaraları burada DEĞİL, page.pdf()'in footerTemplate'inde —
 * Puppeteer'ın kendi pageNumber/totalPages mekanizması bunun için var.
 */
export function buildContractHtml(params: {
  title: string;
  versionNo: number;
  generatedAt: Date;
  sections: ContractSections;
}): string {
  const { title, versionNo, generatedAt, sections } = params;
  const fonts = getContractFontDataUrls();

  const sectionsHtml = sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.body)}</p>
        </section>`,
    )
    .join("\n");

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
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: "ContractSerif", serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
  }
  .page {
    padding: 40px 56px;
  }
  h1 {
    font-family: "ContractHeading", sans-serif;
    font-size: 20pt;
    margin: 0 0 4px;
  }
  .meta {
    font-size: 9pt;
    color: #555;
    margin: 0 0 24px;
  }
  section {
    break-inside: avoid;
    margin-bottom: 4px;
  }
  h2 {
    font-family: "ContractSerif", serif;
    font-weight: 700;
    font-size: 13pt;
    margin: 16px 0 6px;
  }
  p {
    margin: 0;
    white-space: pre-wrap;
  }
</style>
</head>
<body>
  <div class="page">
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">Sürüm ${versionNo} · ${generatedAt.toLocaleDateString("tr-TR")}</p>
    ${sectionsHtml}
  </div>
</body>
</html>`;
}

/** page.pdf({ footerTemplate }) — Puppeteer'ın kendi sayfa numarası sınıfları. */
export function buildContractFooterTemplate(): string {
  return `
    <div style="width: 100%; font-size: 8px; color: #888; padding: 0 56px; display: flex; justify-content: space-between; font-family: sans-serif;">
      <span>Cntrsign</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`;
}
