import "server-only";

import puppeteer from "puppeteer";

import { buildContractFooterTemplate, buildContractHtml } from "@/lib/pdf/contract-html";
import type { ContractSections } from "@/lib/contracts/schema";

/**
 * Chromium'un kendi Skia/HarfBuzz metin dizilim motoruyla üretir — bkz.
 * Faz 3 commit mesajındaki @react-pdf/renderer/fontkit'in doğrulanmış
 * Türkçe dotless-ı hatası. Her çağrı kendi headless örneğini açıp kapatır;
 * bu MVP hacminde kabul edilebilir (paylaşılan bir tarayıcı havuzu Faz 4
 * sonrası bir optimizasyon olarak bırakıldı).
 */
export async function renderContractPdf(params: {
  title: string;
  versionNo: number;
  generatedAt: Date;
  sections: ContractSections;
}): Promise<Buffer> {
  const html = buildContractHtml(params);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      // Kenar boşlukları HTML padding'iyle DEĞİL burada verilir: gövde
      // padding'i yalnızca ilk sayfaya uygulanır, sonraki sayfalarda metin
      // kağıdın kenarına yapışırdı. Alt boşluk footer bandını da karşılar.
      margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: buildContractFooterTemplate(),
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
