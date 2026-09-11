/**
 * Platform admin hesabı oluşturur (veya mevcut bir hesabı admin yapar).
 *
 * NEDEN BU SCRIPT VAR: Admin panelinin tek kapısı `public.platform_admins`
 * tablosunda bir satır olması (`private.is_platform_admin()`). `authenticated`
 * rolünün bu tabloda INSERT policy'si YOK, yani uygulama içinden kimse kendini
 * ya da bir başkasını admin yapamaz — promosyon yalnızca service-role ile
 * mümkün. Repoda bunu yapan bir RPC/UI/seed olmadığı için yol burası.
 *
 * NEDEN SQL DEĞİL, GoTrue Admin API: `auth.users.encrypted_password` alanını
 * `extensions.crypt(pw, gen_salt('bf'))` ile yazmak SESSİZCE bozuk sonuç verir —
 * pgcrypto'nun varsayılan bcrypt cost'u 6 ($2a$06$) ve GoTrue girişte
 * `invalid_credentials` döner, oysa SQL tarafındaki `crypt(pw, hash) = hash`
 * kontrolü `true` der. (Bu projede 2026-09-10'da doğrulandı.) Parola her zaman
 * Admin API üzerinden yazılır ve gerçek bir token isteğiyle sınanır.
 *
 * `src/lib/supabase/admin.ts` burada KULLANILAMAZ: `import "server-only"`
 * içeriyor ve `@/` alias'ı Node script'inde çözülmüyor. Bu yüzden düz `fetch`.
 *
 * Kullanım:
 *   npm run create:admin -- --email demo-admin@sozlesmeai.com --name "Demo Admin"
 *
 * Argümanlar: --email (zorunlu), --name, --locale (tr|en), --password
 * (verilmezse üretilir), --out (kimlik bilgilerinin yazılacağı txt yolu).
 *
 * İdempotent: ikinci çalıştırma kullanıcıyı yeniden oluşturmaz, parolasını
 * sıfırlar ve admin satırını olduğu gibi bırakır.
 */
import { randomInt } from "node:crypto";
import { writeFileSync } from "node:fs";

