/**
 * Marka işareti (chevron-S). Kaynak lockup `brand/sozlesmeai-logo.png`;
 * buradaki yol o rasterdan vektörleştirildi (iki kapalı poligon, delik yok —
 * bu yüzden fill-rule'a gerek yok).
 *
 * `currentColor` ile boyanır: koyu yüzeyde (ink-950 navbar/footer/sidebar)
 * paper-50, açık yüzeyde ink-950 olarak aynı bileşen kullanılır. Yükseklik
 * verilir, genişlik oranla gelir — en/boy 315:269 ≈ 1.17:1.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 315 269"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M139 90L196 90L261 137L315 179L191 269L0 269L66 218L193 218L240 182L126 100L139 90Z M135 0L299 0L237 48L150 48L81 99L194 178L179 190L123 189L0 100L135 0Z" />
    </svg>
  );
}
