import { useTranslations } from "next-intl";

import { Container } from "@/components/landing/container";
import { Link } from "@/i18n/navigation";
import {
  LEGAL_DOCUMENTS,
  type LegalBlock,
  type LegalDocumentId,
} from "@/components/legal/documents";

/**
 * Kullanım Koşulları ve Gizlilik Politikası'nın ortak render'ı.
 *
 * Metnin tamamı `messages/*.json`daki `legal` namespace'inde; buradaki tek iş
 * `documents.ts`teki madde şemasını tipografiye çevirmek.
 *
 * Ölçü 720 px: design.md §4 gövde metni 15–16 px, satır uzunluğu bu genişlikte
 * ~85 karakterde kalıyor. Başlıklar `text-card-title`; globals.css'te 30 px ile
 * 17 px arasında token yok ve style-guide dışında keyfi punto kullanılmıyor,
 * bu yüzden yeni bir token icat etmek yerine mevcut ölçek kullanıldı.
 */
export function LegalDocument({ document }: { document: LegalDocumentId }) {
  const t = useTranslations();
  const { articles, title, intro } = LEGAL_DOCUMENTS[document];

  return (
    <Container className="max-w-[720px] py-16 sm:py-20">
      <header>
        <h1 className="font-heading text-page-title text-ink-950">{t(title)}</h1>
        <p className="mt-2 text-helper text-stone-500">
          {t("legal.effectiveDateLabel")}: {t("legal.effectiveDate")}
        </p>
        <p className="mt-6 text-body leading-relaxed text-stone-600">{t(intro)}</p>
      </header>

      {/*
        İçindekiler: `#` bağlantıları site-footer'daki `isAnchor` ayrımıyla
        tutarlı biçimde düz `<a>` ile veriliyor — `@/i18n/navigation`ın `Link`i
        locale önekini eklemeye çalışır, sayfa içi çapa için gereksizdir.
      */}
      <nav aria-labelledby="legal-toc" className="mt-10 border-y border-stone-200 py-6">
        <h2 id="legal-toc" className="font-heading text-card-title text-ink-950">
          {t("legal.tocTitle")}
        </h2>
        <ol className="mt-3 space-y-1.5">
          {articles.map((article, index) => (
            <li key={article.id} className="text-helper text-stone-600">
              <a href={`#${article.id}`} className="hover:text-ink-950">
                <span className="tabular-nums">{index + 1}.</span> {t(article.title)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-10">
        {articles.map((article, index) => (
          <section key={article.id} id={article.id} className="scroll-mt-24">
            <h2 className="font-heading text-card-title text-ink-950">
              <span className="tabular-nums">{index + 1}.</span> {t(article.title)}
            </h2>
            <div className="mt-3 space-y-3">
              {article.blocks.map((block, blockIndex) => (
                <Block key={blockIndex} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 text-helper">
        <Link href="/" className="font-medium text-brand-red-600 hover:text-brand-red-700">
          {t("legal.backHome")}
        </Link>
      </p>
    </Container>
  );
}

function Block({ block }: { block: LegalBlock }) {
  const t = useTranslations();

  if (block.kind === "p") {
    return <p className="text-body leading-relaxed text-stone-600">{t(block.key)}</p>;
  }

  if (block.kind === "ul") {
    return (
      <ul className="list-disc space-y-2 pl-5 text-body leading-relaxed text-stone-600 marker:text-stone-400">
        {block.items.map((item) => (
          <li key={item}>{t(item)}</li>
        ))}
      </ul>
    );
  }

  /*
    Künye satırları: değeri boş olan satır hiç basılmaz. `legal.entity`nin
    doldurulmamış alanları (adres, MERSİS, e-posta…) böylece sayfada boş
    etiket bırakmaz; gerçek bilgi girildiği anda satır kendiliğinden görünür.
  */
  const rows = block.rows.filter((row) => t(row.value).trim() !== "");
  if (rows.length === 0) return null;

  return (
    <dl className="space-y-2 rounded-[10px] border border-stone-200 p-4">
      {rows.map((row) => (
        <div key={row.value} className="sm:flex sm:gap-3">
          <dt className="text-helper font-medium text-ink-950 sm:w-52 sm:shrink-0">
            {t(row.label)}
          </dt>
          <dd className="text-helper leading-relaxed text-stone-600">{t(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
