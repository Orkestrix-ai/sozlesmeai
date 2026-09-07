-- Grants ve RLS aynı migration'da: grant HANGİ ROLÜN nesneye dokunabileceğini,
-- RLS HANGİ SATIRLARI görebileceğini belirler; ikisi birlikte tam yetki resmini verir.

alter table public.profiles           enable row level security;
alter table public.workspaces         enable row level security;
alter table public.workspace_members  enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.plan_defaults      enable row level security;
alter table public.contracts          enable row level security;
alter table public.credit_ledger      enable row level security;
alter table public.workspace_credits  enable row level security;
alter table public.workspace_activity enable row level security;

-- Varsayılan: anon hiçbir tabloya erişemez.
revoke all on all tables in schema public from anon;

grant select                         on public.profiles           to authenticated;
grant update                         on public.profiles           to authenticated;
grant select                         on public.workspaces         to authenticated;
grant insert                         on public.workspaces         to authenticated;
grant update                         on public.workspaces         to authenticated;
grant select                         on public.workspace_members  to authenticated;
grant select                         on public.subscriptions      to authenticated;
grant select                         on public.plan_defaults      to authenticated;
grant select, insert, update, delete on public.contracts          to authenticated;
grant select                         on public.credit_ledger      to authenticated;
grant select                         on public.workspace_credits  to authenticated;
grant select                         on public.workspace_activity to authenticated;

-- ── profiles ───────────────────────────────────────────────────────────────
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or id in (select private.coworker_ids()));

create policy profiles_update_self on public.profiles for update to authenticated
  using      (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- INSERT/DELETE politikası YOK: satırlar yalnızca signup trigger'ından doğar.

-- ── workspaces ─────────────────────────────────────────────────────────────
create policy workspaces_select on public.workspaces for select to authenticated
  using (id in (select private.workspace_ids_for_current_user()));

-- Ek workspace oluşturma (§7.4 workspace seçici anlamlı olsun diye).
-- Üyelik satırını AFTER INSERT trigger'ı ekler; aksi halde oluşturan kullanıcı
-- kendi yarattığı workspace'i göremez.
create policy workspaces_insert on public.workspaces for insert to authenticated
  with check (owner_id = (select auth.uid()) and is_personal = false);

create policy workspaces_update_admin on public.workspaces for update to authenticated
  using      (private.is_workspace_admin(id))
  with check (private.is_workspace_admin(id));
-- DELETE politikası YOK (Faz 2 kapsamı dışı).

-- ── workspace_members ── RECURSION'IN KIRILDIĞI YER ───────────────────────
create policy workspace_members_select on public.workspace_members for select to authenticated
  using (workspace_id in (select private.workspace_ids_for_current_user()));
-- INSERT/UPDATE/DELETE politikası YOK.
-- Faz 2'de davet akışı yoktur; üyelik satırları yalnızca SECURITY DEFINER
-- trigger'lardan doğar. Rol değiştirme/üye çıkarma geldiğinde eklenecek:
--   using (private.is_workspace_admin(workspace_id) and user_id <> (select auth.uid()))
-- (self-demote koruması: son admin kendini kilitleyemesin.)

-- ── subscriptions / plan_defaults / krediler / aktivite ───────────────────
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (workspace_id in (select private.workspace_ids_for_current_user()));

create policy plan_defaults_select on public.plan_defaults for select to authenticated
  using (true);   -- yer tutucu paket limitleri gizli değil

create policy workspace_credits_select on public.workspace_credits for select to authenticated
  using (workspace_id in (select private.workspace_ids_for_current_user()));

create policy credit_ledger_select on public.credit_ledger for select to authenticated
  using (workspace_id in (select private.workspace_ids_for_current_user()));

create policy workspace_activity_select on public.workspace_activity for select to authenticated
  using (workspace_id in (select private.workspace_ids_for_current_user()));
-- Bu dördünde yazma politikası YOK: yazmalar trigger/definer RPC üzerinden.

-- ── contracts ──────────────────────────────────────────────────────────────
create policy contracts_select on public.contracts for select to authenticated
  using (workspace_id in (select private.workspace_ids_for_current_user()));

-- workspace_id in (...) kasıtlı olarak burada TEKRARLANMAZ: üye olmayan bir
-- kullanıcı için current_workspace_role() NULL döner ve `NULL in (...)` NULL
-- olduğundan politika zaten düşer. Tek kontrol yeterlidir.
create policy contracts_insert on public.contracts for insert to authenticated
  with check (
    private.current_workspace_role(workspace_id) in ('admin','editor')
    and created_by = (select auth.uid())
  );

create policy contracts_update on public.contracts for update to authenticated
  using      (private.current_workspace_role(workspace_id) in ('admin','editor'))
  with check (private.current_workspace_role(workspace_id) in ('admin','editor'));

create policy contracts_delete_admin on public.contracts for delete to authenticated
  using (private.is_workspace_admin(workspace_id));
