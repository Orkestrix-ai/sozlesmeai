import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import type { ZodType } from "zod";

import { DbError, toPublicError, type PublicErrorCode } from "@/lib/db/errors";

export type DbResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: PublicErrorCode; reference: string };

/**
 * `.from(...).select(...)` gibi bir PostgREST çağrısını sarmalar. Ham hatayı
 * asla döndürmez — `toPublicError` ile sınıflandırıp loglar.
 */
export async function dbQuery<T>(
  scope: string,
  run: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>,
): Promise<DbResult<T>> {
  const { data, error } = await run();
  if (error) {
    const { code, reference } = toPublicError(scope, error);
    return { ok: false, code, reference };
  }
  if (data === null) {
    return { ok: false, code: "not_found", reference: crypto.randomUUID().slice(0, 8).toUpperCase() };
  }
  return { ok: true, data };
}

/**
 * `.rpc(...)` çağrısı için aynısı, ARTI dönüş şeklinin Zod ile doğrulanması
 * — RPC'lerimiz artık satır/skaler döndürüyor (create_contract_version,
 * consume_credits vb.), DB'den gelen şekil de sınırda doğrulanır.
 */
export async function dbRpc<T>(
  scope: string,
  run: () => PromiseLike<{ data: unknown; error: PostgrestError | null }>,
  resultSchema: ZodType<T>,
): Promise<DbResult<T>> {
  const { data, error } = await run();
  if (error) {
    const { code, reference } = toPublicError(scope, error);
    return { ok: false, code, reference };
  }
  const parsed = resultSchema.safeParse(data);
  if (!parsed.success) {
    const reference = crypto.randomUUID().slice(0, 8).toUpperCase();
    console.error(`[${scope}] ${reference} rpc_result_shape_mismatch`, parsed.error.message);
    return { ok: false, code: "generic", reference };
  }
  return { ok: true, data: parsed.data };
}

const STATUS_BY_CODE: Record<PublicErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  invalid_input: 400,
  insufficient_credits: 402,
  generic: 500,
};

/** `DbResult`'ı doğrudan bir Route Handler yanıtına çevirir. */
export function dbResultToResponse(result: { ok: false; code: PublicErrorCode; reference: string }): Response {
  return Response.json({ error: result.code, reference: result.reference }, { status: STATUS_BY_CODE[result.code] });
}

/**
 * Route Handler sarmalayıcısı — beklenmeyen (yakalanmamış) her hatayı
 * burada durdurur. Üç API rotası (`turn`, `review`, `pdf`) bununla
 * sarmalanır: kendi `Response.json({ error: ... })` dönüşlerini olduğu gibi
 * geçirir, yalnızca fırlatılan istisnaları (DbError dahil) yakalayıp
 * `{ error: "generic", reference }` + 500'e çevirir. Böylece hiçbir rota
 * yakalanmamış bir PostgrestError'ı ya da yığın izini istemciye sızdırmaz.
 */
export function withApiErrors<Args extends unknown[]>(
  scope: string,
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof DbError) {
        return Response.json(
          { error: error.code, reference: error.reference },
          { status: STATUS_BY_CODE[error.code] },
        );
      }
      const reference = crypto.randomUUID().slice(0, 8).toUpperCase();
      console.error(`[${scope}] ${reference} unhandled`, error);
      return Response.json({ error: "generic", reference }, { status: 500 });
    }
  };
}
