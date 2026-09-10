/**
 * messages/tr.json ile messages/en.json arasındaki tutarlılığı denetler.
 *
 * Bu, tipli mesajların (global.d.ts) GÖREMEDİĞİ boşluk: `Messages` tipi
 * `tr.json`'dan türetildiği için kaynakta kullanılan anahtarlar `tsc` ile
 * doğrulanır, ama `en.json`'daki bir eksik sessizce production'a gider.
 *
 * İki kontrol:
 *   1) Yaprak anahtar paritesi — bir dilde olup diğerinde olmayan yollar.
 *   2) ICU yer tutucu / etiket paritesi — `{name}` ve `<link>` tokenlarının
 *      iki dilde aynı olması. `t.rich("...", { link: ... })` çağrısında etiket
 *      bir dilde eksikse runtime'da hata atar.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES = ["tr", "en"];

const load = (locale) =>
  JSON.parse(readFileSync(join(root, "messages", `${locale}.json`), "utf8"));

/** Yaprak (string) değerleri "a.b.c" -> değer olarak düzleştirir. */
function flatten(node, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") flatten(value, path, out);
    else out.set(path, String(value));
  }
  return out;
}

/** ICU argümanları `{name}` ve zengin metin etiketleri `<link>`. */
function tokensOf(message) {
  const args = [...message.matchAll(/\{\s*([a-zA-Z0-9_]+)/g)].map((m) => `{${m[1]}}`);
  const tags = [...message.matchAll(/<\s*([a-zA-Z0-9_]+)\s*>/g)].map((m) => `<${m[1]}>`);
  return new Set([...args, ...tags]);
}

const messages = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l))]));
const problems = [];

// 1) Yaprak anahtar paritesi
for (const locale of LOCALES) {
  const others = LOCALES.filter((l) => l !== locale);
  for (const path of messages[locale].keys()) {
    for (const other of others) {
      if (!messages[other].has(path)) {
        problems.push(`eksik anahtar: ${path} — ${locale}.json'da var, ${other}.json'da yok`);
      }
    }
  }
}

// 2) ICU token paritesi (yalnızca her iki dilde de bulunan anahtarlar)
const [base, ...rest] = LOCALES;
for (const [path, message] of messages[base]) {
  const baseTokens = tokensOf(message);
  for (const other of rest) {
    const otherMessage = messages[other].get(path);
    if (otherMessage === undefined) continue;
    const otherTokens = tokensOf(otherMessage);
    const missing = [...baseTokens].filter((t) => !otherTokens.has(t));
    const extra = [...otherTokens].filter((t) => !baseTokens.has(t));
    if (missing.length || extra.length) {
      problems.push(
        `token uyuşmazlığı: ${path} — ${other}.json` +
          (missing.length ? ` eksik ${missing.join(", ")}` : "") +
          (extra.length ? ` fazladan ${extra.join(", ")}` : ""),
      );
    }
  }
}

const total = messages[base].size;
if (problems.length === 0) {
  console.log(`i18n OK — ${LOCALES.join("/")} arasında ${total} anahtar tutarlı.`);
} else {
  console.error(`i18n kontrolü ${problems.length} sorun buldu:\n`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error("");
  process.exitCode = 1;
}
