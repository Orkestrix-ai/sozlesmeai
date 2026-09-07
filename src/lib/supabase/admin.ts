import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Service-role istemci — RLS'i ATLAR. Yalnızca güvenilen sunucu kodunda
 * kullanılır: paylaşım bağlantısı (oturumsuz salt-okuma), admin panel
 * yazma işlemleri, onarım araçları. İstemciye asla sızdırılmaz.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
