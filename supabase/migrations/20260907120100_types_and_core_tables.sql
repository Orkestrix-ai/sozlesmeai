-- Faz 2 — workspace merkezli çekirdek şema.
-- Enum'lar, tablolar, indeksler, kredi defteri/bakiye trigger'ları.
-- RLS ve yetkiler ayrı migration'da (20260907120300); signup bootstrap ayrı (20260907120400).

-- ── Enum'lar ───────────────────────────────────────────────────────────────
create type public.workspace_role      as enum ('admin','editor','viewer');   -- design.md §7.4
create type public.plan_tier           as enum ('starter','pro','business');  -- prd.md geçerli adlandırma
create type public.subscription_status as enum ('trialing','active','past_due','canceled');
-- Aşağıdaki değerler src/components/ui/status-badge.tsx varyantlarıyla BİREBİR aynıdır.
create type public.contract_status     as enum ('draft','review','ready','shared','error');
create type public.credit_entry_type   as enum ('grant','consume','refund','adjustment');
create type public.activity_kind       as enum ('member_joined','contract_created',
                                                'contract_status_changed','plan_changed',
                                                'credits_granted','credits_consumed');

-- ── profiles ───────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,                    -- §7.4 üye listesi auth.users'ı okuyamaz; denormalize
  full_name   text not null default '',
  locale      text not null default 'tr' check (locale in ('tr','en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── workspaces ─────────────────────────────────────────────────────────────
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,47}$'),
  owner_id    uuid not null references auth.users(id) on delete restrict,
  is_personal boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index workspaces_owner_id_idx on public.workspaces (owner_id);

-- ── workspace_members ──────────────────────────────────────────────────────
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id)       on delete cascade,
  role         public.workspace_role not null default 'viewer',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
-- (workspace_id, user_id) PK soldan indeksli; ters yön için ayrı indeks şart:
create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- ── plan_defaults — TEK YER TUTUCU KAYNAK ─────────────────────────────────
create table public.plan_defaults (
  plan            public.plan_tier primary key,
  monthly_credits integer not null check (monthly_credits >= 0),
  seat_limit      integer,                          -- null = sınırsız
  is_placeholder  boolean not null default true
);

-- ── subscriptions (workspace başına) ──────────────────────────────────────
create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null unique references public.workspaces(id) on delete cascade,
  plan                 public.plan_tier           not null default 'starter',
  status               public.subscription_status not null default 'active',
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end   timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  cancel_at_period_end boolean not null default false,
  -- Ödeme sağlayıcısı Faz 4; alanlar şimdilik boş kalır.
  provider                 text,
  provider_customer_id     text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── contracts (yalnızca metadata; içerik Faz 3) ───────────────────────────
create table public.contracts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  created_by    uuid references auth.users(id) on delete set null,
  title         text not null default '',
  contract_type text,                                   -- Faz 3'te lookup/enum olacak
  status        public.contract_status not null default 'draft',
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index contracts_ws_status_idx  on public.contracts (workspace_id, status);
create index contracts_ws_updated_idx on public.contracts (workspace_id, updated_at desc);
create index contracts_ws_archived_idx on public.contracts (workspace_id, archived_at)
  where archived_at is not null;
create index contracts_created_by_idx on public.contracts (created_by);

-- ── kredi: defter (kaynak) + bakiye (türetilmiş) ──────────────────────────
create table public.credit_ledger (
  id           bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id     uuid references auth.users(id) on delete set null,
  contract_id  uuid references public.contracts(id) on delete set null,
  entry_type   public.credit_entry_type not null,
  amount       integer not null check (amount <> 0),   -- grant/refund: +, consume: −
  reason       text not null,                          -- i18n ANAHTARI, cümle değil
  created_at   timestamptz not null default now(),
  constraint credit_ledger_sign_ck check (
    (entry_type = 'consume' and amount < 0) or
    (entry_type in ('grant','refund') and amount > 0) or
    (entry_type = 'adjustment')
  )
);
create index credit_ledger_ws_created_idx on public.credit_ledger (workspace_id, created_at desc);
create index credit_ledger_actor_idx      on public.credit_ledger (actor_id);
create index credit_ledger_contract_idx   on public.credit_ledger (contract_id);

create table public.workspace_credits (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  balance      integer not null default 0,
  updated_at   timestamptz not null default now()
);

-- Defter tek gerçek kaynak; bakiye trigger ile materyalize edilir.
create or replace function public.tg_credit_ledger_apply()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_credits (workspace_id, balance, updated_at)
  values (new.workspace_id, new.amount, now())
  on conflict (workspace_id) do update
    set balance = public.workspace_credits.balance + excluded.balance,
        updated_at = now();
  return new;
end $$;
revoke execute on function public.tg_credit_ledger_apply() from public, anon, authenticated;

create trigger credit_ledger_apply_balance
  after insert on public.credit_ledger
  for each row execute function public.tg_credit_ledger_apply();

-- Mutabakat/onarım (yalnızca postgres & service_role).
create or replace function public.recompute_workspace_credits(p_workspace_id uuid)
returns integer language sql security definer set search_path = '' as $$
  insert into public.workspace_credits (workspace_id, balance, updated_at)
  select p_workspace_id, coalesce(sum(amount), 0), now()
  from public.credit_ledger where workspace_id = p_workspace_id
  on conflict (workspace_id) do update
    set balance = excluded.balance, updated_at = now()
  returning balance;
$$;
revoke execute on function public.recompute_workspace_credits(uuid) from public, anon, authenticated;

-- ── workspace_activity (§7.4 ekip aktivite akışı) ─────────────────────────
create table public.workspace_activity (
  id           bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id     uuid references auth.users(id) on delete set null,
  kind         public.activity_kind not null,
  subject_id   uuid,
  metadata     jsonb not null default '{}'::jsonb,
  -- design.md §7.4: "kırmızı yalnızca önemli aksiyonlarda". Tasarım kuralı = kolon.
  is_important boolean not null default false,
  created_at   timestamptz not null default now()
);
create index workspace_activity_ws_created_idx on public.workspace_activity (workspace_id, created_at desc);
create index workspace_activity_actor_idx      on public.workspace_activity (actor_id);

-- updated_at bakımı
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger touch_profiles      before update on public.profiles      for each row execute function public.tg_touch_updated_at();
create trigger touch_workspaces    before update on public.workspaces    for each row execute function public.tg_touch_updated_at();
create trigger touch_subscriptions before update on public.subscriptions for each row execute function public.tg_touch_updated_at();
create trigger touch_contracts     before update on public.contracts     for each row execute function public.tg_touch_updated_at();
