-- Güvenlik sertleştirmesi 1/5 — çok kiracılı izolasyonun RLS'in İFADE
-- EDEMEDİĞİ satırlar-arası tutarlılık boşlukları. RLS "bu satırı görebilir
-- misin" sorusunu cevaplar; burada kapatılan açıklar "bu satırın İÇERİĞİ
-- doğru mu" sorusuyla ilgili — ikisi farklı sınırlar.

-- ── 1) contract_documents / contract_findings: version_id → contract_id
--       eşleşmesi doğrulanmıyordu ────────────────────────────────────────
-- contract_versions_select politikası contract_id üzerinden çalışıyor;
-- version_id contract_id ile eşleşmezse (ör. B'nin contract_id'si + A'nın
-- version_id'si) RLS bunu yakalamaz, çünkü version_id'nin AYRICA kontrolü
-- yok. Bileşik FK, DB'nin kendisi bu eşleşmeyi zorunlu kılar.
alter table public.contract_versions
  add constraint contract_versions_id_contract_uq unique (id, contract_id);

alter table public.contract_documents
  drop constraint contract_documents_version_id_fkey,
  add  constraint contract_documents_version_fkey
    foreign key (version_id, contract_id)
    references public.contract_versions (id, contract_id) on delete cascade;

-- contract_findings.version_id NULLABLE — MATCH SIMPLE (Postgres varsayılanı)
-- iki kolondan biri NULL ise kısıtı atlar, mevcut "version_id'siz bulgu"
-- davranışı korunur.
alter table public.contract_findings
  drop constraint contract_findings_version_id_fkey,
  add  constraint contract_findings_version_fkey
    foreign key (version_id, contract_id)
    references public.contract_versions (id, contract_id) on delete cascade;

-- ── 2) contract_documents.storage_path: doğrulamak yerine YENİDEN ÜRETMEK
-- ─────────────────────────────────────────────────────────────────────────
-- contract_documents_insert politikası yalnızca contract_id'yi kontrol
-- ediyor; storage_path serbest metin. Bir editor kendi workspace'inin
-- contract_id'siyle satır açıp storage_path alanına BAŞKA bir workspace'in
-- yolunu yazabilirdi — Storage RLS'i (contracts_bucket_select) bunu
-- ENGELLEMEZ çünkü orada kontrol edilen storage.objects yolu, buradaki
-- contract_documents satırı değil. Oturumsuz /s/[token] sayfası service-role
-- ile bu satırdan imzalı URL bastığı için, bu zincir çapraz-kiracı dosya
-- sızıntısına dönüşüyordu. Çözüm: istemciden gelen storage_path'e GÜVENMEMEK,
-- sunucuda contract_id + version_no'dan yeniden hesaplamak.
create or replace function public.tg_contract_documents_normalize_path()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_workspace_id uuid;
  v_version_no   integer;
begin
  select c.workspace_id, v.version_no
    into v_workspace_id, v_version_no
  from public.contract_versions v
  join public.contracts c on c.id = v.contract_id
  where v.id = new.version_id and v.contract_id = new.contract_id;

  if v_workspace_id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  -- pdf/route.ts'in ürettiği iskeletle birebir aynı: {ws}/{contract}/v{n}.pdf.
  -- 20260907170000'deki Storage RLS politikaları da bu iskelete dayanıyor.
  new.storage_path := v_workspace_id || '/' || new.contract_id
                      || '/v' || v_version_no || '.pdf';
  return new;
end $$;
revoke execute on function public.tg_contract_documents_normalize_path()
  from public, anon, authenticated;

create trigger contract_documents_normalize_path
  before insert or update on public.contract_documents
  for each row execute function public.tg_contract_documents_normalize_path();

-- ── 3) PDF yeniden üretimi bugün RLS'e takılıyor (B15) ─────────────────
-- pdf/route.ts `upsert: true` kullanıyor ama storage.objects'te UPDATE
-- politikası, contract_documents'ta UPDATE grant'i yoktu — aynı sürümün
-- PDF'i ikinci kez üretilemiyordu. storage_path artık yukarıdaki tetikleyici
-- tarafından üretildiği için, bu yolun açılması B1'i yeniden açmıyor.
grant update on public.contract_documents to authenticated;

create policy contract_documents_update on public.contract_documents for update to authenticated
  using      (contract_id in (
    select id from public.contracts
    where private.current_workspace_role(workspace_id) in ('admin','editor')
  ))
  with check (contract_id in (
    select id from public.contracts
    where private.current_workspace_role(workspace_id) in ('admin','editor')
  ));

create policy contracts_bucket_update on storage.objects for update to authenticated
  using (
    bucket_id = 'contracts'
    and private.current_workspace_role((storage.foldername(name))[1]::uuid) in ('admin','editor')
  )
  with check (
    bucket_id = 'contracts'
    and private.current_workspace_role((storage.foldername(name))[1]::uuid) in ('admin','editor')
  );

-- ── 4) contract_shares: "yalnızca revoked_at set edilir" kuralı BUGÜN
--       uygulama disiplinine dayanıyordu — kısıta çevriliyor ─────────────
-- Migration'daki eski yorum bunu açıkça itiraf ediyordu: "update yalnızca
-- iptal içindir ... bunu bir CHECK yerine uygulama katmanında disipliniyle
-- sağlıyoruz". Bir editor bugün token/contract_id/created_by'ı yeniden
-- yazabilir veya bir iptali geri alabilirdi.
create or replace function public.tg_contract_shares_immutable_columns()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.token        is distinct from old.token
     or new.contract_id is distinct from old.contract_id
     or new.created_by  is distinct from old.created_by
     or new.created_at  is distinct from old.created_at then
    raise exception 'immutable_column' using errcode = '42501';
  end if;
  -- İptal geri alınamaz: revoked_at bir kez set edilince NULL'a dönemez.
  if old.revoked_at is not null and new.revoked_at is null then
    raise exception 'immutable_column' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger contract_shares_immutable_columns
  before update on public.contract_shares
  for each row execute function public.tg_contract_shares_immutable_columns();
