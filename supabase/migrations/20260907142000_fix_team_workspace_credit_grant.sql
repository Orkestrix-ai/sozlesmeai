-- HATA DÜZELTMESİ (canlıda yakalandı, 2026-09-07): workspace switcher'dan
-- "Yeni çalışma alanı" ile bir ekip workspace'i oluşturulduğunda kullanım
-- ölçer "3 / 3 kredi kullanıldı" (kalan: 0) gösteriyordu — workspace hiçbir
-- işlem yapmamışken.
--
-- Kök neden: tg_workspace_add_owner_membership() (handle_new_user()'ın
-- kişisel workspace için yaptığının bir benzeri) admin üyelik + starter
-- abonelik + member_joined aktivitesi yazıyor ama plan_defaults'tan starter
-- kredisini credit_ledger'a GRANT etmiyordu. dal.ts'teki
-- getWorkspaceContext() `used = monthlyAllowance - balance` hesabı bu
-- yüzden balance=0'ı "tamamı harcandı" gibi gösteriyordu.
--
-- Fix: kredi grant'i BURAYA taşındı (handle_new_user()'dan çıkarıldı) —
-- bu trigger zaten HER workspace insert'inde (kişisel signup dahil) çalışıyor,
-- iki ayrı yerde aynı işi yapmak kişisel workspace'e ÇİFT kredi yazardı.
-- Tek kaynak yine plan_defaults, miktar kodda tekrarlanmaz.

create or replace function public.tg_workspace_add_owner_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_credits integer;
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict do nothing;
  insert into public.subscriptions (workspace_id, plan, status)
  values (new.id, 'starter', 'active') on conflict (workspace_id) do nothing;
  insert into public.workspace_activity (workspace_id, actor_id, kind)
  values (new.id, new.owner_id, 'member_joined');

  select monthly_credits into v_credits from public.plan_defaults where plan = 'starter';
  if coalesce(v_credits, 0) > 0 then
    insert into public.credit_ledger (workspace_id, actor_id, entry_type, amount, reason)
    values (new.id, new.owner_id, 'grant', v_credits, 'signup_starter_grant');
  end if;

  return new;
end $$;
revoke execute on function public.tg_workspace_add_owner_membership() from public, anon, authenticated;

-- handle_new_user()'daki kendi credit_ledger insert'i kaldırılıyor — artık
-- yukarıdaki trigger, kişisel workspace insert'i için de aynı işi yapıyor.
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
begin
  v_full_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );
  v_locale := coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'tr');
  if v_locale not in ('tr','en') then v_locale := 'tr'; end if;

  insert into public.profiles (id, email, full_name, locale)
  values (new.id, new.email, v_full_name, v_locale);

  -- Bu insert, workspaces_add_owner_membership trigger'ını tetikler:
  -- admin üyelik + starter abonelik + member_joined aktivitesi + starter
  -- kredi grant'i ORADA yazılır (bkz. yukarısı).
  insert into public.workspaces (name, slug, owner_id, is_personal)
  values (v_full_name, 'ws-' || replace(new.id::text, '-', ''), new.id, true)
  returning id into v_workspace_id;

  raise log 'handle_new_user: bootstrapped user=% workspace=%', new.id, v_workspace_id;
  return new;
  -- BİLEREK: exception when others yok. Bootstrap düşerse signup gürültülü
  -- şekilde başarısız olmalı, öksüz auth.users satırı bırakmamalı. Hata
  -- ayıklama: Supabase MCP query_logs.
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
