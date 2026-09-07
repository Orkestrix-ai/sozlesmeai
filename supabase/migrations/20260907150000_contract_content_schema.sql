-- Faz 3 — sözleşme içeriği şeması: tür sözlüğü, sürüm geçmişi, sohbet dökümü,
-- risk bulguları. contracts tablosu (Faz 2) yalnızca metadata taşıyordu;
-- gerçek içerik (AI taslağı, bölümler) BURADAN itibaren var.

create type public.contract_message_role as enum ('user','assistant');
create type public.contract_version_source as enum ('ai_draft','ai_edit','manual');
create type public.finding_severity as enum ('info','warning','error');

-- ── contract_types — PRD FR-03 "en az üç tür" ──────────────────────────────
-- code, mevcut contracts.contract_type'ın ZATEN yazdığı değerlerle birebir
-- (bkz. dashboard.newContract.types i18n anahtarları) — geriye dönük veri
-- kırılmasın diye burada yeni bir adlandırma icat edilmedi.
create table public.contract_types (
  code         text primary key check (code in ('service','nda','freelance')),
  name_key     text not null,        -- messages.dashboard.newContract.types.<code>
  -- FR-04: "taraf, tarih, ödeme, teslim, sorumluluk, fesih gibi alanlar" —
  -- AI'a önerilen bölüm iskeleti. Bağlayıcı değildir, sistem prompt'una
  -- girdi olarak kullanılır; sections jsonb'de farklı anahtarlar da olabilir.
  section_keys text[] not null
);

insert into public.contract_types (code, name_key, section_keys) values
  ('service', 'dashboard.newContract.types.service',
    array['parties','scope','payment','term','termination','liability']),
  ('nda', 'dashboard.newContract.types.nda',
    array['parties','confidential_information','obligations','term','exceptions','remedies']),
  ('freelance', 'dashboard.newContract.types.freelance',
    array['parties','scope','payment','deadlines','ownership','termination']);

alter table public.contracts
  add constraint contracts_contract_type_fkey
  foreign key (contract_type) references public.contract_types(code);

-- ── contract_versions — FR-05 "her sürüm saklanır" ────────────────────────
-- sections şekli src/lib/contracts/schema.ts'te (zod) tek kaynaktır:
--   { key, title, body, status: "draft"|"approved", missing: string[], lastEditedBy: "ai"|"user" }
-- `missing` FR-04'ün "eksik/belirsiz alanlar açıkça işaretlenir" gereğidir —
-- AI bilmediği bir bilgiyi UYDURMAZ, o alanı missing'e yazar.
create table public.contract_versions (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references public.contracts(id) on delete cascade,
  version_no   integer not null check (version_no > 0),
  sections     jsonb not null default '[]'::jsonb,
  source       public.contract_version_source not null,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (contract_id, version_no)
);
create index contract_versions_contract_idx on public.contract_versions (contract_id, version_no desc);

alter table public.contracts
  add column current_version_id uuid references public.contract_versions(id) on delete set null;

-- ── contract_messages — sohbet dökümü ──────────────────────────────────────
create table public.contract_messages (
  id           bigint generated always as identity primary key,
  contract_id  uuid not null references public.contracts(id) on delete cascade,
  role         public.contract_message_role not null,
  content      text not null,
  created_at   timestamptz not null default now()
);
create index contract_messages_contract_idx on public.contract_messages (contract_id, created_at);

-- ── contract_findings — FR-07 risk/tutarlılık kontrolü ────────────────────
-- "Bu kontrol hukuki görüş veya geçerlilik garantisi değildir" (prd.md FR-07) —
-- bu cümle UI'da da AYNEN gösterilir (bkz. messages.dashboard.review).
create table public.contract_findings (
  id           bigint generated always as identity primary key,
  contract_id  uuid not null references public.contracts(id) on delete cascade,
  version_id   uuid references public.contract_versions(id) on delete cascade,
  code         text not null,        -- i18n anahtarı, cümle değil
  severity     public.finding_severity not null,
  section_key  text,
  detail       text not null default '',
  created_at   timestamptz not null default now()
);
create index contract_findings_contract_idx on public.contract_findings (contract_id, created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.contract_types    enable row level security;
alter table public.contract_versions enable row level security;
alter table public.contract_messages enable row level security;
alter table public.contract_findings enable row level security;

revoke all on public.contract_types, public.contract_versions,
  public.contract_messages, public.contract_findings from anon;

grant select on public.contract_types to authenticated;
grant select, insert on public.contract_versions to authenticated;
grant select, insert on public.contract_messages to authenticated;
grant select, insert, delete on public.contract_findings to authenticated;

create policy contract_types_select on public.contract_types for select to authenticated
  using (true);

-- contracts_select politikasıyla aynı zincir: contract_id → contracts.workspace_id
-- → private.workspace_ids_for_current_user(). Yazma admin/editor ile sınırlı
-- (private.current_workspace_role — 20260907120200'de tanımlı, yeniden yazılmaz).
create policy contract_versions_select on public.contract_versions for select to authenticated
  using (contract_id in (
    select id from public.contracts
    where workspace_id in (select private.workspace_ids_for_current_user())
  ));

create policy contract_versions_insert on public.contract_versions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and contract_id in (
      select id from public.contracts
      where private.current_workspace_role(workspace_id) in ('admin','editor')
    )
  );

create policy contract_messages_select on public.contract_messages for select to authenticated
  using (contract_id in (
    select id from public.contracts
    where workspace_id in (select private.workspace_ids_for_current_user())
  ));

create policy contract_messages_insert on public.contract_messages for insert to authenticated
  with check (contract_id in (
    select id from public.contracts
    where private.current_workspace_role(workspace_id) in ('admin','editor')
  ));

create policy contract_findings_select on public.contract_findings for select to authenticated
  using (contract_id in (
    select id from public.contracts
    where workspace_id in (select private.workspace_ids_for_current_user())
  ));

create policy contract_findings_insert on public.contract_findings for insert to authenticated
  with check (contract_id in (
    select id from public.contracts
    where private.current_workspace_role(workspace_id) in ('admin','editor')
  ));

create policy contract_findings_delete on public.contract_findings for delete to authenticated
  using (contract_id in (
    select id from public.contracts
    where private.current_workspace_role(workspace_id) in ('admin','editor')
  ));
