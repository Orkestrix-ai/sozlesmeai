import type { MessageKeys, Messages, NestedKeyOf } from "next-intl";

/**
 * Kullanım Koşulları ve Gizlilik Politikası'nın madde yapısı.
 *
 * Anahtarlar KISA değil TAM yol tutar ("legal.terms.articles.parties.p1").
 * Sebebi `PLANS`teki (src/components/landing/pricing-section.tsx) ile aynı:
 * `.map` destructuring'i madde kimliği ile blok anahtarları arasındaki
 * korelasyonu kopardığı için `legal.terms.articles.${id}.${blockKey}` şablonu
 * tip düzeyinde çapraz çarpıma dönüşür ve var olmayan yollar üretir. Tam yol
 * yazınca her anahtar doğrudan `tr.json` şemasına karşı denetleniyor.
 *
 * Madde numarası mesaja gömülmez; `LegalDocument` diziden üretir. Böylece
 * madde sırası değiştiğinde metinlere dokunmak gerekmez.
 *
 * `id` locale'den bağımsızdır: içindekiler bağlantıları iki dilde de aynı
 * çapaya gider, bir dilde paylaşılan bağlantı diğerinde de çalışır.
 */

/**
 * `useTranslations()` (namespace'siz) ile çağrılabilen tam mesaj yolu.
 * `tr.json` şemasından türer — var olmayan bir yol yazmak derleme hatasıdır.
 *
 * `ReturnType<typeof useTranslations>` ile türetilemez: jenerik varsayılanı
 * `never` olduğu için `NamespacedMessageKeys` her namespace'e GÖRECELİ
 * anahtarların birleşimine çözülür ve kök yollar ("legal.…") reddedilir.
 */
type MessageKey = MessageKeys<Messages, NestedKeyOf<Messages>>;

export type LegalBlock =
  | { kind: "p"; key: MessageKey }
  | { kind: "ul"; items: readonly MessageKey[] }
  | { kind: "dl"; rows: readonly { label: MessageKey; value: MessageKey }[] };

export type LegalArticle = {
  id: string;
  title: MessageKey;
  blocks: readonly LegalBlock[];
};

/** Madde 1'deki kimlik künyesi — `legal.entity` tek doldurma noktasıdır. */
const ENTITY_IDENTITY: LegalBlock = {
  kind: "dl",
  rows: [
    { label: "legal.entity.legalNameLabel", value: "legal.entity.legalName" },
    { label: "legal.entity.tradeNameLabel", value: "legal.entity.tradeName" },
    { label: "legal.entity.addressLabel", value: "legal.entity.address" },
    { label: "legal.entity.mersisLabel", value: "legal.entity.mersis" },
    { label: "legal.entity.taxOfficeLabel", value: "legal.entity.taxOffice" },
    { label: "legal.entity.websiteLabel", value: "legal.entity.website" },
  ],
};

/**
 * Son maddedeki iletişim künyesi.
 *
 * `tradeName` burada ZORUNLU: ticaret unvanı henüz kurulmadığı için
 * `legalName` boş, adres/e-posta/KEP/web sitesi de boş. `tradeName` olmasaydı
 * satırların hepsi elenir, `dl` `null` döner ve maddenin "iletişim bilgileri
 * aşağıdadır" cümlesi altında hiçbir şey olmadan asılı kalırdı.
 */
const ENTITY_CONTACT: LegalBlock = {
  kind: "dl",
  rows: [
    { label: "legal.entity.legalNameLabel", value: "legal.entity.legalName" },
    { label: "legal.entity.tradeNameLabel", value: "legal.entity.tradeName" },
    { label: "legal.entity.addressLabel", value: "legal.entity.address" },
    { label: "legal.entity.emailLabel", value: "legal.entity.email" },
    { label: "legal.entity.kepLabel", value: "legal.entity.kep" },
    { label: "legal.entity.websiteLabel", value: "legal.entity.website" },
  ],
};

