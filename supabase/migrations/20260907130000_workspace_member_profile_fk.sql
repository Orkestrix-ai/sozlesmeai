-- PostgREST, iki tablo arasında satır içi embed (`select("...profiles(...)")`)
-- yapabilmek için aralarında DOĞRUDAN bir foreign key ister. workspace_members
-- ve workspace_activity yalnızca auth.users'a referans veriyor; profiles'a
-- değil — src/lib/dal.ts'teki üye listesi ve aktivite akışı sorguları bu
-- yüzden derlenmiyor (SelectQueryError).
--
-- profiles.id zaten auth.users(id)'ye 1:1 eşit (handle_new_user trigger'ı
-- ikisini aynı anda yaratır) — bu yüzden aynı koloma profiles'a giden İKİNCİ
-- bir FK eklemek güvenlidir: iki kısıt da her zaman aynı anda sağlanır.

alter table public.workspace_members
  add constraint workspace_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.workspace_activity
  add constraint workspace_activity_actor_id_profiles_fkey
  foreign key (actor_id) references public.profiles(id) on delete set null;
