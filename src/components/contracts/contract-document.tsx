"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  A4,
  A4_CONTENT_HEIGHT,
  A4_CONTENT_WIDTH,
  buildDocumentBlocks,
  partyLabels,
  splitBodyParagraphs,
  type DocumentBlock,
} from "@/lib/contracts/document-model";
import type { ContractSection } from "@/lib/contracts/schema";

/**
 * design.md §8 sağ panel — artık kart listesi değil, GERÇEK BİR A4 BELGE.
 *
 * Sayfalama ölçümle yapılır: tüm parçalar ekran dışı gizli bir katmanda A4
 * içerik genişliğinde (682px) render edilip yükseklikleri okunur, sonra
 * 1003px'lik içerik kutularına sırayla paketlenir. Ölçüm HER ZAMAN 1x ölçekte
 * yapılır — zoom yalnızca görsel bir transform'dur (bkz. draft-panel.tsx) ve
 * sayfa sayısını değiştirmez.
 *
 * Bir maddenin başlığı ilk paragrafıyla aynı parçada durur, bu yüzden başlık
 * asla sayfa sonunda yetim kalmaz; uzun maddeler paragraf sınırından bölünür.
 */

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Sayfalar arası çalışma alanı boşluğu. Yükseklik hesabı buna bağlı, sabit tutun. */
const PAGE_GAP = 24;

type Fragment =
  | { id: string; kind: "title" }
  | { id: string; kind: "preamble"; block: Extract<DocumentBlock, { kind: "preamble" }> }
  | {
      id: string;
      kind: "article";
      block: Extract<DocumentBlock, { kind: "article" }>;
      text: string;
      head: boolean;
    }
  | { id: string; kind: "missing"; section: ContractSection }
  | { id: string; kind: "signature" }
  | { id: string; kind: "disclaimer" };

function buildFragments(blocks: DocumentBlock[]): Fragment[] {
  const fragments: Fragment[] = [{ id: "title", kind: "title" }];

  for (const block of blocks) {
    if (block.kind === "preamble") {
      fragments.push({ id: `preamble:${block.key}`, kind: "preamble", block });
    } else {
      splitBodyParagraphs(block.body).forEach((text, i) => {
        fragments.push({
          id: `article:${block.key}:${i}`,
          kind: "article",
          block,
          text,
          head: i === 0,
        });
      });
    }
    if (block.section.missing.length > 0) {
      fragments.push({ id: `missing:${block.key}`, kind: "missing", section: block.section });
    }
  }

  fragments.push({ id: "signature", kind: "signature" });
  fragments.push({ id: "disclaimer", kind: "disclaimer" });
  return fragments;
}

/** Açgözlü paketleme. Tek başına sayfadan uzun bir parça yine de yerleştirilir. */
function packPages(heights: number[]): number[][] {
  const pages: number[][] = [];
  let current: number[] = [];
  let used = 0;

  heights.forEach((height, index) => {
    if (current.length > 0 && used + height > A4_CONTENT_HEIGHT) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(index);
    used += height;
  });

  if (current.length > 0) pages.push(current);
  return pages.length > 0 ? pages : [[]];
}

/** Gövdedeki [köşeli parantezli] boşlukları sessizce işaretler — metni DEĞİŞTİRMEZ. */
function withPlaceholders(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]\n]{2,60}\])/g);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span
        key={index}
        className="rounded-[3px] bg-paper-100 px-1 text-stone-600 underline decoration-stone-400 decoration-dotted underline-offset-2"
      >
        {part}
      </span>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  );
}

const BODY_CLASS =
  "whitespace-pre-wrap text-justify hyphens-auto font-[family-name:var(--font-contract)] text-contract text-stone-800";

