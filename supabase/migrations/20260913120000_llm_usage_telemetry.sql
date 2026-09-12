-- LLM token telemetrisi — yönetim panelindeki gelir/gider KPI'ının gider ayağı.
--
-- Bu migration'dan önce API maliyeti hiçbir yerde ÖLÇÜLMÜYORDU: her iki SDK de
-- yanıtında `usage` döndürüyor, ama provider katmanı (src/lib/ai/provider/)
-- onu okumadan atıyordu. Kredi sistemi (`credit_ledger`, `operation_costs`)
-- soyut "kredi" birimiyle çalışır ve gerçek token tüketimiyle İLGİSİ YOKTUR —
-- işlem başına elle konmuş sabit bir fiyattır. Yani maliyet tarafı için
-- kullanılabilecek mevcut bir veri kaynağı yoktu.
--
-- Burada yalnızca HAM TOKEN SAYISI tutulur, para tutulmaz: birim fiyatlar
-- (ve USD→TRY kuru) src/lib/billing/rates.ts'te operatör sabitleridir ve
-- zamanla değişir. Parayı satıra yazsaydık, fiyat değişince geçmiş yeniden
-- hesaplanamazdı.

create table public.llm_usage (
  id                  bigint generated always as identity primary key,
  -- credit_ledger ile aynı duruş: workspace silinemesin, geçmiş tutarsız kalmasın.
  workspace_id        uuid not null references public.workspaces(id) on delete restrict,
  -- BİLEREK FK DEĞİL (credit_ledger.contract_id ile aynı gerekçe): silinen bir
  -- sözleşme geçmiş bir telemetri satırını yeniden yazmamalı/düşürmemeli.
  contract_id         uuid,
  operation           text not null check (operation in ('turn', 'review')),
  -- Sağlayıcı LLM_PROVIDER env'i ile değişebiliyor ve modellerin birim fiyatı
  -- farklı. Hangi fiyatın uygulanacağını satırın KENDİSİ söylemeli; yoksa
  -- sağlayıcı değiştiği an geçmiş maliyet sessizce yanlış hesaplanır.
  provider            text not null,
  model               text not null,
  input_tokens        integer not null check (input_tokens >= 0),
  -- Groq'ta reasoning token'ları completion_tokens'a DAHİLDİR (canlı doğrulandı:
  -- completion_tokens=32, completion_tokens_details.reasoning_tokens=30), yani
  -- burada ayrıca toplanmaz — toplasaydık çift sayardık.
  output_tokens       integer not null check (output_tokens >= 0),
  -- Anthropic'te prompt caching açık (cache_control: ephemeral) ve cache'ten
  -- okunan girdi normal girdiden ÇOK daha ucuz fiyatlanır. Ayrı tutulmazsa
  -- Anthropic'e geçildiğinde maliyet sistematik olarak şişik çıkar.
  -- Groq'ta karşılığı yok; orada 0 kalır.
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  created_at          timestamptz not null default now()
);

create index llm_usage_created_idx on public.llm_usage (created_at desc);
create index llm_usage_workspace_created_idx on public.llm_usage (workspace_id, created_at desc);

alter table public.llm_usage enable row level security;
revoke all on public.llm_usage from anon;
-- 20260908140000 sonrası yeni tablolar "kapalı doğar"; bu grant olmadan admin
-- politikası da iş görmez.
grant select on public.llm_usage to authenticated;

-- Yalnızca platform admini okur. UPDATE/DELETE politikası BİLEREK YOK: uygulama
-- üzerinden hiçbir satır değiştirilemez veya silinemez.
--
-- Append-only TETİKLEYİCİSİ ise bilerek EKLENMEDİ (credit_ledger/admin_audit_log'dan
-- farkı): orası denetim kaydı, burası telemetri ve hacimli büyür. Tetikleyici
-- tabloyu kalıcı olarak budanamaz yapardı. Politika yokluğu uygulamayı zaten
-- kilitliyor; bakımcı (postgres) konsoldan eski satırları budayabilir.
create policy llm_usage_select on public.llm_usage for select to authenticated
  using (private.is_platform_admin());