try {
  process.loadEnvFile();
} catch {
  fail(".env okunamadı. Proje kökünde .env dosyası olmalı (bkz. .env.example).");
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

for (const [name, value] of [
  ["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", ANON_KEY],
]) {
  if (!value) fail(`.env içinde ${name} tanımlı değil.`);
}

const args = parseArgs(process.argv.slice(2));
const email = args.email;
if (!email) fail("--email zorunlu. Örnek: --email demo-admin@sozlesmeai.com");

const fullName = args.name ?? "Demo Admin";
const locale = args.locale ?? "tr";
if (locale !== "tr" && locale !== "en") fail("--locale yalnızca 'tr' veya 'en' olabilir.");

const password = args.password ?? generatePassword(20);
if (password.length < 8) fail("Parola en az 8 karakter olmalı (src/lib/validation.ts).");

/* 1) Kullanıcı — yoksa oluştur, varsa parolasını sıfırla. */
let userId;
let createdNow = false;

{
  const { res, body } = await call("/auth/v1/admin/users", {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, locale },
    }),
  });

  if (res.ok && body?.id) {
    userId = body.id;
    createdNow = true;
    log(`+ auth.users olusturuldu: ${userId}`);
  } else if (res.status === 422 || res.status === 400 || res.status === 409) {
    // Zaten kayıtlı olabilir; e-postadan bul ve parolayı güncelle.
    const existing = await findUserByEmail(email);
    if (!existing) {
      fail(`Kullanıcı oluşturulamadı (HTTP ${res.status}): ${describe(body)}`);
    }
    userId = existing.id;
    log(`= auth.users zaten var: ${userId} - parola sıfırlanıyor.`);
    const upd = await call(`/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: serviceHeaders(),
      body: JSON.stringify({ password, email_confirm: true }),
    });
    if (!upd.res.ok) {
      fail(`Parola güncellenemedi (HTTP ${upd.res.status}): ${describe(upd.body)}`);
    }
  } else {
    fail(`Kullanıcı oluşturulamadı (HTTP ${res.status}): ${describe(body)}`);
  }
}

/* 2) Bootstrap doğrulaması — handle_new_user tetiklendi mi?
 *    (profil yoksa getCurrentUser() redirect değil THROW eder.) */
{
  const profile = await restGet(
    `/rest/v1/profiles?id=eq.${userId}&select=id,email,full_name,locale`,
  );
  if (!profile.length) {
    fail("profiles satırı yok - handle_new_user tetiklenmemiş. Supabase loglarına bakın.");
  }
  const members = await restGet(
    `/rest/v1/workspace_members?user_id=eq.${userId}&select=workspace_id,role`,
  );
  if (!members.length) {
    fail("workspace_members satırı yok - workspace bootstrap eksik.");
  }
  log(`+ bootstrap tamam: profil (${profile[0].locale}) + ${members.length} workspace üyeliği`);
}

/* 3) Platform admin yetkisi. `Prefer: resolution=merge-duplicates` sayesinde
 *    tekrar çalıştırmak çakışma üretmez. */
{
  const { res, body } = await call("/rest/v1/platform_admins", {
    method: "POST",
    headers: serviceHeaders({ Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    fail(`platform_admins satırı yazılamadı (HTTP ${res.status}): ${describe(body)}`);
  }
  log("+ platform_admins satırı hazır.");
}

/* 4) Girişi GERÇEKTEN sına. Tek kabul edilebilir doğrulama bu; SQL tarafındaki
 *    crypt() karşılaştırması yukarıda anlatılan hata sınıfını göremez. */
{
  const { res, body } = await call("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok || !body?.access_token) {
    fail(`Giriş doğrulanamadı (HTTP ${res.status}): ${describe(body)}`);
  }
  log("+ giriş doğrulandı (access_token alındı).");
}

/* 5) Çıktı. Service-role anahtarı hiçbir yere yazılmaz. */
const lines = [
  "SözleşmeAI - demo platform admin hesabı",
  "UYARI: Bu dosya parola içerir. Git'e KOYMAYIN, repo dışında tutun.",
  "",
  `E-posta      : ${email}`,
  `Parola       : ${password}`,
  `Ad Soyad     : ${fullName}`,
  `Dil          : ${locale}`,
  `User ID      : ${userId}`,
  `Supabase URL : ${SUPABASE_URL}`,
  `Oluşturulma  : ${new Date().toISOString()}`,
  "",
  "Giriş        : http://localhost:3000/tr/login",
  "Admin paneli : http://localhost:3000/tr/admin",
];

console.log("");
console.log(lines.join("\n"));
console.log("");
log(createdNow ? "Yeni hesap oluşturuldu." : "Mevcut hesap güncellendi.");

if (args.out) {
  writeFileSync(args.out, lines.join("\r\n") + "\r\n", "utf8");
  log(`Kimlik bilgileri yazıldı: ${args.out}`);
}

/* --- yardımcılar --- */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key] = "true";
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

/** Karıştırılması kolay karakterler (0/O, 1/l/I) bilerek dışarıda. */
function generatePassword(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += alphabet[randomInt(alphabet.length)];
  }
  return result;
}

function serviceHeaders(extra = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function call(path, init) {
  const res = await fetch(`${SUPABASE_URL}${path}`, init);
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { res, body };
}

async function restGet(path) {
  const { res, body } = await call(path, { headers: serviceHeaders() });
  if (!res.ok) fail(`Sorgu başarısız (HTTP ${res.status}): ${describe(body)}`);
  return Array.isArray(body) ? body : [];
}

/** GoTrue admin listesi sayfalı; e-posta filtresi sürüme göre değiştiği için
 *  sayfaları gezip elde eşleştiriyoruz. */
async function findUserByEmail(target) {
  const needle = target.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { res, body } = await call(`/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: serviceHeaders(),
    });
    if (!res.ok) fail(`Kullanıcı listesi alınamadı (HTTP ${res.status}): ${describe(body)}`);
    const users = body?.users ?? [];
    const hit = users.find((u) => (u.email ?? "").toLowerCase() === needle);
    if (hit) return hit;
    if (users.length < 200) return null;
  }
  return null;
}

function describe(body) {
  if (body === null) return "(boş yanıt)";
  if (typeof body === "string") return body;
  return body.msg ?? body.message ?? body.error_description ?? JSON.stringify(body);
}

function log(message) {
  console.log(message);
}

function fail(message) {
  console.error(`HATA: ${message}`);
  process.exit(1);
}
