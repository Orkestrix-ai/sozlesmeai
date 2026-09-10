import { z } from "zod";

/**
 * DB SINIRINDA ikinci bir doğrulama katmanı — 2. sütun (SQL Injection
 * Önleme ve Girdi Doğrulama). `src/lib/validation.ts`'in YERİNE geçmez: o
 * dosya form/UX doğrulaması yapar ve i18n anahtarı döndürmek için Zod'u
 * bilinçli olarak reddetmiştir (bkz. validation.ts başlığı). Burası,
 * rota/action parametrelerinin DB'ye ulaşmadan önce geçtiği son kapı.
 */

export const uuidSchema = z.uuid();

/** src/actions/sharing.ts: randomBytes(24).toString("base64url") → 32 karakter. */
export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{22,128}$/);

export const idempotencyKeySchema = z.string().min(8).max(200);

export const addCreditsSchema = z.object({
  workspaceId: uuidSchema,
  amount: z.int().min(1).max(1_000_000),
});

/** RPC dönüş şekilleri — dbRpc'nin ikinci doğrulama katmanı. */
export const createContractVersionResultSchema = z
  .array(
    z.object({
      version_id: z.uuid(),
      version_no: z.number().int(),
      balance: z.number().int(),
    }),
  )
  .length(1);

export const consumeCreditsResultSchema = z.number().int();

export const adminAddCreditsResultSchema = z.number().int();

export const sharedContractResultSchema = z
  .array(
    z.object({
      contract_id: z.uuid(),
      title: z.string(),
      status: z.enum(["draft", "review", "ready", "shared", "error"]),
      version_id: z.uuid().nullable(),
      sections: z.unknown(),
      storage_path: z.string().nullable(),
    }),
  )
  .max(1);

/**
 * `auth/confirm/route.ts`'teki açık yönlendirme açığının (B16) çözümü:
 * `next` her zaman TEK `/` ile başlayan, aynı origin'e kalan bir yol olmak
 * zorunda. `//evil.com/x` gibi protokol-göreli bir değer (`new URL(next,
 * base)` ile origin dışına çıkan) burada reddedilir — regex `/(?!\/)` ile
 * ikinci bir `/` ile başlamayı baştan engeller.
 */
export const authNextPathSchema = z
  .string()
  .regex(/^\/(?!\/)[A-Za-z0-9\-._~!$&'()*+,;=:@%/]*$/)
  .catch("/");
