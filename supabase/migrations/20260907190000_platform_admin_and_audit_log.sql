-- Faz 5 — platform admin kavramı ve audit log (design.md §9, plan D1).
--
-- Adminlerin RLS üzerinden iş tablolarına YAZMA yetkisi YOK, yalnızca SELECT.
-- Kritik yazma aksiyonları (kredi ekleme vb.) service-role Server Action'dan
-- yapılır; her çağrı önce is_platform_admin()'i doğrular, sonra
-- admin_audit_log'a bir satır yazar — bu ikisi UYGULAMA KODUNDA birlikte
-- garanti edilir (service-role RLS'i tamamen atladığı için burada bir "yazma
-- politikası" tanımlamanın anlamı yok).

create table public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon;
grant select on public.platform_admins to authenticated;

-- Bir kullanıcı yalnızca KENDİ admin durumunu görebilir (tüm admin listesini
-- değil) — UI/Server Action kapısı için bu yeterli.
create policy platform_admins_select_self on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function private.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins where user_id = (select auth.uid())
  );
$$;
grant execute on function private.is_platform_admin() to authenticated;

-- ── admin_audit_log ─────────────────────────────────────────────────────────
-- "Audit log ekranlarında zaman, aktör, işlem ve kaynak ayrı kolonlar" (§9).
create table public.admin_audit_log (
  id            bigint generated always as identity primary key,
  actor_id      uuid references auth.users(id) on delete set null,
  action        text not null,
  resource_type text not null,
  resource_id   text,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon;
grant select on public.admin_audit_log to authenticated;
-- INSERT politikası YOK: satırlar yalnızca service-role Server Action'larından
-- (RLS'i atlayarak) yazılır — admin ekranından bile doğrudan yazılamaz.

create policy admin_audit_log_select on public.admin_audit_log for select to authenticated
  using (private.is_platform_admin());

-- ── Admin SELECT politikaları (yalnızca okuma) ─────────────────────────────
create policy admin_read_profiles on public.profiles for select to authenticated
  using (private.is_platform_admin());

create policy admin_read_workspaces on public.workspaces for select to authenticated
  using (private.is_platform_admin());

create policy admin_read_workspace_members on public.workspace_members for select to authenticated
  using (private.is_platform_admin());

create policy admin_read_subscriptions on public.subscriptions for select to authenticated
  using (private.is_platform_admin());

create policy admin_read_workspace_credits on public.workspace_credits for select to authenticated
  using (private.is_platform_admin());

create policy admin_read_credit_ledger on public.credit_ledger for select to authenticated
  using (private.is_platform_admin());

create policy admin_read_contracts on public.contracts for select to authenticated
  using (private.is_platform_admin());
