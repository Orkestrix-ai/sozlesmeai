import "server-only";

import fs from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * @react-pdf/renderer `Font.register`'ın `src`'i her zaman `fetch(src)` ile
 * okur (bkz. @react-pdf/font kaynağı) — düz bir dosya sistemi yolu KABUL
 * ETMEZ. Node'un yerleşik fetch'i `data:` URL'lerini ağ isteği yapmadan
 * çözer; bu yüzden fontları base64 data URL'e çevirip öyle veriyoruz.
 *
 * Gömülü Latin Extended-A glifleri (ş, ğ, ı, İ, ö, ü, ç) içerir — yerleşik
 * Helvetica bunları desteklemez, font gömme PDF için ZORUNLU (FR-08).
 */
function fontDataUrl(pkgRelativePath: string): string {
  const filePath = path.join(process.cwd(), "node_modules", pkgRelativePath);
  const buffer = fs.readFileSync(filePath);
  return `data:font/woff;base64,${buffer.toString("base64")}`;
}

let registered = false;

export const CONTRACT_BODY_FONT = "SourceSerif4";
export const CONTRACT_HEADING_FONT = "InterTight";

export function registerContractFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: CONTRACT_BODY_FONT,
    fonts: [
      { src: fontDataUrl("@fontsource/source-serif-4/files/source-serif-4-latin-ext-400-normal.woff"), fontWeight: 400 },
      { src: fontDataUrl("@fontsource/source-serif-4/files/source-serif-4-latin-ext-700-normal.woff"), fontWeight: 700 },
      {
        src: fontDataUrl("@fontsource/source-serif-4/files/source-serif-4-latin-ext-400-italic.woff"),
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: CONTRACT_HEADING_FONT,
    fonts: [
      { src: fontDataUrl("@fontsource/inter-tight/files/inter-tight-latin-ext-700-normal.woff"), fontWeight: 700 },
    ],
  });

  // Türkçe metinlerde otomatik heceleme yanlış kesim yapar (ör. "ş"-"i").
  Font.registerHyphenationCallback((word) => [word]);
}
