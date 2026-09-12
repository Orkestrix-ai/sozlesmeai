-- Hazır Sözleşmeler modülü — MVP 5 şablon için sözleşme türü sözlüğünü genişletir.
--
-- contracts.contract_type, contract_types(code)'a FK ile bağlı ve o tablonun
-- CHECK'i 20260907150000_contract_content_schema.sql:17'de üç kodla sınırlıydı
-- ('service','nda','freelance'). Kira / İş / İstifa şablonları bu kontrolden
-- geçemiyordu — şablon kaydı FK ihlaliyle düşerdi.
--
-- section_keys BAĞLAYICI DEĞİL (bkz. orijinal migration'daki yorum): AI'a
-- önerilen bölüm iskeleti ve sistem prompt'una girdi. Burada şablon
-- registry'sindeki (src/lib/contracts/templates/*.ts) madde anahtarlarıyla
-- birebir tutuluyor ki AI bir şablondan doğan sözleşmeyi düzenlerken aynı
-- bölüm anahtarlarını kullansın, paralel bir isimlendirme icat etmesin.

alter table public.contract_types
  drop constraint if exists contract_types_code_check;

alter table public.contract_types
  add constraint contract_types_code_check
  check (code in ('service','nda','freelance','rental','employment','resignation'));

insert into public.contract_types (code, name_key, section_keys) values
  ('rental', 'dashboard.newContract.types.rental',
    array['parties','subject','rent','deposit','term','payment','obligations','utilities','termination','special_terms']),
  ('employment', 'dashboard.newContract.types.employment',
    array['parties','position','start_date','salary','working_hours','workplace','leave','confidentiality','termination','special_terms']),
  ('resignation', 'dashboard.newContract.types.resignation',
    array['parties','declaration','last_working_day','handover','receivables','confidentiality','special_terms'])
on conflict (code) do nothing;