function ContractDocument({
  title,
  versionNo,
  sections,
  previousSections,
  scale = 1,
  className,
}: {
  title: string;
  versionNo: number;
  sections: ContractSection[];
  previousSections?: ContractSection[];
  /** Yalnızca görsel. transform layout'u etkilemediği için ölçüm bundan etkilenmez. */
  scale?: number;
  className?: string;
}) {
  const t = useTranslations("dashboard.contractScreen");
  const brand = useTranslations("nav")("brand");
  const locale = useLocale();

  const blocks = React.useMemo(() => buildDocumentBlocks(sections), [sections]);
  const fragments = React.useMemo(() => buildFragments(blocks), [blocks]);

  /**
   * "AI'ın son değiştirdiği" (design.md §8) = bir ÖNCEKİ sürüme göre değişmiş
   * bölüm. `lastEditedBy` tek başına bunu söylemez (AI'ın yazdığı her bölümde
   * kalıcı olarak "ai" kalır, o zaman da bütün belge pembe olurdu), bu yüzden
   * önceki sürümle karşılaştırılır. İlk taslakta önceki sürüm yoktur — hiçbir
   * şey vurgulanmaz, doğrusu da budur.
   */
  const changedKeys = React.useMemo(() => {
    const changed = new Set<string>();
    if (!previousSections) return changed;
    const before = new Map(previousSections.map((s) => [s.key, s]));
    for (const section of sections) {
      if (section.lastEditedBy !== "ai") continue;
      const prev = before.get(section.key);
      if (!prev || prev.body !== section.body || prev.title !== section.title) {
        changed.add(section.key);
      }
    }
    return changed;
  }, [sections, previousSections]);

  // Sunucu ile tarayıcının saat dilimi ayrılırsa (gün dönümüne yakın) iki
  // taraf farklı tarih üretebilir — metin için suppressHydrationWarning'in
  // tam olarak var olduğu durum. Bir state + effect turuna gerek yok.
  const today = new Date().toLocaleDateString(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [pages, setPages] = React.useState<number[][]>(() => [fragments.map((_, i) => i)]);
  const measureRef = React.useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const node = measureRef.current;
      if (cancelled || !node) return;
      const heights = Array.from(node.children).map((child) => (child as HTMLElement).offsetHeight);
      setPages(packPages(heights));
    };

    measure();
    // Serif yüz geç yüklenirse satır sayısı değişir — bir kez daha ölç.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fragments]);

  const derivedParties = partyLabels(blocks);
  const hasDerivedParties = derivedParties.length === 2;
  const partyOne = hasDerivedParties ? derivedParties[0] : t("document.signatureParty", { n: 1 });
  const partyTwo = hasDerivedParties ? derivedParties[1] : t("document.signatureParty", { n: 2 });

  const sectionTint = (section: ContractSection): string | null => {
    if (section.status === "approved") return "bg-draft-approved";
    if (changedKeys.has(section.key)) return "bg-draft-ai-changed";
    return null;
  };

  const renderFragment = (fragment: Fragment): React.ReactNode => {
    switch (fragment.kind) {
      case "title":
        return (
          <header className="pb-8 text-center">
            <h3 className="font-heading text-[1.4rem] font-bold uppercase leading-tight tracking-tight text-ink-950">
              {title}
            </h3>
            <p className="mt-2 text-helper text-stone-600">
              <span data-numeric>{t("document.version", { versionNo })}</span>
              <span suppressHydrationWarning> · {today}</span>
            </p>
          </header>
        );

      case "preamble": {
        const tint = sectionTint(fragment.block.section);
        return (
          <section className="pb-2">
            <h4 className="mb-3 font-heading text-helper font-semibold uppercase tracking-wider text-ink-950">
              {t("document.partiesHeading")}
            </h4>
            <div
              className={cn(
                "space-y-1.5 font-[family-name:var(--font-contract)] text-contract text-stone-800",
                tint && ["-mx-2 rounded-sm px-2 py-1", tint],
              )}
            >
              {fragment.block.lines.map((line, index) =>
                line.label ? (
                  <div key={index} className="flex gap-3">
                    <span className="min-w-[9rem] font-medium text-ink-950">{line.label}</span>
                    <span className="flex-1">{withPlaceholders(line.value)}</span>
                  </div>
                ) : (
                  <p key={index}>{withPlaceholders(line.value)}</p>
                ),
              )}
            </div>
          </section>
        );
      }

      case "article": {
        const tint = sectionTint(fragment.block.section);
        return (
          <section className={fragment.head ? "pt-5" : "pt-3"}>
            {fragment.head ? (
              <h4 className="mb-2 font-heading text-[1.0125rem] font-semibold leading-snug text-ink-950">
                {fragment.block.heading}
              </h4>
            ) : null}
            <p className={cn(BODY_CLASS, tint && ["-mx-2 rounded-sm px-2 py-1", tint])}>
              {withPlaceholders(fragment.text)}
            </p>
          </section>
        );
      }

      case "missing":
        return (
          <p className="mt-3 rounded-[var(--radius)] border border-dashed border-stone-200 bg-paper-100 px-3 py-2 text-helper text-stone-600">
            {t("draft.missingLabel")}: {fragment.section.missing.join(", ")}
          </p>
        );

      case "signature":
        return (
          <section className="pt-10">
            <div className="grid grid-cols-2 gap-10">
              {[partyOne, partyTwo].map((party, index) => (
                <div key={index}>
                  <p className="font-heading text-helper font-semibold uppercase tracking-wider text-ink-950">
                    {party}
                  </p>
                  <div className="mt-5 space-y-5">
                    <div>
                      <div className="h-7 border-b border-stone-400" />
                      <p className="mt-1 text-helper text-stone-600">
                        {t("document.signatureName")}
                      </p>
                    </div>
                    <div>
                      <div className="h-7 border-b border-stone-400" />
                      <p className="mt-1 text-helper text-stone-600">
                        {t("document.signatureSignature")}
                      </p>
                    </div>
                    <div>
                      <div className="h-7 border-b border-stone-400" />
                      <p className="mt-1 text-helper text-stone-600">
                        {t("document.signatureDate")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "disclaimer":
        return (
          <p className="pt-8 text-helper leading-relaxed text-stone-600">
            {t("document.disclaimer")}
          </p>
        );
    }
  };

  if (sections.length === 0) {
    return (
      <div
        className={cn("contract-scale relative mx-auto", className)}
        style={{ width: A4.widthPx * scale, height: A4.heightPx * scale }}
      >
        <div
          className="contract-scale"
          style={{ width: A4.widthPx, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <article
            className="contract-page flex flex-col items-center justify-center border border-stone-200 bg-paper-50 shadow-card"
            style={{ width: A4.widthPx, height: A4.heightPx }}
          >
            <p className="text-body text-stone-600">{t("draft.empty")}</p>
          </article>
        </div>
      </div>
    );
  }

  // Ölçeklenmemiş doğal yükseklik — sayfa sayısı bilindiği için kesin.
  const naturalHeight = pages.length * A4.heightPx + (pages.length - 1) * PAGE_GAP;

  return (
    <div
      className={cn("contract-scale relative mx-auto", className)}
      style={{ width: A4.widthPx * scale, height: naturalHeight * scale }}
    >
      {/* Ölçüm katmanı — ekran dışında, ölçeklenmiş ağacın DIŞINDA, a11y'den gizli. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="invisible pointer-events-none absolute -left-[10000px] top-0"
        style={{ width: A4_CONTENT_WIDTH }}
      >
        {fragments.map((fragment) => (
          <div key={fragment.id}>{renderFragment(fragment)}</div>
        ))}
      </div>

      <div
        className="contract-scale flex flex-col items-center"
        style={{
          width: A4.widthPx,
          gap: PAGE_GAP,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {pages.map((indices, pageIndex) => (
          <article
            key={pageIndex}
            className="contract-page relative flex shrink-0 flex-col border border-stone-200 bg-paper-50 shadow-card"
            style={{
              width: A4.widthPx,
              minHeight: A4.heightPx,
              paddingLeft: A4.padX,
              paddingRight: A4.padX,
              paddingTop: A4.padTop,
              paddingBottom: A4.padBottom,
            }}
          >
            <div className="flex-1">
              {indices.map((index) => (
                <React.Fragment key={fragments[index].id}>
                  {renderFragment(fragments[index])}
                </React.Fragment>
              ))}
            </div>
            <footer
              className="contract-page-footer absolute inset-x-0 bottom-0 flex items-center justify-between text-helper text-stone-400"
              style={{ paddingLeft: A4.padX, paddingRight: A4.padX, paddingBottom: 24 }}
            >
              <span>{brand}</span>
              <span data-numeric>
                {t("preview.pageOf", { page: pageIndex + 1, total: pages.length })}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

export { ContractDocument };
