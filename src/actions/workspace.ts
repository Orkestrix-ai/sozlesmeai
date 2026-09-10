"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { verifySession, ACTIVE_WORKSPACE_COOKIE } from "@/lib/dal";
import { validateWorkspaceName, type FieldErrors } from "@/lib/validation";
import type { AppErrorKey } from "@/lib/i18n-keys";

export type WorkspaceFormState =
  | { fieldErrors?: FieldErrors; formError?: AppErrorKey; success?: boolean }
  | undefined;

const ACTIVE_WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * design.md §7.4 workspace seçici — Türkçe karakterleri elle çevirir (NFKD
 * normalizasyonu ğ/ş/ı/ö/ü/ç'yi ayrıştırmaz, bunlar birleşik aksanlı harfler
 * değil kendi kod noktalarıdır). Kalan a-z0-9 dışı her şey tireye döner.
 * Rastgele son ek slug'ı benzersiz kılar — workspaces.slug unique kısıtı
 * (bkz. types_and_core_tables.sql).
 */
function slugify(name: string): string {
  const turkishMap: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
    ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  const replaced = name.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => turkishMap[ch] ?? ch);
  const stem =
    replaced
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 36) || "workspace";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${stem}-${suffix}`.slice(0, 48);
}

export async function createWorkspaceAction(
  _prev: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const name = String(formData.get("name") ?? "");
  const fieldError = validateWorkspaceName(name);
  if (fieldError) return { fieldErrors: { name: fieldError } };

  const { userId } = await verifySession();
  const supabase = await createClient();
  const slug = slugify(name);

  // `.select().single()` BURADA ZİNCİRLENMEZ: PostgREST bunu INSERT ...
  // RETURNING'e çevirir ve dönen satır workspaces_select RLS politikasına
  // (üyelik üzerinden) göre SÜZÜLÜR — ama üyelik satırını yazan AFTER INSERT
  // trigger'ı (workspaces_add_owner_membership) henüz o denetimin gördüğü
  // snapshot'a girmemiş olur, "new row violates row-level security policy"
  // ile patlar (canlıda yakalandı). Insert'i RETURNING'siz yapıp id'yi AYRI
  // bir sorguda (yeni snapshot, üyelik artık görünür) okumak çözer.
  const { error: insertError } = await supabase
    .from("workspaces")
    .insert({ name: name.trim(), slug, owner_id: userId, is_personal: false });

  if (insertError) {
    console.error("[workspace] createWorkspaceAction insert:", insertError.code, insertError.message);
    return { formError: "generic" };
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("[workspace] createWorkspaceAction fetch:", error?.code, error?.message);
    return { formError: "generic" };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, data.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ACTIVE_WORKSPACE_COOKIE_MAX_AGE,
  });

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Form'a bağlı olmayan doğrudan çağrı — bkz. dashboard/workspace-switcher.tsx
 * (`useTransition` içinde). Çerezdeki değeri kör güvenmek yerine üyeliği
 * doğrular; dal.ts zaten sahte değeri tolere eder ama burada erken keser.
 */
export async function switchWorkspaceAction(workspaceId: string) {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ACTIVE_WORKSPACE_COOKIE_MAX_AGE,
  });

  revalidatePath("/", "layout");
}
