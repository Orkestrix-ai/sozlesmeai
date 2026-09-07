-- Kayıt anındaki bootstrap: yeni kullanıcı → profil + kişisel workspace +
-- admin üyelik + starter abonelik + yer tutucu kredi + aktivite kaydı.
--
-- Trigger seçildi, server action değil: e-posta doğrulama açıkken signUp()
-- oturum döndürmez (auth.uid() yok), bu yüzden bir server action ancak
-- SUPABASE_SERVICE_ROLE_KEY ile RLS'i atlayarak yazabilirdi — herhangi bir
-- anonim ziyaretçinin formu göndererek tetikleyebildiği bir yolda RLS bypass'ı
-- kabul edilemez bir risktir. Trigger ise auth.users insert'iyle AYNI
-- transaction'da çalışır: bootstrap düşerse kullanıcı hiç oluşmaz, öksüz satır
-- kalmaz.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name    text;
  v_locale       text;
  v_workspace_id uuid;
  v_credits      integer;
begin
  v_full_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );
  v_locale := coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'tr');
  if v_locale not in ('tr','en') then v_locale := 'tr'; end if;

  insert into public.profiles (id, email, full_name, locale)
  values (new.id, new.email, v_full_name, v_locale);

  insert into public.workspaces (name, slug, owner_id, is_personal)
  values (v_full_name, 'ws-' || replace(new.id::text, '-', ''), new.id, true)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, new.id, 'admin');

  insert into public.subscriptions (workspace_id, plan, status)
  values (v_workspace_id, 'starter', 'active');

  -- YER TUTUCU kredi. Miktar public.plan_defaults'tan okunur; kodda TEKRARLANMAZ.
  select monthly_credits into v_credits from public.plan_defaults where plan = 'starter';
  if coalesce(v_credits, 0) > 0 then
    insert into public.credit_ledger (workspace_id, actor_id, entry_type, amount, reason)
    values (v_workspace_id, new.id, 'grant', v_credits, 'signup_starter_grant');
  end if;

  insert into public.workspace_activity (workspace_id, actor_id, kind, is_important)
  values (v_workspace_id, new.id, 'member_joined', false);

  raise log 'handle_new_user: bootstrapped user=% workspace=%', new.id, v_workspace_id;
  return new;
  -- BİLEREK: exception when others yok. Bootstrap düşerse signup gürültülü
  -- şekilde başarısız olmalı, öksüz auth.users satırı bırakmamalı. Hata
  -- ayıklama: Supabase MCP query_logs({ service: "postgres" }).
end $$;

-- ADVİSOR DÜZELTMESİ: fonksiyon /rest/v1/rpc/ üzerinden çağrılamaz olmalı.
-- Trigger tetiklenmesi EXECUTE yetkisini yeniden kontrol etmez; revoke güvenlidir.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ek workspace oluşturulduğunda kurucusunu admin olarak ekler
-- (workspaces_insert RLS politikası is_personal=false şartıyla buna izin verir).
create or replace function public.tg_workspace_add_owner_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict do nothing;
  insert into public.subscriptions (workspace_id, plan, status)
  values (new.id, 'starter', 'active') on conflict (workspace_id) do nothing;
  insert into public.workspace_activity (workspace_id, actor_id, kind)
  values (new.id, new.owner_id, 'member_joined');
  return new;
end $$;
revoke execute on function public.tg_workspace_add_owner_membership() from public, anon, authenticated;

create trigger workspaces_add_owner_membership
  after insert on public.workspaces
  for each row execute function public.tg_workspace_add_owner_membership();

-- Kullanıcı e-postasını güncellediğinde profiles ile senkron kalır.
create or replace function public.tg_sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;
revoke execute on function public.tg_sync_profile_email() from public, anon, authenticated;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.tg_sync_profile_email();

-- Onarım aracı (yalnızca postgres/service_role): trigger sessizce atlarsa
-- kişisel workspace'i bulup döndürür, bulamazsa açıkça hata verir.
create or replace function public.ensure_user_bootstrap(p_user_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_ws uuid;
begin
  select wm.workspace_id into v_ws
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id
  where wm.user_id = p_user_id and w.is_personal limit 1;
  if v_ws is not null then return v_ws; end if;
  raise exception 'ensure_user_bootstrap: kişisel workspace bulunamadı (user=%)', p_user_id;
end $$;
revoke execute on function public.ensure_user_bootstrap(uuid) from public, anon, authenticated;
