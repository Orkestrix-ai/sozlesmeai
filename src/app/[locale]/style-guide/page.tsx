import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Container } from "@/components/landing/container";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * DAHİLİ GELİŞTİRİCİ REFERANSI — son kullanıcıya yönelik bir sayfa değildir.
 *
 * design.md'deki token, ölçek, buton ve badge'lerin kodda gerçekten doğru
 * değerlere bağlandığını gözle doğrulamak için var. Bu sayfa i18n kuralının
 * dışındadır (metinler bilerek sabit).
 *
 * Bir token değiştirildiğinde önce burayı açıp design.md ile karşılaştırın.
 */
export const metadata = {
  title: "Stil rehberi",
  robots: { index: false, follow: false },
};

async function noopServerAction() {
  "use server";
  // ConfirmDialog demo'su için — bu sayfa Server Component olduğundan
  // Client Component'e düz bir arrow function geçirilemez.
}

const BRAND = [
  { name: "brand-red-500", hex: "#D83A3A", className: "bg-brand-red-500" },
  { name: "brand-red-600", hex: "#C62828", className: "bg-brand-red-600" },
  { name: "brand-red-700", hex: "#A61B1B", className: "bg-brand-red-700" },
  {
    name: "brand-red-100",
    hex: "#FDEAE8",
    className: "bg-brand-red-100",
  },
  { name: "ink-800", hex: "#222226", className: "bg-ink-800" },
  { name: "ink-900", hex: "#151518", className: "bg-ink-900" },
  { name: "ink-950", hex: "#0D0D0F", className: "bg-ink-950" },
];

const NEUTRAL = [
  { name: "paper-50", hex: "#FAF9F7", className: "bg-paper-50" },
  { name: "paper-100", hex: "#F3F1EE", className: "bg-paper-100" },
  { name: "stone-200", hex: "#E5E1DC", className: "bg-stone-200" },
  { name: "stone-400", hex: "#AAA49D", className: "bg-stone-400" },
  { name: "stone-600", hex: "#6D6862", className: "bg-stone-600" },
  { name: "stone-800", hex: "#393633", className: "bg-stone-800" },
];

const STATE = [
  { name: "state-success", hex: "#287A55", className: "bg-state-success" },
  { name: "state-info", hex: "#35658F", className: "bg-state-info" },
  { name: "state-warning", hex: "#B7791F", className: "bg-state-warning" },
  { name: "state-error", hex: "#B42318", className: "bg-state-error" },
  {
    name: "state-success-surface",
    hex: "#E8F3ED",
    className: "bg-state-success-surface",
  },
  {
    name: "state-warning-surface",
    hex: "#FFF4D6",
    className: "bg-state-warning-surface",
  },
  {
    name: "state-error-surface",
    hex: "#FDEAE8",
    className: "bg-state-error-surface",
  },
  {
    name: "state-info-surface",
    hex: "#E8EEF5",
    className: "bg-state-info-surface",
  },
];

const EDITOR = [
  {
    name: "draft-ai-changed",
    hex: "#FFF1F0",
    className: "bg-draft-ai-changed",
  },
  { name: "draft-approved", hex: "#E8F3ED", className: "bg-draft-approved" },
  {
    name: "primary-disabled",
    hex: "#D6A0A0",
    className: "bg-primary-disabled",
  },
  { name: "cta-muted", hex: "#F3D2D0", className: "bg-cta-muted" },
  { name: "admin-bg", hex: "#ECEAE7", className: "bg-admin-bg" },
];

