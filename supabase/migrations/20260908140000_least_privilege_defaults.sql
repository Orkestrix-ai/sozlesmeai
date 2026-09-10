-- Güvenlik sertleştirmesi 5/5 — en az yetki ilkesi (Supabase-yerel karşılık).
--
-- Bu proje `DATABASE_URL` ile doğrudan bağlanmıyor — PostgREST üzerinden
-- yalnızca `anon`/`authenticated` JWT rolleriyle konuşuyor, `postgres`
-- (superuser) ile HİÇBİR istek yolu bağlanmıyor. Talep edilen rol ayrımının
-- bu projedeki gerçek karşılığı:
--
--   | Talep                          | Bu projedeki karşılığı                     |
--   |---------------------------------|---------------------------------------------|
--   | app_user (yalnızca CRUD)        | authenticated / anon — PostgREST rolleri;   |
--   |                                  | DDL yok, tablo grant'leri + RLS ile sınırlı |
--   | migration_user (DDL)            | postgres — yalnızca Supabase MCP/CLI kullanır|
--   | "superuser ile bağlanma" riski   | zaten yok: DATABASE_URL yok, bağlantı yok,  |
--   |                                  | yalnızca HTTPS + JWT                        |
--   | RLS'i atlayan rol                | service_role — bu işten sonra tek çağrı     |
--   |                                  | yerinde kalıyor (bkz. src/lib/supabase/admin.ts) |
--
-- Buradaki asıl kazanım: Postgres/Supabase varsayılanı yeni bir NESNE
-- oluşturulduğunda onu otomatik olarak erişilebilir kılar (tablolar için
-- PUBLIC'e değil ama şemanın sahibine; fonksiyonlar için ise PUBLIC'e
-- EXECUTE verir). Bu depoda HER migration'ın kendi tablosu/fonksiyonu için
-- elle `revoke` yazması gerekiyordu — bu disiplin şu ana kadar tutarlı
-- uygulanmıştı (her CREATE FUNCTION'ın hemen ardından `revoke ... from
-- public, anon` geldiği kontrol edildi), ama bir sonraki migration'da biri
-- unutursa tablo/fonksiyon sessizce herkese açılırdı. ALTER DEFAULT
-- PRIVILEGES bunu gelecekteki nesneler için ZORUNLU hale getirir.

-- Bundan sonra `postgres` rolüyle (yani MCP/CLI migration akışıyla)
-- oluşturulan her yeni tablo/sekans "kapalı" doğar — CREATE TABLE'dan sonra
-- açık bir GRANT olmadan ne anon ne authenticated hiçbir şey göremez.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- Fonksiyonlar için Postgres varsayılanı daha agresiftir: yeni bir fonksiyon
-- otomatik olarak PUBLIC'e (yani dolaylı olarak anon dahil herkese) EXECUTE
-- verir. Bu satır o varsayılanı kapatır — ileride bir migration'da
-- `revoke execute ... from public, anon` satırı unutulursa bile fonksiyon
-- PUBLIC'e açık DOĞMAZ. (Geriye dönük UYGULANMAZ: mevcut fonksiyonların
-- hepsi zaten kendi migration'ında bu revoke'u tek tek almıştı — bkz.
-- supabase/checks/security_assertions.sql'deki "search_path" ve grant
-- iddiaları; burada geriye dönük toplu bir revoke YAPILMIYOR çünkü her
-- fonksiyonun ihtiyaç duyduğu authenticated/anon EXECUTE'unu tek tek yeniden
-- vermek gerekirdi — bu, mevcut doğru grant'leri kırma riski taşıyan,
-- kazanımı düşük bir adımdır.)
alter default privileges in schema public revoke execute on functions from public;

-- Mevcut durumun defansif yeniden-doğrulanması (idempotent — 20260907120300
-- zaten bunu yapmıştı, burada yalnızca "bu iddia hâlâ doğru" diye tekrar
-- edilir; supabase/checks/security_assertions.sql bunu düzenli denetler).
revoke all on all tables in schema public from anon;
grant usage on schema public to anon;   -- PostgREST'in RPC çözümlemesi için şart
grant usage on schema public to authenticated;
