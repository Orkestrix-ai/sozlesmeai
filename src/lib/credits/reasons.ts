/**
 * `credit_ledger.reason` DEĞERLERİ — `credit_entry_type` enum'ı değil.
 * messages/*.json → dashboard.credits.reasons ile birebir.
 *
 * Bu ayrım bir kez kaçırıldı: liste `adjustment` içeriyordu (o bir entry_type),
 * oysa `admin_add_credits` reason olarak `admin_adjustment` yazıyor — arayüzde
 * ham metin görünüyordu. Yeni bir reason yazan her RPC/route buraya da eklenmeli.
 *
 * `signup_starter_grant` artık YAZILMIYOR ama listede kalıyor: credit_ledger
 * append-only, yani eski kayıtlardaki bu reason hiçbir zaman silinemez. Aynı
 * gerekçeyle `adjustment` ve `refund` de duruyor: bugün hiçbir şey yazmıyor,
 * ama mevcut RPC seti yerleşmeden önce yazılmış satırlar olabilir.
 *
 * Liste burada, bileşenlerin içinde DEĞİL: aynı etiketleri hem kullanıcı
 * panosu (workspace-overview.tsx, istemci) hem admin kredi defteri
 * (admin/billing, sunucu) okuyor. İkinci bir kopya, bu listenin doğduğu
 * hatanın — liste ile mesaj dosyasının ayrışması — ikinci bir kopyası olurdu.
 */
export const KNOWN_REASON_KEYS = [
  "signup_grant",
  "signup_starter_grant",
  "adjustment",
  "refund",
  "admin_adjustment",
  "operation_failed",
  "document_row_failed",
  "findings_delete_failed",
  "findings_insert_failed",
  "draft_generate",
  "ai_edit",
  "risk_check",
  "pdf_generate",
  "manual_edit",
] as const;

export type KnownReasonKey = (typeof KNOWN_REASON_KEYS)[number];

/**
 * Tanınmayan reason ham metin olarak BASILMAMALI. `refund_credits`'in
 * `p_reason` parametresi serbest metin ve RPC `authenticated` rolüne açık;
 * yani izin listesi hiçbir zaman tam olamaz. Çağıran taraf bu koruma false
 * dönerse `dashboard.credits.reasons.other`'a düşer — `other` bir DB değeri
 * değil, yalnızca görüntüleme yedeği, bu yüzden listede YOK.
 *
 * `reasonLabel` burada değil: next-intl çevirici çağrısı gerekiyor ve
 * çağıranların biri istemci (useTranslations) biri sunucu (getTranslations).
 */
export function isKnownReason(reason: string): reason is KnownReasonKey {
  return (KNOWN_REASON_KEYS as readonly string[]).includes(reason);
}
