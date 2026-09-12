/**
 * `admin_audit_log.action` DEĞERLERİ — messages/*.json → admin.auditLog.actions
 * ile birebir. Bugün tek yazıcı `admin_add_credits` RPC'si (20260908130000:43),
 * yani liste tek elemanlı; yeni bir admin aksiyonu eklendiğinde buraya ve her
 * iki mesaj dosyasına da eklenmeli.
 *
 * Liste bileşenin içinde değil burada: hem özet sayfası (/admin) hem tam tablo
 * (/admin/audit-log) aynı etiketi basıyor. Aynı gerekçe için bkz.
 * src/lib/credits/reasons.ts.
 */
export const KNOWN_ACTIONS = ["add_credits"] as const;

export type KnownAction = (typeof KNOWN_ACTIONS)[number];

export function isKnownAction(action: string): action is KnownAction {
  return (KNOWN_ACTIONS as readonly string[]).includes(action);
}

/**
 * Aktör adı çözülemediğinde kısaltılmış UUID'ye düşer: `actor_id` append-only
 * kuralı gereği FK'siz düz uuid, yani profili silinmiş bir aktörün adı yok.
 * Hiçbir şey göstermemektense kaynağı izlenebilir bırakmak yeğdir.
 */
export function actorLabel(actorName: string | null, actorId: string | null): string {
  return actorName ?? actorId?.slice(0, 8) ?? "—";
}
