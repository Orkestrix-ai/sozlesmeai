-- Güvenlik sertleştirmesi 4/5 — admin kredi eklemenin atomikleştirilmesi ve
-- oturumsuz paylaşım sayfasının sınırsız service-role istemcisinin kısıtlı
-- bir RPC ile değiştirilmesi.

-- ── 1) Atomik admin kredi ekleme + denetim kaydı ─────────────────────────
-- Bugün src/actions/admin.ts iki AYRI service-role çağrısı yapıyordu:
-- credit_ledger insert'i, sonra admin_audit_log insert'i. Migration yorumu
-- "bu ikisi uygulama kodunda birlikte garanti edilir" diyordu ama ikinci
-- çağrı başarısız olursa yalnızca console.error'a yazılıp başarı
-- döndürülüyordu — kredi eklenmiş, denetim kaydı yok. Tek RPC'ye taşımak
-- ikisini AYNI transaction'a alır: biri olmadan diğeri olmaz. Yan fayda:
-- src/actions/admin.ts artık service-role istemcisine ihtiyaç duymaz.
create function public.admin_add_credits(
  p_workspace_id    uuid,
  p_amount          integer,
  p_idempotency_key text default null
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_balance integer;
begin
  if not private.is_platform_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'invalid_amount' using errcode = '22023';
  end if;
  if not exists (select 1 from public.workspaces where id = p_workspace_id) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if p_idempotency_key is not null
     and exists (select 1 from public.credit_ledger where idempotency_key = p_idempotency_key) then
    return coalesce((select balance from public.workspace_credits
                     where workspace_id = p_workspace_id), 0);
  end if;

  insert into public.credit_ledger
    (workspace_id, actor_id, entry_type, amount, reason, idempotency_key)
  values (p_workspace_id, (select auth.uid()), 'adjustment', p_amount,
          'admin_adjustment', p_idempotency_key);

  insert into public.admin_audit_log (actor_id, action, resource_type, resource_id, detail)
  values ((select auth.uid()), 'add_credits', 'workspace', p_workspace_id::text,
          jsonb_build_object('amount', p_amount));

  select balance into v_balance from public.workspace_credits where workspace_id = p_workspace_id;
  return v_balance;
end $$;

revoke execute on function public.admin_add_credits(uuid, integer, text) from public, anon;
grant  execute on function public.admin_add_credits(uuid, integer, text) to authenticated;

-- ── 2) Paylaşım okuması için kısıtlı RPC ─────────────────────────────────
-- src/app/[locale]/s/[token]/page.tsx bugün createAdminClient() (service-role,
-- RLS'i TAMAMEN atlar) ile dört ayrı sorgu çalıştırıyordu. Bu sayfadaki
-- herhangi bir kodlama hatası ileride tüm veritabanını açığa çıkarabilirdi
-- — hiçbir kısıt katmanı yoktu. Bu RPC, aynı SECURITY DEFINER deseniyle ama
-- YALNIZCA TEK BİR paylaşıma karşılık gelen satırları döndürür; başka
-- hiçbir satıra erişemez.
create function public.get_shared_contract(p_token text)
returns table (
  contract_id  uuid,
  title        text,
  status       public.contract_status,
  version_id   uuid,
  sections     jsonb,
  storage_path text
)
language sql stable security definer set search_path = ''
as $$
  select c.id, c.title, c.status, v.id, v.sections, d.storage_path
  from public.contract_shares s
  join public.contracts c on c.id = s.contract_id
  left join lateral (
    select cv.id, cv.sections from public.contract_versions cv
    where cv.contract_id = c.id order by cv.version_no desc limit 1
  ) v on true
  left join public.contract_documents d on d.version_id = v.id
  where s.token = p_token
    and char_length(p_token) between 16 and 128
    and s.revoked_at is null
    and (s.expires_at is null or s.expires_at > now())
    -- Onayı geri alınan (draft'a döndürülen) bir sözleşme artık halka açık
    -- kalmaz — bugün page.tsx bu kontrolü hiç yapmıyordu. Paylaşımın en son
    -- sürümü göstermesi (sürüme sabitlenmemesi) bilinçli olarak korunan bir
    -- ürün kararıdır, bkz. CLAUDE.md "Open items".
    and c.status in ('ready', 'shared');
$$;

-- Bu fonksiyon bilinçli olarak PostgREST'e açık (public şeması) — token'ın
-- kendisi yetki kanıtıdır (24 rastgele bayt = 192 bit, src/actions/sharing.ts).
-- Service-role istemcisinin aksine, başka hiçbir satır döndüremez.
revoke execute on function public.get_shared_contract(text) from public;
grant  execute on function public.get_shared_contract(text) to anon, authenticated;
