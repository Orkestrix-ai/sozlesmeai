# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Proje

AI destekli **sözleşme SaaS**'ı: kullanıcı ihtiyacını doğal dille anlatır, sistem eksik bilgileri sorar, düzenlenebilir bir sözleşme taslağı üretir, PDF'e çevirir ve arşivler.

İki doküman bu projenin kaynağıdır ve **koddan önce gelir**:

- **`design.md`** (Türkçe) — Tasarım sistemi. Renk token'ları, tipografi, landing bölümleri, paket bazlı dashboard'lar, sözleşme ekranı, admin paneli, buton/durum sistemi, responsive kurallar, §12'de tasarım QA listesi. Uygulanmaya hazır ve bağlayıcıdır.
- **`prd.md`** (İngilizce) — Ürün gereksinimleri. **FR-08'de (PDF) kesiliyor**: arşiv, paylaşım, paket/kredi muhasebesi ve admin paneli için yazılı gereksinim yok, yalnızca §3 MVP kapsam listesinde adı geçiyor. Bu alanlarda varsayım üretmeden önce kullanıcıya sorun.

## Komutlar

```bash
npm run dev        # geliştirme sunucusu (Turbopack)
npm run build      # üretim derlemesi + TypeScript kontrolü
npm run lint       # ESLint (tüm proje)
npm run start      # derlenmiş uygulamayı çalıştır

npx eslint src/components/landing/hero.tsx   # tek dosya
npx tsc --noEmit                             # yalnızca tip kontrolü
```

Test altyapısı henüz kurulmadı (Faz 1 kapsamı dışıydı). `npm run build` şu an tip güvenliğinin tek kapısıdır.

## Mimari

**Next.js 16.3.4 + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Radix) + next-intl.**

Next.js 16 eğitim verinizden farklıdır. Kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili rehberi okuyun. Şimdiye kadar ısırdığı yerler:

