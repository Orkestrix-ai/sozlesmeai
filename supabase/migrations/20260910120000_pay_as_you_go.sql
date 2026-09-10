-- ÜRÜN KARARI (2026-09-10): paket/abonelik modeli terk edildi.
--
-- Eski model: üç paket (starter/pro/business), workspace başına bir
-- `subscriptions` satırı, `plan_defaults`tan gelen "aylık" kredi tahsisi ve
-- taslak üretiminde (`draft_generate = 1`) düşen ücret.
--
-- Yeni model: ÖN YÜKLEMELİ BAKİYE, ücret PDF'te düşer.
--   • Sohbet, taslak, doğal dille düzenleme ve risk kontrolü ÜCRETSİZ.
--   • Sözleşme başına 1 kredi, yalnızca PDF üretiminde tahsil edilir.
--   • Aynı sözleşmenin sonraki PDF'leri ücretsiz — bu, uygulama mantığıyla
--     değil, PDF rotasının sabit `pdf:<contract_id>` idempotency anahtarı +
--     consume_credits'in idempotency kısa devresiyle garanti edilir.
--   • Aylık yenileme diye bir şey yok. Zaten hiç olmamıştı: pg_cron kurulu
--     değil, yenileme RPC'si yazılmamıştı; `subscriptions.current_period_end`
--     dashboard'da "Yenilenme: {date}" olarak GÖSTERİLİYOR ama arkasında
--     çalışan hiçbir şey yoktu. Bu migration o yalanı da kapatıyor.
--
-- SIRA ÖNEMLİ: tabloları düşürmeden ÖNCE onlara dokunan fonksiyon yeniden
-- yazılır, yoksa `drop table` bağımlı gövdeyi bozar.

-- ── 1) Kayıt kredisi: paketten değil, sabit; yalnızca kişisel workspace'e ──
-- Önceki gövde: 20260907142000_fix_team_workspace_credit_grant.sql:18-38.
-- İki değişiklik:
--   (a) `subscriptions` insert'i kalktı (tablo düşüyor).
--   (b) Grant artık YALNIZCA is_personal workspace'e yazılıyor. Eskiden bu
--       trigger her workspace insert'inde kredi basıyordu; workspace
--       switcher'dan sınırsız ekip alanı açıp bedava kredi üretmek mümkündü.
-- Miktar (1) burada sabit: rakam TS'te değil bir migration'da yaşar
-- (20260907120500'ün doktrini). Değiştirmek = yeni migration.
create or replace function public.tg_workspace_add_owner_membership()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict do nothing;

  insert into public.workspace_activity (workspace_id, actor_id, kind)
  values (new.id, new.owner_id, 'member_joined');

  -- Tek seferlik deneme hakkı: 1 kredi = 1 sözleşmenin PDF'i.
  -- reason 'signup_starter_grant' değil 'signup_grant' — "starter" artık
  -- var olmayan bir kademeye atıf. Defter append-only olduğu için ESKİ
  -- satırlar eski reason'la kalır; UI iki anahtarı da tanır.
  if new.is_personal then
    insert into public.credit_ledger (workspace_id, actor_id, entry_type, amount, reason)
    values (new.id, new.owner_id, 'grant', 1, 'signup_grant');
  end if;

  return new;
end $$;
revoke execute on function public.tg_workspace_add_owner_membership() from public, anon, authenticated;

-- ── 2) Abonelik şeması düşürülüyor ────────────────────────────────────────
-- RLS politikaları ve touch_subscriptions trigger'ı tabloyla birlikte gider.
-- `cascade` BİLEREK yok: beklenmedik bir bağımlılık varsa sessizce silinmek
-- yerine gürültülü şekilde patlaması istenir.
drop table public.subscriptions;
drop table public.plan_defaults;
drop type  public.plan_tier;
drop type  public.subscription_status;  -- yalnızca subscriptions kullanıyordu

