-- Faz 4 — PDF üretimi (FR-08). "contracts" private Storage bucket'ı +
-- sürüme bağlı iz kaydı. Dosya yolu HER ZAMAN {workspace_id}/{contract_id}/
-- v{version_no}.pdf — Storage RLS bu iskelete dayanır (storage.foldername).

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

create table public.contract_documents (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references public.contracts(id) on delete cascade,
  version_id   uuid not null unique references public.contract_versions(id) on delete cascade,
  storage_path text not null,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index contract_documents_contract_idx on public.contract_documents (contract_id, created_at desc);

alter table public.contract_documents enable row level security;
revoke all on public.contract_documents from anon;
grant select, insert on public.contract_documents to authenticated;

create policy contract_documents_select on public.contract_documents for select to authenticated
  using (contract_id in (
    select id from public.contracts
    where workspace_id in (select private.workspace_ids_for_current_user())
  ));

create policy contract_documents_insert on public.contract_documents for insert to authenticated
  with check (contract_id in (
    select id from public.contracts
    where private.current_workspace_role(workspace_id) in ('admin', 'editor')
  ));

-- ── Storage RLS ─────────────────────────────────────────────────────────────
-- Yol iskeleti {workspace_id}/{contract_id}/v{n}.pdf olduğu için ilk klasör
-- segmenti doğrudan workspace_id'dir — private.workspace_ids_for_current_user()
-- ile aynı üyelik zinciri burada da geçerli.
create policy contracts_bucket_select on storage.objects for select to authenticated
  using (
    bucket_id = 'contracts'
    and (storage.foldername(name))[1]::uuid in (select private.workspace_ids_for_current_user())
  );

create policy contracts_bucket_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'contracts'
    and private.current_workspace_role((storage.foldername(name))[1]::uuid) in ('admin', 'editor')
  );
