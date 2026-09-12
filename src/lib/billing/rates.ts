/**
 * OPERATÖR SABİTLERİ — gelir/gider KPI'ının para tarafı.
 *
 * Bu dosya bilerek kod, tablo değil: rakamlar ürün kararıdır, kullanıcı verisi
 * değil. Değiştirmek bir deploy gerektirir ve git geçmişinde görünür — bir
 * maliyet raporunun dayandığı fiyatın sessizce değişmemesi için istenen budur.
 *
 * `llm_usage` tablosu yalnızca HAM TOKEN tutar, para tutmaz. Fiyat burada
 * durduğu için bir fiyat değişikliği geçmişi yeniden hesaplanabilir kılar;
 * parayı satıra yazsaydık geçmiş donardı.
 */

/**
 * 1 kredi = 1 sözleşme = 1 PDF (bkz. CLAUDE.md "Billing model").
 *
 * DİKKAT — ELLE SENKRON: aynı rakam `messages/{tr,en}.json` → `pricing.payg.price`
 * içinde "₺249" olarak da duruyor. Biri sayı (hesap), diğeri yerelleştirilmiş
 * görüntü metni; next-intl mesajları statik JSON olduğu için tek kaynağa
 * indirilemiyor. Fiyat değişirse İKİSİ birden güncellenmeli.
 */
export const CREDIT_PRICE_TRY = 249;

/**
 * API faturaları USD gelir, KPI ₺ gösterir. Canlı kur BİLEREK çekilmez —
 * yeni bir dış bağımlılık ve yeni bir hata yüzeyi olurdu; sabit kur, bir
 * yönetim raporu için yeterli ve öngörülebilir.
 */
export const USD_TRY_RATE = { value: 0, isPlaceholder: true };

export type ModelRate = {
  /** USD / 1.000.000 token */
  inputPerMTok: number;
  outputPerMTok: number;
  /** Cache'ten okunan girdi — normal girdiden çok daha ucuz (yalnızca Anthropic). */
  cachedInputPerMTok: number;
  isPlaceholder: boolean;
};

/**
 * Anahtarlar `llm_usage.model` ile birebir eşleşmeli (GROQ_MODEL / ANTHROPIC_MODEL).
 *
 * HEPSİ PLACEHOLDER: gerçek birim fiyatlar bu projeye henüz girilmedi ve
 * uydurulmadı. `isPlaceholder` true olduğu sürece `costTryOf()` `null` döner ve
 * arayüz rakam yerine "fiyat tanımlı değil" gösterir — yanlış bir maliyet
 * basmaktansa hiç basmamak yeğdir. `operation_costs.is_placeholder` ve
 * `legal.entity.*`'ın boş gelmesiyle aynı kalıp.
 *
 * Doldurmak için: sağlayıcının fiyat sayfasındaki USD/1M token değerlerini yaz
 * ve `isPlaceholder`'ı false yap. Başka hiçbir yeri değiştirmek gerekmez.
 */
export const MODEL_RATES: Record<string, ModelRate> = {
  "openai/gpt-oss-120b": {
    inputPerMTok: 0,
    outputPerMTok: 0,
    cachedInputPerMTok: 0,
    isPlaceholder: true,
  },
  "claude-opus-5": {
    inputPerMTok: 0,
    outputPerMTok: 0,
    cachedInputPerMTok: 0,
    isPlaceholder: true,
  },
};

/** `admin_llm_usage_summary` RPC'sinin döndürdüğü satır. */
export type TokenTotals = {
  provider: string;
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
};

/**
 * Toplam API maliyeti (₺) — fiyatı BİLİNMEYEN tek bir model bile varsa `null`.
 *
 * Kısmi toplam döndürmek daha "yardımsever" görünürdü ama yanıltıcı olurdu:
 * eksik bir gider kalemi, raporu olduğundan kârlı gösterir. Ya hepsi ya hiçbiri.
 */
export function costTryOf(rows: TokenTotals[]): number | null {
  if (USD_TRY_RATE.isPlaceholder) return null;

  let usd = 0;
  for (const row of rows) {
    const rate = MODEL_RATES[row.model];
    if (!rate || rate.isPlaceholder) return null;
    usd +=
      (row.inputTokens / 1_000_000) * rate.inputPerMTok +
      (row.outputTokens / 1_000_000) * rate.outputPerMTok +
      (row.cachedInputTokens / 1_000_000) * rate.cachedInputPerMTok;
  }
  return usd * USD_TRY_RATE.value;
}
