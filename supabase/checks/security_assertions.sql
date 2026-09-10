-- Migration DEĞİL — elle çalıştırılan bir denetim betiği. Migration'lar
-- uygulandıktan sonra SQL editöründe (postgres rolüyle) çalıştırılır.
-- Her blok bir iddiayı test eder; iddia yanlışsa `raise exception` atar.
-- Sessizce bitmesi (çıktı vermeden tamamlanması) "hepsi geçti" demektir.
--
-- CLAUDE.md → "## Database security" bölümünde ne zaman çalıştırılacağı
-- açıklanır: her yeni migration'dan sonra ve düzenli aralıklarla
-- (ör. deploy öncesi) elle çalıştırılması önerilir.

do $$
declare
  v_count integer;
  v_table text;
begin

  -- 1) public şemasında RLS'i kapalı tablo yok.
  select count(*) into v_count
  from pg_tables t
  join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
  where t.schemaname = 'public' and not c.relrowsecurity;
  if v_count > 0 then
    raise exception 'İDDİA BAŞARISIZ: public şemasında RLS kapalı % tablo var', v_count;
  end if;

  -- 2) anon rolüne hiçbir tabloda doğrudan grant yok (RPC üzerinden erişim ayrı).
  select count(*) into v_count
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee = 'anon';
  if v_count > 0 then
    raise exception 'İDDİA BAŞARISIZ: anon rolüne % tablo grant''i var', v_count;
  end if;

  -- 3) search_path set edilmemiş SECURITY DEFINER fonksiyonu yok (arama
  --    yolu enjeksiyonuna karşı — her SECURITY DEFINER `set search_path = ''`
  --    taşımalı).
  select count(*) into v_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'private')
    and p.prosecdef  -- security definer
    and not exists (
      select 1 from unnest(coalesce(p.proconfig, array[]::text[])) cfg
      where cfg like 'search_path=%'
    );
  if v_count > 0 then
    raise exception 'İDDİA BAŞARISIZ: search_path set edilmemiş % SECURITY DEFINER fonksiyonu var', v_count;
  end if;

  -- 4) credit_ledger / workspace_activity / admin_audit_log üzerinde
  --    append-only tetikleyicisi var (hem update/delete hem truncate).
  foreach v_table in array array['credit_ledger', 'workspace_activity', 'admin_audit_log'] loop
    select count(*) into v_count
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = v_table and c.relnamespace = 'public'::regnamespace
      and t.tgname in (v_table || '_append_only', v_table || '_no_truncate')
      and not t.tgisinternal;
    if v_count <> 2 then
      raise exception 'İDDİA BAŞARISIZ: %.append_only/no_truncate tetikleyicileri eksik (bulunan: %)', v_table, v_count;
    end if;
  end loop;

  -- 5) workspace_credits üzerinde balance >= 0 kısıtı var.
  select count(*) into v_count
  from pg_constraint
  where conrelid = 'public.workspace_credits'::regclass
    and conname = 'workspace_credits_balance_nonneg';
  if v_count <> 1 then
    raise exception 'İDDİA BAŞARISIZ: workspace_credits_balance_nonneg kısıtı yok';
  end if;

  -- 6) Her public tablosunda en az bir RLS politikası var (RLS açık ama
  --    politikasız bir tablo = herkese kapalı görünür ama asıl niyet
  --    unutulmuş bir politika olabilir; bilinçli "politikasız" tablo yok).
  select count(*) into v_count
  from pg_tables t
  where t.schemaname = 'public'
    and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = t.tablename);
  if v_count > 0 then
    raise exception 'İDDİA BAŞARISIZ: % tabloda hiç RLS politikası yok', v_count;
  end if;

  raise notice 'Tüm güvenlik iddiaları geçti.';
end $$;