-- ── Yazma yolu ──────────────────────────────────────────────────────────────
-- INSERT politikası yerine RPC: satır yalnızca buradan yazılır, çağıran o
-- workspace'in üyesi mi diye doğrulanır ve değerler sınırlanır.
--
-- BİLİNEN SINIR: RPC `authenticated`'a açık olduğundan kötü niyetli bir
-- kullanıcı doğrudan çağırıp sahte token yazabilir. Bu FATURALAMA DEĞİL,
-- maliyet telemetrisidir — hiçbir para hareketi buna bağlı değil. Alternatif
-- service-role istemcisiydi; eslint.config.mjs onu no-restricted-imports ile
-- kısıtlıyor ve CLAUDE.md "nadir kalsın" diyor, bu yüzden mevcut mimariden
-- sapılmadı. Bütünlük bir gün önem kazanırsa yükseltme yolu budur.
create function public.record_llm_usage(
  p_workspace_id        uuid,
  p_contract_id         uuid,
  p_operation           text,
  p_provider            text,
  p_model               text,
  p_input_tokens        integer,
  p_output_tokens       integer,
  p_cached_input_tokens integer default 0
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_workspace_id not in (select private.workspace_ids_for_current_user()) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  -- Saçma değerlere karşı üst sınır: tek bir çağrı hiçbir modelde bu kadar
  -- token tüketemez, dolayısıyla aşan bir değer ya hata ya sahtekârlıktır.
  if greatest(p_input_tokens, p_output_tokens, p_cached_input_tokens) > 10000000 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;

  insert into public.llm_usage
    (workspace_id, contract_id, operation, provider, model,
     input_tokens, output_tokens, cached_input_tokens)
  values
    (p_workspace_id, p_contract_id, p_operation, p_provider, p_model,
     coalesce(p_input_tokens, 0), coalesce(p_output_tokens, 0), coalesce(p_cached_input_tokens, 0));
end $$;

revoke execute on function public.record_llm_usage(uuid, uuid, text, text, text, integer, integer, integer) from public, anon;
grant execute on function public.record_llm_usage(uuid, uuid, text, text, text, integer, integer, integer) to authenticated;

-- ── Okuma yolu (admin KPI) ──────────────────────────────────────────────────
-- Toplama JS'te değil burada yapılır: bu tablo her LLM çağrısında bir satır
-- alır, yani tüm satırları çekip uygulamada toplamak kısa sürede bozulurdu.
--
-- DİKKAT — OUT adı / kolon adı çakışması: `returns table (...)` içindeki adlar
-- gövdede plpgsql değişkeni olarak da görünür. create_contract_version tam
-- bunu yüzünden shipped-broken kalmıştı (42702, bkz. CLAUDE.md). Bu yüzden
-- gövdedeki HER kolon `u.` ile niteleniyor; nitelemeyi kaldırmayın.
create function public.admin_llm_usage_summary(p_since timestamptz)
returns table (
  provider            text,
  model               text,
  calls               bigint,
  input_tokens        bigint,
  output_tokens       bigint,
  cached_input_tokens bigint
)
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'admin_llm_usage_summary: yetkisiz';
  end if;

  return query
    select u.provider,
           u.model,
           count(*)::bigint,
           coalesce(sum(u.input_tokens), 0)::bigint,
           coalesce(sum(u.output_tokens), 0)::bigint,
           coalesce(sum(u.cached_input_tokens), 0)::bigint
    from public.llm_usage u
    where u.created_at >= p_since
    group by u.provider, u.model
    order by u.provider, u.model;
end $$;

revoke execute on function public.admin_llm_usage_summary(timestamptz) from public, anon;
grant execute on function public.admin_llm_usage_summary(timestamptz) to authenticated;
