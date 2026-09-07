-- Fork edilen kaynak üründen kalan public şema nesnelerini kaldırır.
-- Faz 2'den itibaren şema workspace merkezlidir; bu dosya yalnızca temizlik yapar.
-- NOT: auth.users içindeki test kullanıcılarının silinmesi BİLEREK bu migration'a
-- dahil edilmedi — tek seferlik operasyonel bir eylem, tekrar oynatılabilir şema
-- geçmişinin parçası değil. Bkz. commit mesajı.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.payment_events cascade;
drop table if exists public.subscriptions  cascade;
drop table if exists public.profiles       cascade;
