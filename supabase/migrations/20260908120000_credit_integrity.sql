-- Güvenlik sertleştirmesi 3/5 — finansal bütünlük (ACID & yarış durumları).
--
-- ÖNEMLİ TESPİT: mevcut consume_credits() zaten `SELECT ... FOR UPDATE` ile
-- doğru serileştiriyordu — bu, şüphelenilen "oku-sonra-yaz" yarışı DEĞİLDİ.
-- Asıl açıklar: (a) workspace_credits satırı henüz yokken FOR UPDATE'in
-- kilitleyeceği bir satır olmaması (yarış penceresi), (b) bakiye için DB
-- seviyesinde >= 0 güvencesinin hiç olmaması, (c) idempotency anahtarının
-- hiç olmaması (ağ kesintisinde tekrarlanan istek = çift harcama), (d) kredi
-- düşümü ile onu izleyen işin (sürüm yazımı, PDF, LLM) ayrı transaction'larda
-- olması — biri patlarsa kredi telafisiz yanıyordu.

-- ── 1) Bakiye asla eksiye düşemez — nihai DB seviyesi güvence ───────────
-- Mevcut veride negatif bakiye varsa bu ALTER burada KASTEN patlar; sessizce
-- `not valid` bırakmak yerine sorunu görünür kılar. Patlarsa:
--   select recompute_workspace_credits(workspace_id) from workspace_credits
--   where balance < 0;
-- ile mutabakat yapılıp migration tekrar çalıştırılır.
alter table public.workspace_credits
  add constraint workspace_credits_balance_nonneg check (balance >= 0);

-- ── 1b) Elle düzenleme için ayrı bir işlem kodu ─────────────────────────
-- saveManualSectionsAction() bugün hiç consume_credits çağırmıyordu (insan
-- düzenlemesi AI kredisi yakmaz — bu davranış korunuyor: maliyet 0). Ama
-- create_contract_version() TÜM sürüm yazımlarını tek RPC'den geçirdiği
-- için manuel düzenmenin denetim izinde "ai_edit" olarak görünmesi YANLIŞ
-- olurdu; ayrı bir işlem kodu ekleniyor.
insert into public.operation_costs (operation, credits) values ('manual_edit', 0);

-- ── 2) Sıfır maliyetli işlemler de artık kayıt yazsın ────────────────────
-- Bugün consume_credits maliyet 0 ise erken dönüyordu (ai_edit/risk_check/
-- pdf_generate yer tutucu fiyatları), yani bu işlemler HİÇ iz bırakmıyordu.
-- Kullanıcı kararı: her işlem denetim izi + idempotency anahtarı taşısın,
-- bakiye 0 maliyette değişmesin. `consume` girişi artık amount <= 0 kabul
-- eder (eskiden sıkı `< 0`'dı).
alter table public.credit_ledger drop constraint credit_ledger_amount_check;  -- inline `amount <> 0`
alter table public.credit_ledger drop constraint credit_ledger_sign_ck;
alter table public.credit_ledger add constraint credit_ledger_sign_ck check (
  (entry_type = 'consume'           and amount <= 0) or   -- 0 = ücretsiz kullanım izi
  (entry_type in ('grant', 'refund') and amount > 0) or
  (entry_type = 'adjustment'        and amount <> 0)
);

-- ── 3) Idempotency anahtarı ──────────────────────────────────────────────
-- Çağıran taraf (route/RPC) her mantıksal işlem için tekil bir anahtar
-- üretir; aynı anahtarla ikinci çağrı krediden İKİNCİ KEZ düşmez.
alter table public.credit_ledger add column idempotency_key text
  check (idempotency_key is null or char_length(idempotency_key) between 8 and 200);

create unique index credit_ledger_idempotency_key_uq
  on public.credit_ledger (idempotency_key) where idempotency_key is not null;

-- ── 4) consume_credits() yeniden yazımı ──────────────────────────────────
-- Dönüş tipi ve imza değiştiği için CREATE OR REPLACE yerine DROP+CREATE
-- gerekir (aksi halde eski imzayla yeni bir aşırı yükleme oluşurdu).
drop function public.consume_credits(uuid, text, uuid);

create function public.consume_credits(
  p_workspace_id    uuid,
  p_operation       text,
  p_contract_id     uuid default null,
  p_idempotency_key text default null
)
returns integer                      -- yeni bakiye
language plpgsql security definer set search_path = ''
as $$
declare
  v_cost    integer;
  v_balance integer;
