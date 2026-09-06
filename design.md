# AI Destekli Sözleşme SaaS - Design System

## 1. Tasarım yönü

Bu ürün; sözleşme hazırlama, belge yönetimi ve ileride elektronik imza süreçlerini yöneten profesyonel bir SaaS platformudur.

### Tasarım hedefleri

- Güvenilir ve profesyonel görünüm
- Hukuki belge ürünlerine uygun ciddiyet
- Modern ama yapay zekâ ürünü klişelerine düşmeyen arayüz
- Kırmızı ve siyahı güçlü vurgu renkleri olarak kullanma
- Fazla gradient, neon, cam efekti ve rastgele renk kullanımından kaçınma
- Kullanıcıyı sözleşme oluşturma akışına hızlıca yönlendirme
- Dashboard ve admin ekranlarında yoğun bilgiyi sakin ve anlaşılır sunma

### Kaçınılacak görünüm

- Mor-mavi neon “AI” renk paleti
- Fazla gradient ve parlak ışık efektleri
- Her bölümde farklı renk kullanımı
- Aşırı yuvarlatılmış, oyuncak gibi kartlar
- Büyük robot, beyin, sihirli değnek veya soyut AI görselleri
- İçeriği desteklemeyen dekoratif 3D illüstrasyonlar
- Her butonda veya etikette kırmızı kullanımı

## 2. Marka renk paleti

Ana renk sistemi kırmızı, kömür siyahı, sıcak beyaz ve nötr gri tonlarından oluşur.

### Ana renkler

| Token | Hex | Kullanım |
|---|---|---|
| `brand-red-600` | `#C62828` | Ana CTA, aktif durum, önemli aksiyonlar |
| `brand-red-700` | `#A61B1B` | Hover, pressed state, koyu vurgu |
| `brand-red-500` | `#D83A3A` | İkincil vurgu, grafik serisi |
| `ink-950` | `#0D0D0F` | Ana siyah, dark hero, başlıklar |
| `ink-900` | `#151518` | Koyu yüzeyler, sidebar |
| `ink-800` | `#222226` | Dark kartlar ve sınırlar |

### Nötr renkler

| Token | Hex | Kullanım |
|---|---|---|
| `paper-50` | `#FAF9F7` | Ana açık arka plan |
| `paper-100` | `#F3F1EE` | Bölüm arka planı, hover yüzeyleri |
| `stone-200` | `#E5E1DC` | Border, divider |
| `stone-400` | `#AAA49D` | Placeholder, ikincil ikonlar |
| `stone-600` | `#6D6862` | Yardımcı metin |
| `stone-800` | `#393633` | Ana gövde metni |

### Durum renkleri

Durum renkleri kırmızıdan ayrışmalı; yalnızca hata için kırmızıyı kullanın.

| Durum | Hex | Kullanım |
|---|---|---|
| Başarılı | `#287A55` | Oluşturuldu, tamamlandı, aktif |
| Bilgi | `#35658F` | Bilgilendirme ve sistem mesajları |
| Uyarı | `#B7791F` | Eksik bilgi, yaklaşan bitiş tarihi |
| Hata | `#B42318` | Başarısız işlem, kritik uyarı |
| Başarılı açık yüzey | `#E8F3ED` | Başarı badge ve alert arka planı |
| Uyarı açık yüzey | `#FFF4D6` | Uyarı badge ve alert arka planı |
| Hata açık yüzey | `#FDEAE8` | Hata badge ve alert arka planı |

## 3. Renk kullanım oranı

Genel oran:

- **%60:** Sıcak beyaz ve açık nötr yüzeyler
- **%25:** Siyah ve kömür tonları
- **%10:** Gri metinler, borderlar ve yardımcı yüzeyler
- **%5:** Marka kırmızısı

Kırmızı bir dekorasyon rengi değil, aksiyon ve önem göstergesidir. Kullanıcıyı aynı anda birden fazla kırmızı CTA ile karşılaştırmayın.

## 4. Tipografi

### Önerilen font yaklaşımı

- Başlıklar: karakteri güçlü, modern grotesk sans-serif
- Gövde metni: yüksek okunabilirlikte nötr sans-serif
- Sözleşme metni: belge okumasına uygun, daha sakin bir serif veya yüksek okunabilirlikte sans-serif
- Sayılar ve durum değerleri: tabular numerals destekli font

### Tipografik ölçek

