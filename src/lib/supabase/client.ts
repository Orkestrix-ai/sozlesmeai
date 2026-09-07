import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/**
 * Tarayıcı tarafı Supabase istemcisi (Client Component'lerde kullanılır).
 * Yalnızca `NEXT_PUBLIC_` önekli, tarayıcıya güvenle sızabilecek değerleri okur.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
