-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║  YER TUTUCU DEĞERLER — PRD'de TANIMLI DEĞİL                            ║
-- ║  CLAUDE.md "Açık konular": "Paket başına kredi miktarları ve hangi     ║
-- ║  işlemin kaç kredi harcadığı tanımlı değil."                           ║
-- ║  Starter rakamı messages/tr.json'daki "Ayda 3 sözleşme taslağı"        ║
-- ║  vaadiyle hizalandı (taslak başına 1 kredi varsayımıyla).              ║
-- ║  Gerçek rakamlar gelince YALNIZCA bu dosyanın devamı olan yeni bir     ║
-- ║  migration'ı yazın. Bu sayılar kodda TEKRARLANMAZ — src/lib/plans.ts   ║
-- ║  bunları asla yeniden tanımlamaz, yalnızca DAL üzerinden okur.         ║
-- ╚════════════════════════════════════════════════════════════════════════╝
insert into public.plan_defaults (plan, monthly_credits, seat_limit, is_placeholder) values
  ('starter',     3, 1,    true),
  ('pro',       100, 5,    true),
  ('business', 1000, null, true)
on conflict (plan) do update
  set monthly_credits = excluded.monthly_credits,
      seat_limit      = excluded.seat_limit,
      is_placeholder  = excluded.is_placeholder;
