import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";

type RecordedCookie = { name: string; value: string; options: CookieOptions };

/**
 * Oturumu yeniler ve YANITA YAZILMASI GEREKEN çerezleri geri döndürür.
 * Yanıtı KENDİSİ oluşturmaz — çünkü yanıtı next-intl üretecek (bkz. src/proxy.ts).
 *
 * next-intl'in kendi yönlendirme/rewrite yanıtını üretmesinden ÖNCE ve SONRA
 * çalışacak şekilde bölünmüş: burada isteği güncelliyoruz ve çerezleri
 * kaydediyoruz; intl yanıtını kurduktan sonra src/proxy.ts bu çerezleri o
 * yanıta basıyor. Supabase'in kendi "yanıtı setAll içinde yeniden kur" kalıbı
 * burada KULLANILAMAZ — o yanıt intl kendi yanıtını kurunca çöpe gider ve
 * tazelenmiş auth çerezi tarayıcıya hiç ulaşmaz (rastgele oturum düşmeleri).
 */
export async function refreshSession(request: NextRequest) {
  const recorded: RecordedCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // (a) İsteği güncelle → downstream RSC aynı token'ı tekrar yenilemesin.
            request.cookies.set(name, value);
            // (b) Kaydet → next-intl'in yanıtına sonra basılacak.
            recorded.push({ name, value, options: options ?? {} });
          });
        },
      },
    },
  );

  // createServerClient ile getClaims() ARASINA KOD YAZMAYIN.
  const { data } = await supabase.auth.getClaims();

  return { claims: data?.claims ?? null, cookiesToSet: recorded };
}