export const TERMS_ARTICLES: readonly LegalArticle[] = [
  {
    id: "parties",
    title: "legal.terms.articles.parties.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.parties.p1" },
      ENTITY_IDENTITY,
      { kind: "p", key: "legal.terms.articles.parties.p2" },
    ],
  },
  {
    id: "definitions",
    title: "legal.terms.articles.definitions.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.definitions.p1" },
      {
        kind: "ul",
        items: [
          "legal.terms.articles.definitions.i1",
          "legal.terms.articles.definitions.i2",
          "legal.terms.articles.definitions.i3",
          "legal.terms.articles.definitions.i4",
          "legal.terms.articles.definitions.i5",
          // i7 ("Paket") kaldırıldı — abonelik kademesi diye bir şey kalmadı.
          "legal.terms.articles.definitions.i6",
        ],
      },
    ],
  },
  {
    id: "account",
    title: "legal.terms.articles.account.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.account.p1" },
      { kind: "p", key: "legal.terms.articles.account.p2" },
      { kind: "p", key: "legal.terms.articles.account.p3" },
    ],
  },
  {
    id: "nature",
    title: "legal.terms.articles.nature.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.nature.p1" },
      { kind: "p", key: "legal.terms.articles.nature.p2" },
      { kind: "p", key: "legal.terms.articles.nature.p3" },
    ],
  },
  {
    id: "ai-output",
    title: "legal.terms.articles.aiOutput.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.aiOutput.p1" },
      { kind: "p", key: "legal.terms.articles.aiOutput.p2" },
      { kind: "p", key: "legal.terms.articles.aiOutput.p3" },
      { kind: "p", key: "legal.terms.articles.aiOutput.p4" },
    ],
  },
  {
    id: "acceptable-use",
    title: "legal.terms.articles.acceptableUse.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.acceptableUse.p1" },
      {
        kind: "ul",
        items: [
          "legal.terms.articles.acceptableUse.i1",
          "legal.terms.articles.acceptableUse.i2",
          "legal.terms.articles.acceptableUse.i3",
          "legal.terms.articles.acceptableUse.i4",
          "legal.terms.articles.acceptableUse.i5",
          "legal.terms.articles.acceptableUse.i6",
        ],
      },
      { kind: "p", key: "legal.terms.articles.acceptableUse.p2" },
    ],
  },
  {
    // Çapa (`#plans`) BİLEREK korunuyor: madde kimlikleri dilden bağımsız
    // derin bağlantılardır, paylaşılmış bir /terms#plans linki kırılmamalı.
    // İçerik paket/abonelikten kredi modeline göre yeniden yazıldı.
    id: "plans",
    title: "legal.terms.articles.plans.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.plans.p1" },
      { kind: "p", key: "legal.terms.articles.plans.p2" },
      { kind: "p", key: "legal.terms.articles.plans.p3" },
      { kind: "p", key: "legal.terms.articles.plans.p4" },
      { kind: "p", key: "legal.terms.articles.plans.p5" },
    ],
  },
  {
    id: "intellectual-property",
    title: "legal.terms.articles.ip.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.ip.p1" },
      { kind: "p", key: "legal.terms.articles.ip.p2" },
      { kind: "p", key: "legal.terms.articles.ip.p3" },
    ],
  },
  {
    id: "sharing",
    title: "legal.terms.articles.sharing.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.sharing.p1" },
      { kind: "p", key: "legal.terms.articles.sharing.p2" },
      { kind: "p", key: "legal.terms.articles.sharing.p3" },
      { kind: "p", key: "legal.terms.articles.sharing.p4" },
    ],
  },
  {
    id: "availability",
    title: "legal.terms.articles.availability.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.availability.p1" },
      { kind: "p", key: "legal.terms.articles.availability.p2" },
      { kind: "p", key: "legal.terms.articles.availability.p3" },
    ],
  },
  {
    id: "liability",
    title: "legal.terms.articles.liability.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.liability.p1" },
      { kind: "p", key: "legal.terms.articles.liability.p2" },
      { kind: "p", key: "legal.terms.articles.liability.p3" },
      { kind: "p", key: "legal.terms.articles.liability.p4" },
    ],
  },
  {
    id: "termination",
    title: "legal.terms.articles.termination.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.termination.p1" },
      { kind: "p", key: "legal.terms.articles.termination.p2" },
      { kind: "p", key: "legal.terms.articles.termination.p3" },
    ],
  },
  {
    id: "changes",
    title: "legal.terms.articles.changes.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.changes.p1" },
      { kind: "p", key: "legal.terms.articles.changes.p2" },
    ],
  },
  {
    id: "governing-law",
    title: "legal.terms.articles.law.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.law.p1" },
      { kind: "p", key: "legal.terms.articles.law.p2" },
      { kind: "p", key: "legal.terms.articles.law.p3" },
    ],
  },
  {
    id: "contact",
    title: "legal.terms.articles.contact.title",
    blocks: [
      { kind: "p", key: "legal.terms.articles.contact.p1" },
      ENTITY_CONTACT,
      { kind: "p", key: "legal.terms.articles.contact.p2" },
    ],
  },
];

