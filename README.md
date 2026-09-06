# AI Destekli Sözleşme SaaS

Kullanıcı ihtiyacını doğal dille anlatır; sistem eksik bilgileri sorar, düzenlenebilir bir sözleşme taslağı üretir, PDF'e çevirir ve arşivler.

## Kaynak dokümanlar

- **`design.md`** — Tasarım sistemi (renk, tipografi, bölüm ve ekran tasarımları, QA listesi). Bağlayıcıdır.
- **`prd.md`** — Ürün gereksinimleri. FR-08'de kesiliyor; arşiv, paket/kredi ve admin için yazılı gereksinim yok.
- **`CLAUDE.md`** — Mimari kararlar, tasarım kuralları ve çözülmüş çelişkiler.

## Başlangıç

```bash
npm install
cp .env.example .env.local   # Faz 1'de değerler okunmuyor
npm run dev
```

- <http://localhost:3000> → `/tr`'ye yönlenir
- <http://localhost:3000/en> → İngilizce
- <http://localhost:3000/tr/style-guide> → dahili tasarım referansı

## Yığın

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui (Radix) · next-intl

## Durum

**Faz 1 tamamlandı:** proje iskeleti, design system, iki dilli landing page.

Sırada: Faz 2 Supabase (auth, workspace, RLS, dashboard'lar) → Faz 3 sözleşme oluşturma ekranı + Claude API → Faz 4 PDF/arşiv → Faz 5 admin paneli.
