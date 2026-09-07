-- Faz 4 — kredi muhasebesi. plan_defaults'un devamı: yer tutucu rakamlar
-- TEK bu tabloda yaşar, kodda tekrarlanmaz. Aşama B'nin turn/review route'ları
-- bu RPC'yi çağırır.

create table public.operation_costs (
  operation      text primary key,
  credits        integer not null check (credits >= 0),
  is_placeholder boolean not null default true
);

insert into public.operation_costs (operation, credits) values
  ('draft_generate', 1),  -- FR-04: ilk AI taslağı
  ('ai_edit', 0),         -- FR-05: AI ile düzenleme — yer tutucu: şimdilik ücretsiz
  ('risk_check', 0),      -- FR-07 — yer tutucu: şimdilik ücretsiz
  ('pdf_generate', 0);    -- FR-08 (Aşama C2'de kullanılacak) — yer tutucu: şimdilik ücretsiz

alter table public.operation_costs enable row level security;
revoke all on public.operation_costs from anon;
grant select on public.operation_costs to authenticated;

create policy operation_costs_select on public.operation_costs for select to authenticated
  using (true);

-- credit_ledger_sign_ck (20260907120100) 'consume' girişlerinde amount < 0
-- şartı koşuyor — bu yüzden maliyeti 0 olan bir işlem defter kaydı YAZMAZ
-- (aksi halde kısıtı ihlal eder). Gerçek rakamlar gelince kod DEĞİŞMEZ,
-- yalnızca bu tablodaki sayı güncellenir.
create or replace function public.consume_credits(
  p_workspace_id uuid,
  p_operation    text,
  p_contract_id  uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cost    integer;
  v_balance integer;
begin
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = (select auth.uid())
      and role in ('admin', 'editor')
  ) then
    raise exception 'consume_credits: yetkisiz';
  end if;

  select credits into v_cost from public.operation_costs where operation = p_operation;
  if v_cost is null then
    raise exception 'consume_credits: bilinmeyen işlem %', p_operation;
  end if;

  if v_cost = 0 then
    return;
  end if;

  select balance into v_balance
  from public.workspace_credits
  where workspace_id = p_workspace_id
  for update;

  if coalesce(v_balance, 0) < v_cost then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_ledger (workspace_id, actor_id, contract_id, entry_type, amount, reason)
  values (p_workspace_id, (select auth.uid()), p_contract_id, 'consume', -v_cost, p_operation);
end $$;

revoke execute on function public.consume_credits(uuid, text, uuid) from public, anon;
grant execute on function public.consume_credits(uuid, text, uuid) to authenticated;
