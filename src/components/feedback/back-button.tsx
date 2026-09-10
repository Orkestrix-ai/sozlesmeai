"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

// Geçmiş uzunluğu değişmez bir abonelik değil, salt okunan bir dış değer;
// `useSyncExternalStore` burada yalnızca "istemcide senkron oku, sunucu
// snapshot'ı sırasında `false` varsay" için kullanılıyor — `useEffect` içinde
// `setState` çağırıp render'ı tetiklemek yerine (react-hooks/set-state-in-effect).
function getCanGoBackSnapshot() {
  return window.history.length > 1;
}
function getServerSnapshot() {
  return false;
}
function subscribe() {
  return () => {};
}

/**
 * "Önceki sayfaya git" — tarayıcı geçmişine döner. Kullanıcı bozuk bağlantıya
 * doğrudan geldiyse (yeni sekme, yer imi, dıştan gelen link) geçmiş yoktur;
 * bu durumda buton hiç RENDER EDİLMEZ — çalışmayan bir buton göstermek hata
 * sayfasında ikinci bir hata demektir (bkz. plan §3).
 *
 * `next-intl`'in kendi `useRouter` sarmalayıcısı yerine `next/navigation`
 * kullanılır: `back()` yalnızca tarayıcı geçmişinde gezinir, locale ile
 * ilgisi yoktur.
 */
function BackButton({ label }: { label: string }) {
  const router = useRouter();
  const canGoBack = useSyncExternalStore(subscribe, getCanGoBackSnapshot, getServerSnapshot);

  if (!canGoBack) {
    return null;
  }

  return (
    <Button variant="secondary" onClick={() => router.back()}>
      {label}
    </Button>
  );
}

export { BackButton };
