-- HATA DÜZELTMESİ (canlıda yakalandı, 2026-09-07): handle_new_user() gerçek
-- bir kayıtta her zaman "duplicate key value violates unique constraint
-- workspace_members_pkey" ile patlıyordu.
--
-- Kök neden: handle_new_user() içindeki `insert into public.workspaces`
-- satırı, AYNI migration dosyasındaki workspaces_add_owner_membership
-- trigger'ını (tg_workspace_add_owner_membership, "after insert on
-- public.workspaces") tetikler — o trigger workspace_members, subscriptions
-- ve workspace_activity satırlarını ZATEN yazar. handle_new_user() bu üçünü
-- bir daha elle eklemeye çalışınca workspace_members'ın (workspace_id,
-- user_id) birincil anahtarı ikinci kez ihlal ediliyordu.
--
-- Fix: handle_new_user()'daki tekrarlanan üç insert kaldırıldı; tek gerçek
-- kaynak artık workspaces_add_owner_membership trigger'ı. credit_ledger
-- kaydı (bu trigger'da YOK) olduğu gibi kalır.

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

  -- Bu insert, workspaces_add_owner_membership trigger'ını tetikler:
  -- admin üyelik + starter abonelik + member_joined aktivitesi ORADA yazılır.
  insert into public.workspaces (name, slug, owner_id, is_personal)
  values (v_full_name, 'ws-' || replace(new.id::text, '-', ''), new.id, true)
  returning id into v_workspace_id;

  -- YER TUTUCU kredi. Miktar public.plan_defaults'tan okunur; kodda TEKRARLANMAZ.
  select monthly_credits into v_credits from public.plan_defaults where plan = 'starter';
  if coalesce(v_credits, 0) > 0 then
    insert into public.credit_ledger (workspace_id, actor_id, entry_type, amount, reason)
    values (v_workspace_id, new.id, 'grant', v_credits, 'signup_starter_grant');
  end if;

  raise log 'handle_new_user: bootstrapped user=% workspace=%', new.id, v_workspace_id;
  return new;
  -- BİLEREK: exception when others yok. Bootstrap düşerse signup gürültülü
  -- şekilde başarısız olmalı, öksüz auth.users satırı bırakmamalı. Hata
  -- ayıklama: Supabase MCP query_logs.
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
