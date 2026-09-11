-- HATA (2026-09-11): create_contract_version 2026-09-08'de yazıldığından beri
-- HİÇ çalışmadı. Her çağrı 42702 ile düştü:
--
--     column reference "version_no" is ambiguous
--
-- Sebep: fonksiyon `returns table (version_id uuid, version_no integer,
-- balance integer)` ile bildiriliyor. Bu üç ad plpgsql gövdesinde birer OUT
-- DEĞİŞKENİ olarak kapsamdadır. Gövdedeki
--
--     select coalesce(max(version_no), 0) + 1 into v_next
--     from public.contract_versions where contract_id = p_contract_id;
--
-- satırında `version_no` hem o OUT değişkenine hem contract_versions'ın
-- kolonuna çözülebiliyordu; plpgsql bunu çözmeye çalışmaz, reddeder.
--
-- SONUÇ: contract_versions tablosu bugüne kadar BOŞ kaldı. Taslak kaydetme
-- (/api/contracts/[id]/turn → upsert_sections) ve elle düzenleme
-- (saveManualSectionsAction) bu RPC'nin tek yazma yolu olduğu için ikisi de
-- ölüydü; sürüm olmadan PDF de üretilemiyordu. Kullanıcıya görünen yüzü ise
-- yanlış bir cümleydi ("krediniz yetmiyor") — hata sınıflandırması ve sistem
-- prompt'u aynı anda düzeltiliyor (bkz. src/lib/db/errors.ts, src/lib/ai/prompts.ts).
--
-- DOKTRİN: `returns table (...)` bir fonksiyonun gövdesinde, OUT parametresiyle
-- AYNI ADI taşıyan bir kolonu ASLA niteliksiz yazma. Tablo takma adı ver ve
-- `cv.version_no` gibi nitele. Alternatifler bilerek seçilmedi:
--   • OUT adlarını değiştirmek (out_version_no) PostgREST yanıt şeklini
--     değiştirirdi; createContractVersionResultSchema (src/lib/db/schemas.ts)
--     tam olarak version_id/version_no/balance alanlarını doğruluyor.
--   • `#variable_conflict use_column` çakışmayı sessizce bir yöne çözer —
--     bir sonraki okuyucu için niteleme kadar açık değil.
--
-- İmza ve gövdenin geri kalanı 20260908120000_credit_integrity.sql ile
-- BİREBİR aynı: contracts satırının `for update` kilidi (version_no yarışı),
-- yetki kontrolü, consume_credits'in aynı transaction'da çağrılması,
-- current_version_id güncellemesi. Değişen tek şey nitelenen kolon.
create or replace function public.create_contract_version(
  p_contract_id     uuid,
  p_sections        jsonb,
  p_source          public.contract_version_source,
  p_idempotency_key text default null
)
returns table (version_id uuid, version_no integer, balance integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_next    integer;
  v_balance integer;
  v_id      uuid;
begin
  select workspace_id into v_workspace_id from public.contracts
  where id = p_contract_id for update;          -- version_no yarışını kapatır
  if v_workspace_id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if private.current_workspace_role(v_workspace_id) not in ('admin', 'editor') then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  -- `cv.` niteliği bu migration'ın tamamı: OUT parametresi version_no ile
  -- kolonun çakışmasını kaldırır.
  select coalesce(max(cv.version_no), 0) + 1 into v_next
  from public.contract_versions cv where cv.contract_id = p_contract_id;

  -- AYNI TRANSACTION: kredi düşümü ve sürüm yazımı ayrılamaz. consume_credits
  -- kendi içinde de SECURITY DEFINER olduğu için burada doğrudan çağrılabilir.
  v_balance := public.consume_credits(
    v_workspace_id,
    case when p_source = 'manual' then 'manual_edit'
         when v_next = 1          then 'draft_generate'
         else 'ai_edit' end,
    p_contract_id,
    p_idempotency_key);

  insert into public.contract_versions
    (contract_id, version_no, sections, source, created_by)
  values (p_contract_id, v_next, p_sections, p_source, (select auth.uid()))
  returning id into v_id;

  update public.contracts set current_version_id = v_id where id = p_contract_id;

  return query select v_id, v_next, v_balance;
end $$;

revoke execute on function public.create_contract_version(uuid, jsonb, public.contract_version_source, text)
  from public, anon;
grant execute on function public.create_contract_version(uuid, jsonb, public.contract_version_source, text)
  to authenticated;
