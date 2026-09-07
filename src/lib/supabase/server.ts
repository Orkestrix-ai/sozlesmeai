import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/**
 * Sunucu tarafı Supabase istemcisi (Server Component, Server Action,
 * Route Handler). `cookies()` Next.js 16'da asenkrondur.
 *
 * Server Component içinden çağrıldığında `setAll` sessizce başarısız olur
 * (Next.js render sırasında çerez yazımına izin vermez) — bu BEKLENEN bir
 * davranıştır: oturum tazeleme `src/proxy.ts`'de zaten yapılıyor. Yazma
 * gerektiren akışlar (login/logout/tazeleme) Server Action veya Route
 * Handler içinde çalışmalı.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component render'ı sırasında çağrıldıysa yazma
            // başarısız olur; proxy.ts oturumu zaten tazeliyor.
          }
        },
      },
    },
  );
}
