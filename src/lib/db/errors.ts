import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

/**
 * İstemciye giden hata sözlüğü — 5. sütun (denetim izi ve hassas veri
 * koruma) uygulama yarısı. Buradaki kod dışında HİÇBİR şey (tablo adı, SQL
 * sözdizim hatası, kolon adı) istemciye ulaşmaz; ham hata her zaman
 * `console.error`'a `reference` ile birlikte yazılır, sunucu logunda kalır.
 */
export type PublicErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "invalid_input"
  | "insufficient_credits"
  | "generic";

/**
 * PostgreSQL SQLSTATE → public kod. `.includes("insufficient_credits")`
 * gibi mesaj-string eşlemesi YERİNE — mesaj metni değişirse (lokalizasyon,
 * Postgres sürümü) sessizce bozulmaz, kod sabit kalır.
 * Bkz. https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_CODE_MAP: Record<string, PublicErrorCode> = {
  "23505": "conflict", // unique_violation
  "23503": "conflict", // foreign_key_violation
  "23514": "invalid_input", // check_violation
  "22P02": "invalid_input", // invalid_text_representation (bozuk uuid vb.)
  "22023": "invalid_input", // invalid_parameter_value (RPC'lerimizin unknown_operation/invalid_amount'ı)
  "42501": "forbidden", // insufficient_privilege (RPC'lerimizin unauthorized/immutable_column/append_only'si)
  // P0001 Postgres'in GENEL raise_exception kodudur, bir ürün sinyali değil:
  // errcode'u açıkça verilmemiş her `raise exception` buraya düşer. Eskiden
  // "insufficient_credits"e eşleniyordu; alakasız bir RPC hatası kullanıcıya
  // "krediniz yetmiyor" diye görünebiliyordu. Gerçek kredi hatası kaybolmuyor:
  // consume_credits tam olarak 'insufficient_credits' metnini atıyor ve
  // aşağıdaki MESSAGE_ALLOWLIST eşlemesi onu doğru koda daraltıyor.
  "P0001": "generic",
  "P0002": "not_found", // raise exception 'not_found'
  PGRST116: "not_found", // PostgREST: .single() sıfır/çoklu satır
  PGRST301: "unauthorized", // PostgREST: JWT geçersiz/süresi dolmuş
};

/**
 * Yalnızca KENDİ RPC'lerimizin `raise exception '<etiket>'` metinleri.
 * Buradaki listede olmayan hiçbir mesaj metni dışarı çıkmaz — Postgres'in
 * kendi ürettiği (tablo/kolon adı içerebilen) mesajlar bu listeye ASLA
 * eklenmez, yalnızca yukarıdaki PG_CODE_MAP'teki SQLSTATE ile sınıflandırılır.
 */
const MESSAGE_ALLOWLIST = new Set([
  "insufficient_credits",
  "unauthorized",
  "unknown_operation",
  "invalid_amount",
  "not_found",
  "append_only",
  "immutable_column",
]);

function reference(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

/**
 * Ham PostgrestError'ı sunucu logunda tutar (tablo/kolon/SQL detayları
 * DAHİL), istemciye yalnızca { code, reference } döner. `scope` çağıran
 * fonksiyonun/rotanın adıdır (ör. "contracts/turn:upsert_sections").
 */
export function toPublicError(
  scope: string,
  error: Pick<PostgrestError, "code" | "message" | "details" | "hint"> | null | undefined,
): { code: PublicErrorCode; reference: string } {
  const ref = reference();
  const pgCode = error?.code ?? "";
  const code = PG_CODE_MAP[pgCode] ?? "generic";

  console.error(`[${scope}] ${ref}`, {
    code: pgCode,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  });

  // Mesaj metnini yalnızca allowlist'teyse (kendi RPC etiketlerimiz) ve
  // SQLSTATE zaten P0001/42501/22023 gibi "kendi raise'imiz" bir koda
  // eşleniyorsa daha isabetli bir public koda daraltmayı dene.
  const label = (error?.message ?? "").trim();
  if (MESSAGE_ALLOWLIST.has(label)) {
    if (label === "insufficient_credits") return { code: "insufficient_credits", reference: ref };
    if (label === "unauthorized") return { code: "forbidden", reference: ref };
    if (label === "not_found") return { code: "not_found", reference: ref };
    if (label === "unknown_operation" || label === "invalid_amount") {
      return { code: "invalid_input", reference: ref };
    }
    if (label === "append_only" || label === "immutable_column") {
      return { code: "forbidden", reference: ref };
    }
  }

  return { code, reference: ref };
}

/**
 * `src/lib/dal.ts` gibi throw-eden yerler için: mesaj HER ZAMAN public kod,
 * ham PostgrestError asla Error.message'a taşınmaz. Next'in hata sınırına
 * (error.tsx) bu sayede prod'da da dev'de de yalnızca kod + reference gider.
 */
export class DbError extends Error {
  readonly code: PublicErrorCode;
  readonly reference: string;

  constructor(scope: string, error: Pick<PostgrestError, "code" | "message" | "details" | "hint">) {
    const { code, reference: ref } = toPublicError(scope, error);
    super(code);
    this.name = "DbError";
    this.code = code;
    this.reference = ref;
  }
}