| Kullanım | Boyut | Ağırlık |
|---|---:|---:|
| Landing hero başlığı | 56–72 px | 700 |
| Landing bölüm başlığı | 36–48 px | 700 |
| Dashboard sayfa başlığı | 28–32 px | 700 |
| Kart başlığı | 16–18 px | 650 |
| Gövde metni | 15–16 px | 400 |
| Yardımcı metin | 13–14 px | 400 |
| Buton metni | 14–15 px | 600 |
| Sözleşme metni | 15–17 px | 400 |

## 5. Genel UI prensipleri

- Arayüz, “AI ile sihirli bir şey yapılıyor” mesajı yerine somut ilerlemeyi göstermeli.
- Her AI çıktısı düzenlenebilir, açıklanabilir ve kullanıcı onayına tabi olmalı.
- Birincil aksiyon her ekranda tek ve belirgin olmalı.
- Border kullanımı gölge kullanımından daha baskın olmalı.
- Kartlar bilgi gruplamak için kullanılmalı; her içerik kart içine konulmamalı.
- Border radius genel olarak 8–12 px aralığında tutulmalı.
- Büyük pazarlama alanlarında 16–20 px kullanılabilir; dashboard’da daha kontrollü kalınmalı.
- Gölgeler hafif olmalı: `0 4px 16px rgba(13, 13, 15, 0.08)`.
- İkonlar çizgi tabanlı, sade ve aynı stroke ağırlığında olmalı.

## 6. Landing page tasarımı

### Genel görsel dil

Landing page; üst bölümde koyu siyah zemin, aşağıda sıcak beyaz ve açık nötr bölümler kullanmalı. Kırmızı, yalnızca ana aksiyonlarda ve stratejik vurgularda yer almalı.

### Bölüm yapısı

#### 6.1 Navbar

- Arka plan: `ink-950`
- Logo: `paper-50`
- Navigasyon metni: `stone-400`
- Hover metni: `paper-50`
- Ana buton: `brand-red-600`
- Ana buton hover: `brand-red-700`
- Menü yapısı sade: Ürün, Nasıl çalışır, Paketler, SSS

#### 6.2 Hero

- Arka plan: `ink-950`
- Ana başlık: `paper-50`
- Açıklama: `stone-400`
- Vurgulanan kısa ifade: `brand-red-500`
- Birincil CTA: `brand-red-600` zemin, `paper-50` metin
- İkincil CTA: şeffaf zemin, `stone-200` border, `paper-50` metin
- Sağ tarafta gerçek ürün ekranını andıran sözleşme oluşturma paneli kullanılmalı.
- Soyut AI görseli yerine; soru-cevap, belge taslağı ve ilerleme adımlarını gösteren UI kullanılmalı.

#### 6.3 Problem bölümü

- Arka plan: `paper-50`
- Başlık: `ink-950`
- Metin: `stone-600`
- Problem ikonları: `ink-800`
- Kritik vurgu: ince `brand-red-600` çizgi veya küçük etiket

#### 6.4 Ürün akışı

Dört veya beş adımlı yatay/dikey süreç:

1. İhtiyacını anlat
2. Eksik bilgileri tamamla
3. Taslağı düzenle
4. PDF’yi oluştur
5. Müşterinle paylaş

- Adım numarası: `ink-950`
- Aktif adım: `brand-red-600`
- Tamamlanan adım: `#287A55`
- Bağlantı çizgileri: `stone-200`
- Her adımda kısa, somut açıklama olmalı.

#### 6.5 Özellikler

- Arka plan: `paper-100`
- Kartlar: `paper-50`
- Kart border: `stone-200`
- İkon: `ink-900`
- Öne çıkan kart: `ink-950` zemin, `paper-50` metin ve küçük kırmızı vurgu

#### 6.6 Paketler

Üç paket yan yana gösterilebilir; fiyat ve özellik karşılaştırması sade olmalı.

- **Free:** `paper-50` zemin, `stone-200` border
- **Pay-as-you-go:** `paper-50` zemin, `ink-950` border
- **Business:** `ink-950` zemin, `paper-50` metin, `brand-red-600` CTA
- “En popüler” etiketi: kırmızı dolgu yerine açık kırmızı yüzey `#FDEAE8` ve `brand-red-700` metin
- Paket kartlarında en fazla 5–6 temel fark gösterilmeli.

#### 6.7 Güven bölümü

- Arka plan: `paper-50`
- Güven mesajları: veri kontrolü, sürüm geçmişi, belge arşivi, kullanıcı onayı
- Kırmızı yalnızca kritik vurgu için kullanılmalı.
- Hukuki garanti veya “tamamen hatasız sözleşme” gibi iddialardan kaçınılmalı.

#### 6.8 Final CTA

- Arka plan: `brand-red-700` veya `ink-950`
- Başlık: `paper-50`
- Açıklama: `#F3D2D0`
- CTA: `paper-50` zemin, `ink-950` metin

