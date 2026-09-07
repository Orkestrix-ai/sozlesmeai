-- HATA DÜZELTMESİ: getAdminUsageStats() contract_versions/contract_messages
-- sayılarını doğrudan count(head:true) ile okuyordu — bu iki tabloda ise
-- (bilerek) admin için genel bir SELECT politikası YOK: design.md §9
-- "Kullanıcı verileri ve belge içerikleri için açık erişim değil, rol
-- tabanlı yetki mesajları gösterilmeli" der; sözleşme İÇERİĞİNE (versions/
-- messages) admin'in serbestçe erişmesi bu kurala aykırı olurdu. Sonuç:
-- admin yalnızca KENDİ workspace'lerindeki satırları sayabiliyordu —
-- platform geneli "Toplam AI/elle sürüm" ve "Toplam sohbet mesajı" metrikleri
-- sessizce eksik sayıyordu.
--
-- Doğru çözüm içerik erişimini AÇMAK değil, yalnızca SAYIYI (içerik değil)
-- döndüren tek bir SECURITY DEFINER RPC eklemek — is_platform_admin()
-- kendi içinde doğrulanır, hiçbir satır/metin dışarı sızmaz.

create or replace function public.admin_usage_stats()
returns table (
  total_users bigint,
  total_workspaces bigint,
  total_contracts bigint,
  total_versions bigint,
  total_messages bigint,
  credits_consumed bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'admin_usage_stats: yetkisiz';
  end if;

  return query select
    (select count(*) from public.profiles),
    (select count(*) from public.workspaces),
    (select count(*) from public.contracts),
    (select count(*) from public.contract_versions),
    (select count(*) from public.contract_messages),
    (select coalesce(sum(abs(amount)), 0) from public.credit_ledger where entry_type = 'consume');
end $$;

revoke execute on function public.admin_usage_stats() from public, anon;
grant execute on function public.admin_usage_stats() to authenticated;
