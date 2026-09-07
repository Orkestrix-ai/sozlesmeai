-- Performans advisor'ı "multiple permissive policies" uyardı: her tabloda
-- hem kullanıcının kendi erişim politikası HEM ayrı bir admin_read_* politikası
-- vardı — Postgres ikisini de her SELECT'te ayrı ayrı değerlendiriyor. Bu
-- migration ikisini TEK politikada birleştirir (aynı davranış, tek
-- değerlendirme): `using (orijinal_koşul or private.is_platform_admin())`.

drop policy admin_read_profiles on public.profiles;
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or id in (select private.coworker_ids())
    or private.is_platform_admin()
  );

drop policy admin_read_workspaces on public.workspaces;
drop policy workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces for select to authenticated
  using (
    id in (select private.workspace_ids_for_current_user())
    or private.is_platform_admin()
  );

drop policy admin_read_workspace_members on public.workspace_members;
drop policy workspace_members_select on public.workspace_members;
create policy workspace_members_select on public.workspace_members for select to authenticated
  using (
    workspace_id in (select private.workspace_ids_for_current_user())
    or private.is_platform_admin()
  );

drop policy admin_read_subscriptions on public.subscriptions;
drop policy subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (
    workspace_id in (select private.workspace_ids_for_current_user())
    or private.is_platform_admin()
  );

drop policy admin_read_workspace_credits on public.workspace_credits;
drop policy workspace_credits_select on public.workspace_credits;
create policy workspace_credits_select on public.workspace_credits for select to authenticated
  using (
    workspace_id in (select private.workspace_ids_for_current_user())
    or private.is_platform_admin()
  );

drop policy admin_read_credit_ledger on public.credit_ledger;
drop policy credit_ledger_select on public.credit_ledger;
create policy credit_ledger_select on public.credit_ledger for select to authenticated
  using (
    workspace_id in (select private.workspace_ids_for_current_user())
    or private.is_platform_admin()
  );

drop policy admin_read_contracts on public.contracts;
drop policy contracts_select on public.contracts;
create policy contracts_select on public.contracts for select to authenticated
  using (
    workspace_id in (select private.workspace_ids_for_current_user())
    or private.is_platform_admin()
  );
