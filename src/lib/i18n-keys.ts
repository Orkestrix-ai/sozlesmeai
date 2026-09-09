import type { Messages } from "next-intl";

/**
 * `global.d.ts`teki `AppConfig` augmentation'ı sayesinde `Messages`,
 * `messages/tr.json`'ın şeklidir. Bu dosya, "i18n anahtarı taşıyan" değerlerin
 * (doğrulama sonuçları, hata kodları) tipini o şemaya bağlar — böylece
 * kaldırılan bir anahtar `tsc` hatası verir, runtime `MISSING_MESSAGE` değil.
 *
 * Yalnızca string değerli anahtarlar alınır: `errors.page` gibi iç içe
 * nesneler `t()` ile doğrudan çevrilemez.
 */
type StringKeysOf<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

/** `messages/*.json` → `validation.*` */
export type ValidationKey = StringKeysOf<Messages["validation"]>;

/** `messages/*.json` → `auth.errors.*` */
export type AuthErrorKey = StringKeysOf<Messages["auth"]["errors"]>;

/** `messages/*.json` → `errors.*` (iç içe `errors.page` hariç) */
export type AppErrorKey = StringKeysOf<Messages["errors"]>;