export const PRIVACY_ARTICLES: readonly LegalArticle[] = [
  {
    id: "controller",
    title: "legal.privacy.articles.controller.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.controller.p1" },
      ENTITY_IDENTITY,
      { kind: "p", key: "legal.privacy.articles.controller.p2" },
    ],
  },
  {
    id: "data-categories",
    title: "legal.privacy.articles.dataCategories.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.dataCategories.p1" },
      {
        kind: "ul",
        items: [
          "legal.privacy.articles.dataCategories.i1",
          "legal.privacy.articles.dataCategories.i2",
          "legal.privacy.articles.dataCategories.i3",
          "legal.privacy.articles.dataCategories.i4",
          "legal.privacy.articles.dataCategories.i5",
          "legal.privacy.articles.dataCategories.i6",
          "legal.privacy.articles.dataCategories.i7",
        ],
      },
      { kind: "p", key: "legal.privacy.articles.dataCategories.p2" },
    ],
  },
  {
    id: "collection",
    title: "legal.privacy.articles.collection.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.collection.p1" },
      { kind: "p", key: "legal.privacy.articles.collection.p2" },
    ],
  },
  {
    id: "purposes",
    title: "legal.privacy.articles.purposes.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.purposes.p1" },
      {
        kind: "ul",
        items: [
          "legal.privacy.articles.purposes.i1",
          "legal.privacy.articles.purposes.i2",
          "legal.privacy.articles.purposes.i3",
          "legal.privacy.articles.purposes.i4",
          "legal.privacy.articles.purposes.i5",
          "legal.privacy.articles.purposes.i6",
        ],
      },
      { kind: "p", key: "legal.privacy.articles.purposes.p2" },
    ],
  },
  {
    id: "ai-providers",
    title: "legal.privacy.articles.aiProviders.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.aiProviders.p1" },
      { kind: "p", key: "legal.privacy.articles.aiProviders.p2" },
      { kind: "p", key: "legal.privacy.articles.aiProviders.p3" },
      {
        kind: "ul",
        items: [
          "legal.privacy.articles.aiProviders.i1",
          "legal.privacy.articles.aiProviders.i2",
        ],
      },
      { kind: "p", key: "legal.privacy.articles.aiProviders.p4" },
      { kind: "p", key: "legal.privacy.articles.aiProviders.p5" },
    ],
  },
  {
    id: "cookies",
    title: "legal.privacy.articles.cookies.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.cookies.p1" },
      {
        kind: "dl",
        rows: [
          {
            label: "legal.privacy.articles.cookies.r1Label",
            value: "legal.privacy.articles.cookies.r1Value",
          },
          {
            label: "legal.privacy.articles.cookies.r2Label",
            value: "legal.privacy.articles.cookies.r2Value",
          },
          {
            label: "legal.privacy.articles.cookies.r3Label",
            value: "legal.privacy.articles.cookies.r3Value",
          },
        ],
      },
      { kind: "p", key: "legal.privacy.articles.cookies.p2" },
    ],
  },
  {
    id: "transfers",
    title: "legal.privacy.articles.transfers.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.transfers.p1" },
      { kind: "p", key: "legal.privacy.articles.transfers.p2" },
      { kind: "p", key: "legal.privacy.articles.transfers.p3" },
    ],
  },
  {
    id: "retention",
    title: "legal.privacy.articles.retention.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.retention.p1" },
      { kind: "p", key: "legal.privacy.articles.retention.p2" },
      { kind: "p", key: "legal.privacy.articles.retention.p3" },
      { kind: "p", key: "legal.privacy.articles.retention.p4" },
    ],
  },
  {
    id: "sharing",
    title: "legal.privacy.articles.sharing.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.sharing.p1" },
      { kind: "p", key: "legal.privacy.articles.sharing.p2" },
      { kind: "p", key: "legal.privacy.articles.sharing.p3" },
    ],
  },
  {
    id: "security",
    title: "legal.privacy.articles.security.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.security.p1" },
      {
        kind: "ul",
        items: [
          "legal.privacy.articles.security.i1",
          "legal.privacy.articles.security.i2",
          "legal.privacy.articles.security.i3",
          "legal.privacy.articles.security.i4",
        ],
      },
      { kind: "p", key: "legal.privacy.articles.security.p2" },
    ],
  },
  {
    id: "rights",
    title: "legal.privacy.articles.rights.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.rights.p1" },
      {
        kind: "ul",
        items: [
          "legal.privacy.articles.rights.i1",
          "legal.privacy.articles.rights.i2",
          "legal.privacy.articles.rights.i3",
          "legal.privacy.articles.rights.i4",
          "legal.privacy.articles.rights.i5",
          "legal.privacy.articles.rights.i6",
          "legal.privacy.articles.rights.i7",
          "legal.privacy.articles.rights.i8",
        ],
      },
      { kind: "p", key: "legal.privacy.articles.rights.p2" },
      { kind: "p", key: "legal.privacy.articles.rights.p3" },
      { kind: "p", key: "legal.privacy.articles.rights.p4" },
    ],
  },
  {
    id: "processors",
    title: "legal.privacy.articles.processors.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.processors.p1" },
      {
        kind: "dl",
        rows: [
          {
            label: "legal.privacy.articles.processors.r1Label",
            value: "legal.privacy.articles.processors.r1Value",
          },
          {
            label: "legal.privacy.articles.processors.r2Label",
            value: "legal.privacy.articles.processors.r2Value",
          },
          {
            label: "legal.privacy.articles.processors.r3Label",
            value: "legal.privacy.articles.processors.r3Value",
          },
          {
            label: "legal.privacy.articles.processors.r4Label",
            value: "legal.privacy.articles.processors.r4Value",
          },
        ],
      },
      { kind: "p", key: "legal.privacy.articles.processors.p2" },
      { kind: "p", key: "legal.privacy.articles.processors.p3" },
    ],
  },
  {
    id: "children",
    title: "legal.privacy.articles.children.title",
    blocks: [{ kind: "p", key: "legal.privacy.articles.children.p1" }],
  },
  {
    id: "changes",
    title: "legal.privacy.articles.changes.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.changes.p1" },
      { kind: "p", key: "legal.privacy.articles.changes.p2" },
    ],
  },
  {
    id: "contact",
    title: "legal.privacy.articles.contact.title",
    blocks: [
      { kind: "p", key: "legal.privacy.articles.contact.p1" },
      ENTITY_CONTACT,
      { kind: "p", key: "legal.privacy.articles.contact.p2" },
    ],
  },
];

/** Belge kimliği -> madde listesi. Sayfalar bunu `document` propuyla seçer. */
export const LEGAL_DOCUMENTS = {
  terms: {
    articles: TERMS_ARTICLES,
    title: "legal.terms.title",
    intro: "legal.terms.intro",
  },
  privacy: {
    articles: PRIVACY_ARTICLES,
    title: "legal.privacy.title",
    intro: "legal.privacy.intro",
  },
} satisfies Record<
  string,
  { articles: readonly LegalArticle[]; title: MessageKey; intro: MessageKey }
>;

export type LegalDocumentId = keyof typeof LEGAL_DOCUMENTS;