-- NOT — public.activity_kind enum'ındaki 'plan_changed' değeri artık ölü ama
-- BİLEREK bırakılıyor: bir enum değerini kaldırmak tipi yeniden yaratıp
-- append-only bir denetim tablosunun (workspace_activity) kolonunu
-- dönüştürmeyi gerektirir. Kazancına göre orantısız risk.

-- ── 3) Ücretin düştüğü an: taslak → PDF ───────────────────────────────────
-- draft_generate 1'den 0'a iniyor, pdf_generate 0'dan 1'e çıkıyor.
-- is_placeholder=false: kredi maliyetleri artık bir ürün kararı. Geriye kalan
-- tek yer tutucu kredinin ₺ FİYATI — o messages/*.json'da yaşıyor.
update public.operation_costs set credits = 0, is_placeholder = false where operation = 'draft_generate';
update public.operation_costs set credits = 1, is_placeholder = false where operation = 'pdf_generate';
update public.operation_costs set credits = 0, is_placeholder = false where operation in ('ai_edit', 'risk_check', 'manual_edit');

-- RPC değişikliği gerekmiyor: create_contract_version zaten draft_generate/
-- ai_edit/manual_edit ile consume_credits çağırıyor; maliyet 0 olunca
-- denetim sürekliliği için `amount = 0` defter satırı yazılmaya devam eder
-- (credit_integrity.sql'in sign check'i bunu açıkça destekliyor), bakiye
-- hareket etmez.

-- ── 4) HATA: harcama, balance >= 0 CHECK'ine takılıyordu ──────────────────
-- 20260908120000 `workspace_credits_balance_nonneg` CHECK'ini eklemişti;
-- tg_credit_ledger_apply() ise bakiyeyi
--   insert ... values (ws, new.amount) on conflict do update set balance = balance + excluded.balance
-- ile materyalize ediyordu. Postgres CHECK kısıtlarını ÖNERİLEN insert
-- satırında, çakışma çözülmeden önce değerlendirir — dolayısıyla amount
-- negatifken (her harcamada) tuple (ws, -1) olarak sınanıp 23514 veriyordu.
-- ON CONFLICT yalnızca unique/exclusion ihlallerini yakalar, CHECK'i değil.
--
-- Sonuç: bakiyesi 3 olan bir workspace'te bile kredili işlem patlıyordu.
-- CHECK 2026-09-10'da canlıya alındığı ve o tarihe kadar ücretli tek işlem
-- draft_generate olduğu için canlıda kimse buna denk gelmeden yakalandı.
--
-- Düzeltme: satırı önce garanti et, sonra UPDATE et. CHECK böylece sonuç
-- satırında (3 - 1 = 2) sınanır. Gerçek bir eksiye düşüş hâlâ 23514 verir,
-- ama oraya varılmaz: consume_credits zaten önce insufficient_credits atar.
create or replace function public.tg_credit_ledger_apply()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_credits (workspace_id, balance, updated_at)
  values (new.workspace_id, 0, now())
  on conflict (workspace_id) do nothing;

  update public.workspace_credits
     set balance    = public.workspace_credits.balance + new.amount,
         updated_at = now()
   where workspace_id = new.workspace_id;

  return new;
end $$;
revoke execute on function public.tg_credit_ledger_apply() from public, anon, authenticated;

-- ── 5) GÜVENLİK: refund_credits çapraz-workspace iadesi ───────────────────
-- Önceki gövde (20260908120000_credit_integrity.sql:211-213) harcama satırını
-- YALNIZCA idempotency_key ile arıyordu. A workspace'inin admin/editor'ü,
-- B workspace'ine ait bir anahtarı bilirse iadeyi KENDİ workspace'ine
-- bastırabiliyordu. Tek satırlık düzeltme: workspace_id çapraz kontrolü.
create or replace function public.refund_credits(
  p_workspace_id    uuid,
  p_idempotency_key text,
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
  where idempotency_key = p_idempotency_key
    and entry_type      = 'consume'
    and workspace_id    = p_workspace_id;   -- ← eklendi

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
