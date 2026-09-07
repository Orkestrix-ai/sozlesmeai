-- Faz 4 — paylaşım bağlantısı. E-posta sağlayıcısı yapılandırılmadığı için
-- (bkz. plan "Riskler") akış "bağlantıyı kopyala" temelli. Herkese açık
-- /[locale]/s/[token] rotası oturum GEREKTİRMEZ — doğrulama service-role ile
-- yapılır (bkz. src/lib/supabase/admin.ts), bu yüzden anon'a hiçbir RLS
-- erişimi açılmaz; token'ın kendisi tek "yetki" kanıtıdır.

create table public.contract_shares (
  id          uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  token       text not null unique check (char_length(token) >= 16),
  created_by  uuid references auth.users(id) on delete set null,
  expires_at  timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index contract_shares_contract_idx on public.contract_shares (contract_id);
-- Aktif (iptal edilmemiş) bağlantıların token'a göre hızlı arandığı yer
-- yalnızca herkese açık sayfa route'udur ve o service-role kullanır — RLS'e
-- tabi değildir, bu yüzden burada anon için ayrıca bir select politikası YOK.
create index contract_shares_active_token_idx on public.contract_shares (token) where revoked_at is null;

alter table public.contract_shares enable row level security;
revoke all on public.contract_shares from anon;
grant select, insert, update on public.contract_shares to authenticated;

-- Yalnızca workspace üyeleri KENDİ sözleşmelerinin paylaşım bağlantılarını
-- yönetebilir (liste + iptal). Herkese açık görüntüleme bu politikalardan
-- BAĞIMSIZDIR (service-role RLS'i tamamen atlar).
create policy contract_shares_select on public.contract_shares for select to authenticated
  using (contract_id in (
    select id from public.contracts
    where workspace_id in (select private.workspace_ids_for_current_user())
  ));

create policy contract_shares_insert on public.contract_shares for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and contract_id in (
      select id from public.contracts
      where private.current_workspace_role(workspace_id) in ('admin', 'editor')
    )
  );

-- update yalnızca iptal (revoked_at) içindir; token/contract_id değişmez —
-- bunu bir CHECK yerine uygulama katmanında (yalnızca revoked_at set eden
-- tek bir Server Action) disipliniyle sağlıyoruz, mevcut kod tabanındaki
-- diğer "tek amaçlı update" politikalarıyla aynı desen.
create policy contract_shares_update on public.contract_shares for update to authenticated
  using (contract_id in (
    select id from public.contracts
    where private.current_workspace_role(workspace_id) in ('admin', 'editor')
  ))
  with check (contract_id in (
    select id from public.contracts
    where private.current_workspace_role(workspace_id) in ('admin', 'editor')
  ));