begin
  if not exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = (select auth.uid())
      and role in ('admin', 'editor')
  ) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select credits into v_cost from public.operation_costs where operation = p_operation;
  if v_cost is null then
    raise exception 'unknown_operation' using errcode = '22023';
  end if;

  -- Idempotency: aynı anahtar zaten işlendiyse İKİNCİ KEZ DÜŞMEDEN mevcut
  -- bakiyeyi döndür (ağ kesintisi sonrası tekrar denemeler için güvenli).
  if p_idempotency_key is not null
     and exists (select 1 from public.credit_ledger where idempotency_key = p_idempotency_key) then
    return coalesce((select balance from public.workspace_credits
                     where workspace_id = p_workspace_id), 0);
  end if;

  -- FOR UPDATE'in kilitleyeceği bir satır HER ZAMAN olsun: eski sürümde
  -- workspace_credits satırı henüz yoksa kilit hiçbir şeye takılmıyordu —
  -- iki eşzamanlı "ilk harcama" isteği bunu görebilirdi (yarış penceresi).
  insert into public.workspace_credits (workspace_id, balance)
  values (p_workspace_id, 0) on conflict (workspace_id) do nothing;

  select balance into v_balance
  from public.workspace_credits
  where workspace_id = p_workspace_id
  for update;                        -- eşzamanlı harcamalar burada serileşir

  if v_balance < v_cost then
    raise exception 'insufficient_credits' using errcode = 'P0001';
  end if;

  -- v_cost = 0 olsa bile kayıt yazılır: denetim izi + idempotency anahtarı
  -- her işlem için var olsun. Bakiye bu durumda değişmez (amount = 0).
  insert into public.credit_ledger
    (workspace_id, actor_id, contract_id, entry_type, amount, reason, idempotency_key)
  values
    (p_workspace_id, (select auth.uid()), p_contract_id, 'consume',
     -v_cost, p_operation, p_idempotency_key);

  if v_cost > 0 then
    insert into public.workspace_activity (workspace_id, actor_id, kind, subject_id)
    values (p_workspace_id, (select auth.uid()), 'credits_consumed', p_contract_id);
  end if;

  return v_balance - v_cost;
end $$;

revoke execute on function public.consume_credits(uuid, text, uuid, text) from public, anon;
grant  execute on function public.consume_credits(uuid, text, uuid, text) to authenticated;

-- ── 5) Atomik "kredi düş + sürüm yaz" ────────────────────────────────────
-- Kredi kaybının kökten çözümü: tek transaction, ya ikisi de olur ya
-- hiçbiri. Ayrıca version_no yarışını da kapatır — bugüne kadar
-- `latestVersionNo + 1` uygulama tarafında hesaplanıyordu; iki eşzamanlı
-- turn isteği aynı version_no'yu üretip contract_versions'ın
-- unique(contract_id, version_no) kısıtına çarpabilirdi. Burada
-- `select ... for update` ile contracts satırı kilitlenip version_no
-- SUNUCUDA, kilitli halde hesaplanıyor.
create function public.create_contract_version(
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

  select coalesce(max(version_no), 0) + 1 into v_next
  from public.contract_versions where contract_id = p_contract_id;

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

-- İstemci artık sürüm SAHTELEYEMEZ (kredi düşümünü atlayıp doğrudan
-- contract_versions'a yazamaz): tek yazma yolu yukarıdaki RPC'dir.
revoke insert on public.contract_versions from authenticated;
drop policy contract_versions_insert on public.contract_versions;

-- ── 6) Telafi kaydı ───────────────────────────────────────────────────────
-- LLM çağrısı veya PDF render'ı, kredi düşüldükten SONRA başarısız olursa
-- çağıran taraf bu RPC'yi kendi idempotency anahtarıyla çağırıp krediyi
-- geri alır. `refund` enum değeri şemada vardı ama hiç kullanılmıyordu.
create function public.refund_credits(
  p_workspace_id    uuid,
  p_idempotency_key text,           -- iade edilecek harcamanın anahtarı
  p_reason          text default 'operation_failed'
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_amount      integer;
  v_contract_id uuid;
begin
  if private.current_workspace_role(p_workspace_id) not in ('admin', 'editor') then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select amount, contract_id into v_amount, v_contract_id
  from public.credit_ledger
  where idempotency_key = p_idempotency_key and entry_type = 'consume';

  if v_amount is null or v_amount = 0 then
    -- İade edecek bir şey yok (harcama bulunamadı veya zaten 0 maliyetliydi).
    return coalesce((select balance from public.workspace_credits
                     where workspace_id = p_workspace_id), 0);
  end if;

  -- Aynı iade iki kez uygulanamaz: iade anahtarı orijinalden türetilir ve
  -- credit_ledger_idempotency_key_uq bunu tekilleştirir.
  insert into public.credit_ledger
    (workspace_id, actor_id, contract_id, entry_type, amount, reason, idempotency_key)
  values (p_workspace_id, (select auth.uid()), v_contract_id, 'refund',
          -v_amount, p_reason, p_idempotency_key || ':refund')
  on conflict (idempotency_key) do nothing;

  return (select balance from public.workspace_credits where workspace_id = p_workspace_id);
end $$;

revoke execute on function public.refund_credits(uuid, text, text) from public, anon;
grant  execute on function public.refund_credits(uuid, text, text) to authenticated;

-- ── 7) Ön uçuş bakiye kapısı ──────────────────────────────────────────────
-- LLM çağrılmadan ÖNCE okunacak, ucuz ve yan etkisiz. Bakiyesi sıfır bir
-- workspace'in sınırsız Anthropic/Groq token yakmasını önler — asıl kredi
-- düşümü hâlâ consume_credits/create_contract_version'da, tek gerçek kaynak
-- orası; bu yalnızca erken bir tahmin/kapı.
create function public.can_afford(p_workspace_id uuid, p_operation text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select balance from public.workspace_credits
                   where workspace_id = p_workspace_id), 0)
         >= coalesce((select credits from public.operation_costs
                      where operation = p_operation), 0)
    and private.current_workspace_role(p_workspace_id) in ('admin', 'editor');
$$;

revoke execute on function public.can_afford(uuid, text) from public, anon;
grant  execute on function public.can_afford(uuid, text) to authenticated;