## 7. Paket bazlı dashboard tasarımı

Dashboard, paket farklarını renk karmaşasıyla değil; yetenek, limit ve kullanım alanlarıyla göstermeli.

### 7.1 Ortak dashboard yapısı

- Sidebar: `ink-950`
- Sidebar aktif öğe: `brand-red-600`
- Ana içerik: `paper-50`
- Kart yüzeyi: `paper-50`
- Border: `stone-200`
- Başlık: `ink-950`
- Gövde: `stone-800`
- Yardımcı metin: `stone-600`
- Birincil aksiyon: `brand-red-600`
- Başarı durumu: `#287A55`

Ortak menü:

- Genel bakış
- Sözleşmeler
- Yeni sözleşme oluştur
- Şablonlar
- Arşiv
- Hatırlatmalar
- Ayarlar

İmza özellikleri daha sonraki fazda menüye eklenmeli; MVP’de aktif olmayan bir özelliği ana navigasyonda öne çıkarmayın.

### 7.2 Free dashboard

Amaç: Kullanıcıyı ilk sözleşmesini oluşturmaya ve ürünü anlamaya yönlendirmek.

- Ton: sade, öğretici, düşük yoğunluklu
- Sidebar: `ink-900`
- Ana CTA: `brand-red-600`
- Kullanım limiti: ince progress bar; doluluk kırmızıya yaklaştıkça `brand-red-500`
- Boş durumlar: beyaz yüzey, basit ikon, tek CTA
- Paket yükseltme mesajları: agresif banner yerine sakin inline mesaj
- İstatistikler: 2–3 temel metrikten fazla gösterilmemeli

### 7.3 Pay-as-you-go dashboard

Amaç: Oluşturulan belgeleri ve kullanım maliyetini şeffaf göstermek.

- Ana vurgu: kullanım ve işlem geçmişi
- Kredi/işlem özeti: `ink-950` kart veya açık nötr kart
- Harcama ve kullanım grafikleri: `brand-red-600` tek vurgu serisi, diğer seriler gri
- Belge durumu: tamamlandı için yeşil, bekliyor için amber, hata için kırmızı
- Ödeme/işlem geçmişi sade tablo görünümünde olmalı
- Her belge satırında net durum ve sonraki aksiyon bulunmalı

### 7.4 Business dashboard

Amaç: Ekip yönetimi, ortak çalışma, belge arşivi ve operasyonel görünürlük.

- Sidebar: `ink-950`
- Üst navigasyon ve workspace seçici: `ink-900`
- KPI kartları: açık yüzey, güçlü tipografi, az dekorasyon
- Ekip aktivitesi: gri taban, kırmızı yalnızca önemli aksiyonlarda
- Rol ve yetki badge’leri: nötr tonlar; admin için `ink-900`, editör için `brand-red-100` benzeri açık kırmızı yüzey, görüntüleyici için `paper-100`
- Gelişmiş filtreler: border tabanlı, kırmızı sadece seçili filtrede
- API ve entegrasyon alanı: teknik ama sade; monospaced metin yalnızca gerçek kod veya anahtar gösteriminde

## 8. Sözleşme oluşturma ekranı

Bu ekran ürünün merkezidir.

### Sol panel: AI sohbeti / bilgi toplama

- Arka plan: `ink-950`
- AI mesajı: `ink-800` yüzey, `paper-50` metin
- Kullanıcı mesajı: `brand-red-700` yüzey, `paper-50` metin
- Soru başlığı: `paper-50`
- Eksik alan uyarısı: `#FFF4D6` yüzey, `#8A5A00` metin

### Sağ panel: sözleşme taslağı

- Arka plan: `paper-100`
- Belge yüzeyi: `paper-50`
- Başlık: `ink-950`
- Metin: `stone-800`
- AI tarafından son değiştirilen satırlar: çok açık kırmızı zemin, örneğin `#FFF1F0`
- Kullanıcı tarafından onaylanan bölümler: çok açık yeşil vurgu, örneğin `#E8F3ED`
- Düzenle butonu: outline `ink-800`
- PDF oluştur: `brand-red-600`

AI çıktısı hiçbir zaman otomatik olarak “nihai” gösterilmemeli. Taslak, gözden geçirme ve kullanıcı onayı durumları açıkça ayrılmalı.

## 9. Admin paneli tasarımı

Admin paneli, son kullanıcı dashboard’undan daha yoğun ve operasyonel olmalı; ancak marka dilini korumalıdır.

### Admin renkleri

