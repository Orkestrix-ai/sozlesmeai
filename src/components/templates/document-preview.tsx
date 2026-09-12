"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { ContractDocument } from "@/components/contracts/contract-document";
import { A4 } from "@/lib/contracts/document-model";
import type { ContractSection } from "@/lib/contracts/schema";

const ZOOM_STEPS = [75, 90, 100, 110, 125] as const;
const DEFAULT_ZOOM_INDEX = 2;

/**
 * Belge çalışma alanı (tezgâh) + üst bar. `ContractDocument`'ı sarar; belgenin
 * kendisini ÇİZMEZ — sayfalama, tipografi ve imza bloğu orada.
 *
 * Sözleşme ekranındaki (draft-panel.tsx) tezgâhın aynısıdır ve bilerek aynı
 * sınıf adlarını (`contract-toolbar` / `contract-desk`) kullanır: `@media
 * print` kuralları ikisini birden yakalasın. İki tezgâh şimdilik ayrı duruyor
 * çünkü draft-panel'inki sürüm seçici ve düzenleme moduyla iç içe; ortak bir
 * kabuk çıkarmak o bileşeni de yeniden yazmayı gerektirirdi.
 *
 * `zoom` YALNIZCA görsel: `fitScale` ile çarpılıp CSS transform'a verilir,
 * sayfa ölçüsüne veya PDF çıktısına dokunmaz (ölçüm her zaman 1x'te yapılır).
 */
function DocumentPreview({
  title,
  sections,
}: {
  title: string;
  sections: ContractSection[];
}) {
  const t = useTranslations("dashboard.contractScreen");
  const tTemplates = useTranslations("dashboard.templates");

  const [zoomIndex, setZoomIndex] = React.useState<number>(DEFAULT_ZOOM_INDEX);
  const zoom = ZOOM_STEPS[zoomIndex];

  // Dar ekranda A4 taşmasın (design.md §12 "mobilde kullanılabilir mi").
  const deskRef = React.useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = React.useState(1);

  React.useEffect(() => {
    const node = deskRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 32;
      setFitScale(Math.min(1, available / A4.widthPx));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const documentScale = fitScale * (zoom / 100);

  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-paper-100">
      <div className="contract-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-paper-100 p-4">
        <h2 className="text-card-title font-heading text-ink-950">
          {tTemplates("builder.previewTitle")}
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded-[var(--radius-sm)] border border-stone-200 px-1.5 py-0.5 text-helper text-stone-600">
            {t("preview.a4")}
          </span>
          <div className="flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-stone-200">
            <button
              type="button"
              onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              disabled={zoomIndex === 0}
              aria-label={t("preview.zoomOut")}
              className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-stone-600 hover:bg-paper-50 disabled:opacity-30"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </button>
            <span
              className="min-w-[3rem] text-center text-helper text-stone-600"
              aria-label={t("preview.zoomLevel", { zoom })}
              data-numeric
            >
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              aria-label={t("preview.zoomIn")}
              className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-stone-600 hover:bg-paper-50 disabled:opacity-30"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={deskRef}
        className="contract-desk flex-1 overflow-auto bg-paper-100 p-4 shadow-[inset_0_2px_4px_rgba(13,13,15,0.05)]"
      >
        {/*
          Sözleşme henüz KAYDEDİLMEDİ; ilk kayıtta v1 olacağı için sürüm satırı
          1 gösterilir. Kullanıcının göreceği belge ile oluşturulduktan sonraki
          /contracts/[id] ekranındaki belge böylece birebir aynı olur.
        */}
        <ContractDocument title={title} versionNo={1} sections={sections} scale={documentScale} />
      </div>
    </div>
  );
}

export { DocumentPreview };