function Swatches({
  title,
  items,
}: {
  title: string;
  items: { name: string; hex: string; className: string }[];
}) {
  return (
    <div>
      <h3 className="text-card-title font-semibold text-ink-950">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.name}
            className="overflow-hidden rounded-[var(--radius)] border border-stone-200"
          >
            <div className={`h-16 ${item.className}`} />
            <div className="bg-paper-50 px-3 py-2">
              <p className="text-helper font-medium text-ink-950">
                {item.name}
              </p>
              <p className="text-helper text-stone-600" data-numeric>
                {item.hex}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="bg-paper-100 py-14">
      <Container className="space-y-14">
        <header>
          <h1 className="font-heading text-page-title text-ink-950">
            Stil rehberi
          </h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            design.md&apos;deki tasarım sisteminin koddaki karşılığı. Değerler
            burada dokümanla birebir eşleşmiyorsa kod yanlıştır.
          </p>
        </header>

        <section className="space-y-10">
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Renkler
          </h2>
          <Swatches title="Marka" items={BRAND} />
          <Swatches title="Nötr" items={NEUTRAL} />
          <Swatches title="Durum" items={STATE} />
          <Swatches title="Editör ve noktasal" items={EDITOR} />
        </section>

        <section>
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Tipografi
          </h2>
          <div className="mt-6 space-y-6 rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-6">
            <div>
              <p className="text-helper text-stone-600">
                text-hero · 64px / 700
              </p>
              <p className="font-heading text-hero text-ink-950">
                Sözleşmeni anlat
              </p>
            </div>
            <div>
              <p className="text-helper text-stone-600">
                text-section · 40px / 700
              </p>
              <p className="font-heading text-section text-ink-950">
                Bölüm başlığı
              </p>
            </div>
            <div>
              <p className="text-helper text-stone-600">
                text-page-title · 30px / 700
              </p>
              <p className="font-heading text-page-title text-ink-950">
                Dashboard sayfa başlığı
              </p>
            </div>
            <div>
              <p className="text-helper text-stone-600">
                text-card-title · 17px / 650
              </p>
              <p className="text-card-title text-ink-950">Kart başlığı</p>
            </div>
            <div>
              <p className="text-helper text-stone-600">
                text-body · ~15.5px / 400
              </p>
              <p className="text-body text-stone-800">
                Gövde metni. Yüksek okunabilirlikte nötr sans-serif.
              </p>
            </div>
            <div>
              <p className="text-helper text-stone-600">
                text-helper · 13.5px / 400
              </p>
              <p className="text-helper text-stone-600">Yardımcı metin.</p>
            </div>
            <div>
              <p className="text-helper text-stone-600">
                text-contract · 16px / 400 · serif
              </p>
              <p className="font-contract text-contract text-stone-800">
                İşbu sözleşme, taraflar arasında aşağıdaki koşullarla
                akdedilmiştir.
              </p>
            </div>
            <div>
              <p className="text-helper text-stone-600">
                Tabular sayılar (data-numeric)
              </p>
              <p className="text-body text-stone-800" data-numeric>
                45.000,00 / 11.111,11 / 90.909,09
              </p>
            </div>
            <div>
              <p className="text-helper text-stone-600">
                font-mono · yalnızca gerçek kod/anahtar gösteriminde (§7.4)
              </p>
              <p className="font-mono text-body text-stone-800">
                8b2f6e10-4a3c-4e9d-9c1a-2f7d6b0e5c31
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Butonlar
          </h2>
          <div className="mt-6 space-y-6">
            <div className="rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-6">
              <p className="mb-4 text-helper text-stone-600">
                Açık yüzey üzerinde
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Birincil</Button>
                <Button variant="secondary">İkincil</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Tehlikeli</Button>
                <Button disabled>Devre dışı</Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button size="sm">Küçük</Button>
                <Button size="md">Orta</Button>
                <Button size="lg">Büyük</Button>
              </div>
            </div>

            <div className="rounded-[var(--radius)] border border-ink-800 bg-ink-950 p-6">
              <p className="mb-4 text-helper text-stone-400">
                Koyu yüzey üzerinde (dark mode değil — marka yüzeyi)
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Birincil</Button>
                <Button variant="onDark">Koyu üzeri ikincil</Button>
                <Button variant="inverse">Ters</Button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Durum badge&apos;leri
          </h2>
          <div className="mt-6 flex flex-wrap gap-3 rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-6">
            <StatusBadge status="draft">Taslak</StatusBadge>
            <StatusBadge status="review">İnceleniyor</StatusBadge>
            <StatusBadge status="ready">Hazır</StatusBadge>
            <StatusBadge status="shared">Paylaşıldı</StatusBadge>
            <StatusBadge status="error">Hata</StatusBadge>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Form alanları
          </h2>
          <div className="mt-6 max-w-sm space-y-4 rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-6">
            <Field id="sg-email" label="E-posta">
              <Input type="email" placeholder="ad@sirket.com" />
            </Field>
            <Field id="sg-name" label="Ad Soyad" error="Bu alan zorunludur.">
              <Input placeholder="Ad Soyad" />
            </Field>
            <Field
              id="sg-notes"
              label="Özel şartlar"
              description="Input ile aynı kenarlık/odak dili; tek farkı resize-y."
            >
              <Textarea placeholder="Tarafların eklemek istediği maddeler" />
            </Field>
            <Field id="sg-radio" asGroup required label="Bir seçenek seç">
              <RadioGroup defaultValue="a">
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value="a" id="sg-radio-a" />
                  <Label htmlFor="sg-radio-a">Birinci seçenek</Label>
                </div>
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value="b" id="sg-radio-b" />
                  <Label htmlFor="sg-radio-b">İkinci seçenek</Label>
                </div>
              </RadioGroup>
            </Field>
            <CheckboxField id="sg-check" required label="Koşulları okudum, kabul ediyorum.">
              <Checkbox defaultChecked />
            </CheckboxField>
            <CheckboxField id="sg-check-empty" label="Bilgilendirme e-postası almak istiyorum.">
              <Checkbox />
            </CheckboxField>
            <CheckboxField
              id="sg-check-error"
              required
              label="Hatalı onay kutusu"
              error="Bu alan zorunludur."
            >
              <Checkbox />
            </CheckboxField>
            <CheckboxField id="sg-check-disabled" label="Devre dışı seçenek">
              <Checkbox disabled />
            </CheckboxField>
            <Field id="sg-radio-error" asGroup label="Hatalı grup" error="Bu alan zorunludur.">
              <RadioGroup>
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value="a" id="sg-radio-error-a" />
                  <Label htmlFor="sg-radio-error-a">Birinci seçenek</Label>
                </div>
                <div className="flex items-center gap-2.5">
                  <RadioGroupItem value="b" id="sg-radio-error-b" />
                  <Label htmlFor="sg-radio-error-b">İkinci seçenek</Label>
                </div>
              </RadioGroup>
            </Field>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Kartlar
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Açık kart</CardTitle>
                <CardDescription>Varsayılan yüzey — border tabanlı.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body text-stone-800">İçerik alanı.</p>
              </CardContent>
            </Card>
            <Card tone="dark">
              <CardHeader>
                <CardTitle className="text-paper-50">Koyu kart</CardTitle>
                <CardDescription tone="dark">§7.3 kredi özeti gibi.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body text-paper-50">İçerik alanı.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Kullanım çubuğu ve bildirimler
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-6">
              <p className="mb-2 text-helper text-stone-600">1 / 3 kredi kullanıldı</p>
              <Progress value={33} indicatorClassName="bg-ink-800" />
            </div>
            <Alert variant="neutral">
              <AlertDescription>
                Paketinin sınırına yaklaştın.{" "}
                <span className="text-brand-red-700 underline underline-offset-4">
                  Yükselt
                </span>
              </AlertDescription>
            </Alert>
            <Alert variant="error">
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>İşlem tamamlanamadı.</AlertDescription>
            </Alert>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Tablo, menü ve onay modalı
          </h2>
          <div className="mt-6 space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Belge</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Hizmet sözleşmesi</TableCell>
                  <TableCell>
                    <StatusBadge status="ready">Hazır</StatusBadge>
                  </TableCell>
                  <TableCell className="text-right" data-numeric>
                    1 kredi
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">Menü aç</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Hesap</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Ayarlar</DropdownMenuItem>
                  <DropdownMenuItem>Çıkış yap</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ConfirmDialog
                trigger={<Button variant="danger">Sözleşmeyi sil</Button>}
                title="Sözleşmeyi sil"
                description="Bu işlem geri alınamaz."
                confirmLabel="Sil"
                cancelLabel="Vazgeç"
                onConfirm={noopServerAction}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-[1.5rem] font-bold text-ink-950">
            Yüzey, kenarlık ve gölge
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-5">
              <p className="text-helper text-stone-600">
                Border tabanlı (tercih edilen)
              </p>
            </div>
            <div className="rounded-[var(--radius)] bg-paper-50 p-5 shadow-card">
              <p className="text-helper text-stone-600">
                shadow-card · 0 4px 16px rgba(13,13,15,.08)
              </p>
            </div>
            <div className="rounded-[var(--radius)] bg-paper-50 p-5 ring-2 ring-brand-red-600">
              <p className="text-helper text-stone-600">
                Odak halkası · brand-red-600
              </p>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
