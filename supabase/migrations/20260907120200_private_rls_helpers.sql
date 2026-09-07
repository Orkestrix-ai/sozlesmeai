-- RLS özyineleme tuzağının çözümü: yardımcı fonksiyonlar PostgREST'e AÇILMAYAN
-- `private` şemasında, SECURITY DEFINER olarak tanımlanır.
--
-- Neden gerekli: workspace_members üzerindeki bir SELECT politikası doğrudan
-- workspace_members'ı sorgularsa (`workspace_id in (select ... from workspace_members
-- where user_id = auth.uid())`), Postgres'in politika değerlendirmesi aynı
-- politikayı tekrar tetikler → 42P17 infinite recursion. SECURITY DEFINER
-- fonksiyon hedef tablodaki RLS'i atlayarak bu döngüyü kırar.
--
-- `private` şeması Dashboard → API → Exposed schemas listesinde YOKTUR, yani
-- bu fonksiyonlar /rest/v1/rpc/ üzerinden çağrılamaz. Bu, projede zaten açık
-- olan advisor uyarısının (anon/authenticated security definer fonksiyonu
-- rpc üzerinden çağrılabilir) kontrol ettiği tam senaryoyu önler.

create schema if not exists private;
revoke all on schema private from public, anon;

-- 1) Kullanıcının üyesi olduğu workspace id'leri.
create or replace function private.workspace_ids_for_current_user()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select wm.workspace_id
  from public.workspace_members wm
  where wm.user_id = (select auth.uid());
$$;

-- 2) Belirli bir workspace'teki rolü.
create or replace function private.current_workspace_role(p_workspace_id uuid)
returns public.workspace_role
language sql stable security definer set search_path = ''
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = (select auth.uid());
$$;

-- 3) Admin kısayolu.
create or replace function private.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role = 'admin'
  );
$$;

-- 4) Aynı workspace'i paylaştığım kullanıcılar (profiles politikası için).
create or replace function private.coworker_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select distinct wm.user_id
  from public.workspace_members wm
  where wm.workspace_id in (
    select wm2.workspace_id
    from public.workspace_members wm2
    where wm2.user_id = (select auth.uid())
  );
$$;

-- ── Yetkiler ───────────────────────────────────────────────────────────────
-- anon ve public HİÇBİR şey alamaz.
revoke all on all functions in schema private from public, anon;
-- authenticated USAGE+EXECUTE almalı: RLS politikası içinden çağrılan fonksiyon,
-- sorguyu çalıştıran rolün EXECUTE yetkisini gerektirir. Bu grant, private
-- şeması API'ye açık OLMADIĞI için yeni bir uç nokta yaratmaz — fonksiyonlar
-- zaten yalnızca çağıranın kendi verisini döndürür.
grant usage on schema private to authenticated;
grant execute on function private.workspace_ids_for_current_user()      to authenticated;
grant execute on function private.current_workspace_role(uuid)          to authenticated;
grant execute on function private.is_workspace_admin(uuid)              to authenticated;
grant execute on function private.coworker_ids()                        to authenticated;