- Ana arka plan: `#ECEAE7`
- Sidebar: `ink-950`
- Sidebar aktif öğe: `brand-red-600`
- İçerik yüzeyi: `paper-50`
- Tablo header: `paper-100`
- Border: `stone-200`
- Ana metin: `ink-950`
- Yardımcı metin: `stone-600`
- Kritik aksiyon: `#B42318`
- Sistem başarılı: `#287A55`
- Sistem uyarısı: `#B7791F`

### Admin bölümleri

- Kullanıcılar
- Workspace ve ekipler
- Sözleşme şablonları
- AI kullanım istatistikleri
- Belge işlem günlükleri
- Sistem bildirimleri
- Paket ve kullanım yönetimi
- Destek talepleri
- Güvenlik ve erişim kayıtları

### Admin özel kuralları

- Silme ve geri döndürülemez işlemler kırmızı outline veya koyu hata rengiyle gösterilmeli.
- Yönetici arayüzünde kırmızı, normal navigasyon rengi değil; kritik aksiyon rengi olmalı.
- Tablolarda zebra satır yerine border ve boşluk kullanımı tercih edilmeli.
- Kullanıcı verileri ve belge içerikleri için açık erişim değil, rol tabanlı yetki mesajları gösterilmeli.
- Audit log ekranlarında zaman, aktör, işlem ve kaynak ayrı kolonlar halinde sunulmalı.

## 10. Buton ve durum sistemi

### Birincil buton

- Zemin: `brand-red-600`
- Metin: `paper-50`
- Hover: `brand-red-700`
- Disabled: `#D6A0A0`

### İkincil buton

- Zemin: transparent
- Border: `stone-400` veya `ink-800`
- Metin: `ink-900`
- Hover zemin: `paper-100`

### Tehlikeli buton

- Zemin: `#B42318`
- Metin: `paper-50`
- Onay modalı zorunlu

### Durum badge’leri

- Taslak: `paper-100` zemin, `stone-800` metin
- İnceleniyor: `#FFF4D6` zemin, `#8A5A00` metin
- Hazır: `#E8F3ED` zemin, `#21623F` metin
- Paylaşıldı: `#E8EEF5` zemin, `#2D5478` metin
- Hata: `#FDEAE8` zemin, `#9B2118` metin

## 11. Responsive tasarım

### Mobil

- Sidebar bottom navigation veya açılır drawer’a dönüşmeli.
- Sözleşme oluşturma ekranı tek kolonlu akışa geçmeli.
- Taslak ve AI sohbeti sekmeli görünümle ayrılmalı.
- Paket kartları yatay kaydırılabilir veya dikey listelenmeli.
- Admin tabloları kart görünümüne dönüşmeli.

### Tablet

- Dashboard iki kolonlu yapıyı koruyabilir.
- Sözleşme editöründe AI paneli daraltılabilir olmalı.

### Masaüstü

- Maksimum içerik genişliği: 1280–1440 px
- Sözleşme ekranında AI paneli ve belge paneli yan yana
- Landing hero için geniş, nefes alan düzen

## 12. Tasarım kalite kontrol listesi

- [ ] Kırmızı sadece aksiyon ve önem göstergesi olarak kullanılıyor mu?
- [ ] Mor-mavi neon veya genel AI renkleri kullanılmıyor mu?
- [ ] Her ekranda tek bir ana CTA var mı?
- [ ] AI taslağı ile kullanıcı onayı görsel olarak ayrılıyor mu?
- [ ] Sözleşme metni rahat okunuyor mu?
- [ ] Free, Pay-as-you-go ve Business farkları anlaşılır mı?
- [ ] Admin ekranında kritik işlemler güvenli şekilde ayrıştırılmış mı?
- [ ] Boş durumlar kullanıcıyı bir sonraki adıma yönlendiriyor mu?
- [ ] Mobilde sözleşme oluşturma akışı kullanılabilir mi?
- [ ] İmza özellikleri MVP dışındaysa arayüzde ana özellik gibi gösterilmiyor mu?

## 13. Kısa tasarım özeti

**Renk karakteri:** Kömür siyahı, sıcak beyaz, kontrollü kırmızı.

**Görsel karakter:** Profesyonel, sakin, belge odaklı, güven veren.

**Kırmızı kullanım amacı:** CTA, aktif durum, kritik vurgu.

**Kaçınılacak yaklaşım:** Mor-mavi AI gradyanları, neon parlamalar, yapay zekâ klişeleri ve gereksiz dekorasyon.

**Ana ürün hissi:** Kullanıcı boş bir sayfaya bırakılmaz; sistem onu adım adım kullanılabilir bir sözleşmeye götürür.