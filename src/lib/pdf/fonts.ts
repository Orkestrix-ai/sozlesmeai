import "server-only";

import fs from "node:fs";
import path from "node:path";

/**
 * Puppeteer (Chromium) HTML'i kendi Skia/HarfBuzz metin dizilim motoruyla
 * render eder — react-pdf/fontkit'in Türkçe dotless-ı (U+0131) hatasının
 * (bkz. Faz 3 commit mesajı) kaynağı olan özel glif alt kümeleme adımı
 * burada YOK. Fontlar yine base64 data URL olarak @font-face'e gömülür;
 * yalnızca TÜKETİCİSİ değişti (fontkit yerine tarayıcı CSS motoru).
 */
function fontDataUrl(pkgRelativePath: string): string {
  const filePath = path.join(process.cwd(), "node_modules", pkgRelativePath);
  const buffer = fs.readFileSync(filePath);
  return `data:font/woff;base64,${buffer.toString("base64")}`;
}

let cached: { body: string; bodyBold: string; bodyItalic: string; heading: string } | null = null;

export function getContractFontDataUrls() {
  if (!cached) {
    cached = {
      body: fontDataUrl("@fontsource/source-serif-4/files/source-serif-4-latin-ext-400-normal.woff"),
      bodyBold: fontDataUrl("@fontsource/source-serif-4/files/source-serif-4-latin-ext-700-normal.woff"),
      bodyItalic: fontDataUrl("@fontsource/source-serif-4/files/source-serif-4-latin-ext-400-italic.woff"),
      heading: fontDataUrl("@fontsource/inter-tight/files/inter-tight-latin-ext-700-normal.woff"),
    };
  }
  return cached;
}
