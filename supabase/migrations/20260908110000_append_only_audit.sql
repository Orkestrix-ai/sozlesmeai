-- Güvenlik sertleştirmesi 2/5 — denetim izi: credit_ledger, workspace_activity,
-- admin_audit_log MÜDAHALE EDİLEMEZ (append-only) hale getirilir.
--
-- Bugüne kadar bu üç tabloda UPDATE/DELETE'i engelleyen HİÇBİR ŞEY yoktu.
-- "Yazma politikası yok" ≠ "değiştirilemez": RLS yazma politikasının
-- eksikliği yalnızca `authenticated`'i durdurur; `service_role` RLS'i
-- TAMAMEN ATLAR ve tam grant'e sahiptir. Uygulamanın kendi service-role
-- anahtarı (veya onu ele geçiren biri) bugün bu tabloları sessizce
-- yeniden yazabilirdi. Bu migration hem grant hem tetikleyici seviyesinde
-- kapatır — tetikleyiciler service_role için de ateşlenir (yalnızca
-- `session_replication_role = 'replica'` atlar, o da superuser gerektirir).

-- ── Ön koşul: FK temizliği ──────────────────────────────────────────────
-- Append-only bir tetikleyici eklemeden önce, SİLME akışlarının bu
-- tabloları DOLAYLI olarak değiştirmesi kapatılmalı. Aksi halde bugün zaten
-- açık olan `contracts_delete_admin` politikasıyla bir sözleşme silmek,
-- credit_ledger.contract_id'yi `set null` yapmaya çalışır ve doğrudan
-- append-only tetikleyicisine çarpar (silme başarısız olur, kafası karışık
-- bir hata döner). Kalıcı defterin zaten silinmiş bir varlık yüzünden
-- yeniden yazılmaması gerekir; kolonlar düz uuid olarak kalır.
alter table public.credit_ledger   drop constraint credit_ledger_actor_id_fkey;
alter table public.credit_ledger   drop constraint credit_ledger_contract_id_fkey;
alter table public.admin_audit_log drop constraint admin_audit_log_actor_id_fkey;
alter table public.workspace_activity drop constraint workspace_activity_actor_id_fkey;

-- workspace_activity_actor_id_profiles_fkey KORUNUR: src/lib/dal.ts'teki
-- getWorkspaceActivity() PostgREST embed'i (profiles(full_name)) buna
-- bağlıdır. Yalnızca `set null` → `restrict`'e çevrilir ki bir profil
-- silinmeye çalışıldığında satır sessizce güncellenmesin, silme reddedilsin.
alter table public.workspace_activity
  drop constraint workspace_activity_actor_id_profiles_fkey,
  add  constraint workspace_activity_actor_id_profiles_fkey
    foreign key (actor_id) references public.profiles(id) on delete restrict;

-- Workspace silinirse defter/aktivite artık CASCADE ile silinemez —
-- mali/denetim geçmişi bir workspace'in varlığından bağımsız kalıcıdır.
-- (Faz 2 kapsamında zaten workspace DELETE politikası yok; bu, ileride
-- eklenirse davranışı baştan doğru tanımlar.)
alter table public.credit_ledger
  drop constraint credit_ledger_workspace_id_fkey,
  add  constraint credit_ledger_workspace_id_fkey
    foreign key (workspace_id) references public.workspaces(id) on delete restrict;
alter table public.workspace_activity
  drop constraint workspace_activity_workspace_id_fkey,
  add  constraint workspace_activity_workspace_id_fkey
    foreign key (workspace_id) references public.workspaces(id) on delete restrict;

-- ── Append-only tetikleyicisi ────────────────────────────────────────────
-- STATEMENT seviyesinde (satır değil): 0 satır etkileyen bir UPDATE/DELETE
-- bile reddedilir, "hiçbir şeyi değiştirmedim" savunması geçersiz.
create or replace function private.tg_append_only()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'append_only'
    using errcode = '42501',
          detail  = format('%s.%s: %s engellendi (append-only tablo)',
                           tg_table_schema, tg_table_name, tg_op);
end $$;
revoke execute on function private.tg_append_only() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['credit_ledger', 'workspace_activity', 'admin_audit_log'] loop
    execute format(
      'create trigger %I_append_only before update or delete on public.%I
         for each statement execute function private.tg_append_only()', t, t);
    execute format(
      'create trigger %I_no_truncate before truncate on public.%I
         for each statement execute function private.tg_append_only()', t, t);
  end loop;
end $$;

-- Grant seviyesinde de kapat — tetikleyici son savunma hattı olarak kalsın,
-- ama sıradan bir authenticated/anon çağrısı daha en baştan reddedilsin.
revoke update, delete, truncate on public.credit_ledger,
       public.workspace_activity, public.admin_audit_log from authenticated, anon;