- **`middleware.ts` artık `proxy.ts`.** Dosya `src/proxy.ts`, export adı `proxy` veya default. İşlev aynı.
- **`params` bir Promise'tir** — `const { locale } = await params`.
- **`PageProps<'/[locale]'>` ve `LayoutProps<'/[locale]'>`** global tip yardımcılarıdır; kendi props arayüzünüzü yazmayın.
- `next/root-params` ile locale prop-drilling olmadan okunabilir (Server Component'lerde).

### Klasörler

```
src/app/[locale]/          # kök layout burada (html/body), tüm rotalar altında
src/app/[locale]/style-guide/   # dahili tasarım referansı, i18n dışı
src/components/landing/    # landing bölümleri, her biri ayrı bileşen
src/components/ui/         # design.md §10'a bağlı primitifler (button, status-badge)
src/i18n/                  # routing, navigation, request yapılandırması
src/proxy.ts               # locale algılama (eski adıyla middleware)
messages/{tr,en}.json      # TÜM görünür metin
```

### i18n

- Diller: `tr` (varsayılan) ve `en`. Yapılandırma tek yerde: `src/i18n/routing.ts`.
- **Görünür hiçbir string bileşene gömülmez** — hepsi `messages/*.json` içinde. Tek istisna `style-guide` sayfası (dahili geliştirici referansı).
- Uygulama içi bağlantılarda `next/link` DEĞİL, `@/i18n/navigation`'daki `Link` / `redirect` / `useRouter` kullanılır; aksi halde dil öneki kaybolur.
- Yeni bir metin eklerken **her iki dosyayı birden** güncelleyin; eksik anahtar üretimde çalışma zamanı hatasıdır.

### Faz planı

Faz 1 (tamamlandı): iskelet, design system, landing page. Sırada:

- **Faz 2** — Supabase: auth, workspace/üyelik şeması, RLS, dashboard kabuğu ve paket bazlı dashboard'lar (design.md §7)
- **Faz 3** — Sözleşme oluşturma ekranı (design.md §8) + Claude API (`claude-opus-5`, adaptive thinking, streaming); PRD FR-02…FR-07
- **Faz 4** — PDF, arşiv, paylaşım (PRD FR-08) + kredi/paket muhasebesi
- **Faz 5** — Admin paneli (design.md §9)

## Tasarım kuralları (pazarlık edilemez)

design.md §1, §3, §5 ve §12'nin özü. Bir ekran yazarken bunlar önceliklidir:

- **Kırmızı bir dekorasyon rengi değil, aksiyon ve önem göstergesidir.** Genel oran %60 açık nötr / %25 koyu / %10 gri / **%5 kırmızı**. Kullanıcıyı aynı anda birden fazla kırmızı CTA ile karşılaştırmayın.
- **Her ekranda tek bir birincil aksiyon** bulunur.
- **Yasak görsel dil:** mor-mavi neon "AI" paleti, gradient, neon parlama, cam efekti, aşırı yuvarlatılmış oyuncak kartlar, robot/beyin/sihirli değnek görselleri, içeriği desteklemeyen 3D illüstrasyonlar.
- **Border, gölgeden baskındır.** Tek gölge `shadow-card`; radius 8–12 px (`--radius: 10px`), yalnızca büyük pazarlama alanlarında 16–20 px.
- İkonlar çizgi tabanlı ve aynı stroke ağırlığında (`lucide-react`).
- Hukuki garanti ya da "tamamen hatasız sözleşme" iddiası içeren metin yazmayın.

Bir ekranı bitirdiğinizde **design.md §12'deki QA listesini** tek tek geçin.

### Koyu yüzeyler dark mode DEĞİLDİR

design.md'deki `ink-950` / `ink-900` alanlar (navbar, hero, sidebar, final CTA, sözleşme ekranının sol paneli) açık temanın içinde yaşayan **marka yüzeyleridir**. `bg-ink-950` gibi açık utility'lerle yazın; `dark:` ile değil.

`globals.css` içindeki `@custom-variant dark (&:is(.dark *))` satırı bilerek duruyor: `dark:` varyantını hiçbir zaman eklenmeyen bir `.dark` sınıfına bağlar, böylece shadcn bileşenlerinden gelen `dark:` sınıfları ölü kalır. **Silmeyin** — silinirse Tailwind v4 varsayılanına (`prefers-color-scheme`) döner ve işletim sistemi koyu temadaki ziyaretçilerde palet sessizce bozulur.

Tailwind'in yerleşik `stone` paleti de bilerek temizlendi (`--color-stone-*: initial`). Palet dışı bir ton (`stone-500` gibi) yazıldığında sınıf hiç üretilmez — sessizce yanlış renk gelmesindense görünür şekilde kırılması tercih edildi.

## Paket adlandırma — çözülmüş çelişki

`prd.md` paketleri **Starter / Pro / Business** diye adlandırır; `design.md` §6.6 ve §7 ise Free / Pay-as-you-go / Business der. **PRD geçerlidir.** design.md'nin tasarım niyeti şöyle eşlenir (dokümanı düzeltmiyoruz, kodda bu eşleme geçerli):

| design.md | Kod / UI | Tasarım niyeti (design.md §7) |
|---|---|---|
| Free | **Starter** | Sade, öğretici, düşük yoğunluk; 2–3 metrik; sakin inline yükseltme mesajı |
| Pay-as-you-go | **Pro** | Kullanım/maliyet şeffaflığı; kredi özeti, işlem geçmişi, tek kırmızı seri grafikler |
| Business | **Business** | Ekip yönetimi, KPI kartları, rol badge'leri, gelişmiş filtreler, API alanı |

## Ürün ilkeleri

- **AI çıktısı hiçbir zaman otomatik olarak "nihai" gösterilmez.** Taslak / inceleme / onay durumları görsel olarak ayrılır (design.md §8). Her çıktı düzenlenebilir ve kullanıcı onayına tabidir.
- Bilinmeyen bilgi **uydurulmaz**; eksik ve belirsiz alanlar açıkça işaretlenir (PRD FR-04).
- Risk/tutarlılık kontrolü hukuki görüş veya geçerlilik garantisi değildir (PRD FR-07).
- **MVP dışı:** elektronik imza, güvenli bağlantıyla imzalama, imza durumu takibi, imzalı belge arşivi, gelişmiş müşteri portalı. Bunları ana navigasyonda mevcut özellik gibi göstermeyin (design.md §7.1); gerekirse yalnızca "yakında" olarak.

## Açık konular

- **Fiyatlar yer tutucudur.** `messages/*.json` içindeki Pro fiyatı (₺499 / $19) ve Starter'ın ücretsiz olması PRD'de tanımlı değil; gerçek fiyatlandırma kararı verilince güncellenmeli. Business "Teklif alın" olarak duruyor.
- Footer'daki kurumsal/yasal bağlantılar (Hakkımızda, İletişim, Gizlilik, Kullanım koşulları) henüz gerçek sayfalara değil, sayfa içi bölümlere işaret ediyor — `src/components/landing/site-footer.tsx` içindeki `HREFS`.
- Paket başına kredi miktarları ve hangi işlemin kaç kredi harcadığı tanımlı değil (PRD'de FR olarak yazılmamış).
