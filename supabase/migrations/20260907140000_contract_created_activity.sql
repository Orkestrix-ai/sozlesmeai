-- Yeni sözleşme oluşturulduğunda §7.4 "ekip aktivitesi" akışına satır düşer.
--
-- workspace_activity'nin (20260907120300) hiçbir INSERT politikası/grant'i
-- yok — tüm yazımlar trigger/SECURITY DEFINER üzerinden gelir (bkz. o
-- migration'daki "Bu dördünde yazma politikası YOK" notu). contracts_insert
-- RLS politikası zaten admin/editor + created_by=self şartını doğruladığı
-- için burada ayrıca bir yetki kontrolü tekrarlanmaz; trigger yalnızca aynı
-- transaction'da izleyen kaydı düşer.

create or replace function public.tg_contract_created_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_activity (workspace_id, actor_id, kind, subject_id)
  values (new.workspace_id, new.created_by, 'contract_created', new.id);
  return new;
end $$;

revoke execute on function public.tg_contract_created_activity() from public, anon, authenticated;

create trigger contracts_created_activity
  after insert on public.contracts
  for each row execute function public.tg_contract_created_activity();
