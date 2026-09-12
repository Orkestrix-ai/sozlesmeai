"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContractDocument } from "@/components/contracts/contract-document";
import { A4 } from "@/lib/contracts/document-model";
import type { ContractSection } from "@/lib/contracts/schema";

export type VersionEntry = {
  id: string;
  versionNo: number;
  source: "ai_draft" | "ai_edit" | "manual";
  sections: ContractSection[];
};

export type Finding = {
  id: number;
  code: string;
  severity: "info" | "warning" | "error";
  sectionKey: string | null;
  detail: string;
};

const FINDING_CODES = [
  "party_name_mismatch",
  "date_inconsistency",
  "payment_mismatch",
  "undefined_term",
  "empty_critical_field",
  "conflicting_clause",
  "other",
] as const;

/** design.md §13 sınırları: %75 – %125. Zoom yalnızca ekranı etkiler. */
const ZOOM_STEPS = [75, 90, 100, 110, 125] as const;
const DEFAULT_ZOOM_INDEX = 2;

/**
 * design.md §8 sağ panel — paper-100 çalışma tezgâhı, üzerinde paper-50 A4
 * belge. Okuma modunda taslak <ContractDocument> ile gerçek bir sözleşme
 * belgesi olarak render edilir; ELLE DÜZENLEME modunda bölüm kartı editörü
 * (aşağıda) korunur — belge görünümü bir metin editörü değildir.
 */
function DraftPanel({
  status,
  contractTitle,
  versionNo,
  previousSections,
  sections,
  versions,
  viewingVersionId,
  onSelectVersion,
  canEdit,
  onSaveSections,
  saving,
  findings,
  onRunReview,
  reviewing,
  reviewError,
  onApprove,
  approving,
  shareSlot,
  onGeneratePdf,
  generatingPdf,
  pdfUrl,
  pdfError,
}: {
  status: "draft" | "review" | "ready" | "shared" | "error";
  contractTitle: string;
  versionNo: number;
  previousSections?: ContractSection[];
  sections: ContractSection[];
  versions: VersionEntry[];
  viewingVersionId: string | null;
  onSelectVersion: (id: string | null) => void;
  canEdit: boolean;
  onSaveSections: (sections: ContractSection[]) => Promise<boolean>;
  saving: boolean;
  findings: Finding[];
  onRunReview: () => void;
  reviewing: boolean;
  reviewError: boolean;
  onApprove: () => void;
  approving: boolean;
  shareSlot?: React.ReactNode;
  onGeneratePdf: () => void;
  generatingPdf: boolean;
  pdfUrl: string | null;
  pdfError: boolean;
}) {
  const t = useTranslations("dashboard.contractScreen");
  const tStatus = useTranslations("dashboard.status");
  const tVersions = useTranslations("dashboard.contractScreen.versions.sourceLabels");
  const tFindings = useTranslations("dashboard.contractScreen.review.findings");

  const [editMode, setEditMode] = React.useState(false);
  const [draft, setDraft] = React.useState<ContractSection[]>(sections);
  const isViewingHistory = viewingVersionId !== null;

  const [zoomIndex, setZoomIndex] = React.useState<number>(DEFAULT_ZOOM_INDEX);
  const zoom = ZOOM_STEPS[zoomIndex];

  /**
   * Dar ekranda A4 taşmasın (design.md §12 "mobilde kullanılabilir mi"):
   * tezgâh genişliği ölçülür, belge gerektiği kadar küçültülür. Kullanıcının
   * zoom'u bunun ÜSTÜNE çarpan olarak biner.
   */
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

  // `draft` yalnızca editMode true iken okunur (bkz. `displayed` altta) —
  // startEdit() zaten güncel `sections`'ı kopyalayarak başlatır, bu yüzden
  // `!editMode` durumunda ayrıca senkronize eden bir efekte gerek yok.

  // Kaydedilmemiş değişiklik varken sekmeyi kapatma uyarısı (FR-06).
  React.useEffect(() => {
    if (!editMode) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editMode]);

  const startEdit = () => {
    setDraft(sections);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraft(sections);
    setEditMode(false);
  };

  const save = async () => {
    const ok = await onSaveSections(draft);
    if (ok) setEditMode(false);
  };

  const updateSection = (index: number, patch: Partial<ContractSection>) => {
    setDraft((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeSection = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const addSection = () => {
    setDraft((prev) => [
      ...prev,
      { key: `section_${prev.length + 1}`, title: "", body: "", status: "draft", missing: [], lastEditedBy: "user" },
    ]);
  };

  const displayed = editMode ? draft : sections;
  // "draft"ta risk kontrolü tek birincil aksiyondur; "review"da onay öne
  // geçer; "ready"de ikisi de ikincildir (onay zaten verildi, design.md §5:
  // ekran başına tek birincil aksiyon — burada hiç kalmaması da geçerlidir).
  const reviewIsPrimary = status === "draft";

  return (
    // `w-full min-w-0`: tezgâh genişliği ResizeObserver ile ölçülüp belgenin
    // ölçeğini belirliyor. Panel içeriğine göre daralabilseydi belge genişliği
    // → panel genişliği → ölçek → belge genişliği diye geri besleme kurulurdu.
    <div className="flex h-full w-full min-w-0 flex-col bg-paper-100">
      <div className="contract-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-paper-100 p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-card-title font-heading text-ink-950">{t("draft.title")}</h2>
          <StatusBadge status={status}>{tStatus(status)}</StatusBadge>
        </div>
        <div className="flex items-center gap-2">
          {!editMode && (
            <>
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
            </>
          )}
          {versions.length > 0 && (
            <Select
              className="h-9 w-auto min-w-[10rem]"
              value={viewingVersionId ?? "latest"}
              onChange={(e) => onSelectVersion(e.target.value === "latest" ? null : e.target.value)}
              aria-label={t("versions.title")}
            >
              <option value="latest">{t("versions.current")}</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNo} — {tVersions(v.source)}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div
        ref={deskRef}
        className="contract-desk flex-1 overflow-auto bg-paper-100 p-4 shadow-[inset_0_2px_4px_rgba(13,13,15,0.05)]"
      >
        {isViewingHistory && (
          <Alert variant="neutral" className="mb-4 flex items-center justify-between gap-3">
            <AlertDescription>{t("draft.viewingOldVersion")}</AlertDescription>
            <Button variant="secondary" size="sm" onClick={() => onSelectVersion(null)}>
              {t("draft.backToLatest")}
            </Button>
          </Alert>
        )}

        {!editMode ? (
          <ContractDocument
            title={contractTitle}
            versionNo={versionNo}
            sections={sections}
            previousSections={previousSections}
            scale={documentScale}
          />
        ) : (
          <div className="space-y-4">
            {displayed.map((section, index) => (
              <div
                key={section.key}
                className="rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-4"
              >
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={section.title}
                        onChange={(e) => updateSection(index, { title: e.target.value })}
                        placeholder={t("draft.sectionTitlePlaceholder")}
                        className="flex-1 rounded-[var(--radius)] border border-stone-200 bg-paper-50 px-2.5 py-1.5 text-body font-medium text-ink-950 outline-none focus-visible:ring-2 focus-visible:ring-brand-red-600"
                      />
                      <button
                        type="button"
                        onClick={() => moveSection(index, -1)}
                        disabled={index === 0}
                        aria-label={t("draft.moveUp")}
                        className="flex size-8 items-center justify-center rounded-[var(--radius)] text-stone-600 hover:bg-paper-100 disabled:opacity-30"
                      >
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 1)}
                        disabled={index === displayed.length - 1}
                        aria-label={t("draft.moveDown")}
                        className="flex size-8 items-center justify-center rounded-[var(--radius)] text-stone-600 hover:bg-paper-100 disabled:opacity-30"
                      >
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        aria-label={t("draft.deleteSection")}
                        className="flex size-8 items-center justify-center rounded-[var(--radius)] text-state-error hover:bg-state-error-surface"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <textarea
                      value={section.body}
                      onChange={(e) => updateSection(index, { body: e.target.value })}
                      placeholder={t("draft.sectionBodyPlaceholder")}
                      rows={5}
                      className="w-full resize-y rounded-[var(--radius)] border border-stone-200 bg-paper-50 px-2.5 py-2 font-[family-name:var(--font-contract)] text-contract text-stone-800 outline-none focus-visible:ring-2 focus-visible:ring-brand-red-600"
                    />
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={addSection}>
              <Plus className="size-4" aria-hidden="true" />
              {t("draft.addSection")}
            </Button>
          </div>
        )}

        {findings.length > 0 && !isViewingHistory && (
          <div className="contract-findings mx-auto mt-6 max-w-[794px] rounded-[var(--radius)] border border-stone-200 bg-paper-50 p-4">
            <h3 className="text-card-title font-heading text-ink-950">{t("review.title")}</h3>
            <p className="mt-1 text-helper text-stone-600">{t("review.disclaimer")}</p>
            <ul className="mt-3 space-y-2">
              {findings.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-body text-stone-800">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      f.severity === "error" && "bg-state-error",
                      f.severity === "warning" && "bg-state-warning",
                      f.severity === "info" && "bg-stone-400",
                    )}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-medium">
                      {tFindings(FINDING_CODES.includes(f.code as (typeof FINDING_CODES)[number]) ? (f.code as (typeof FINDING_CODES)[number]) : "other")}
                    </span>
                    {f.detail && <span className="text-stone-600"> — {f.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {reviewError && (
          <p className="mt-3 text-helper text-state-error">{t("review.error")}</p>
        )}
      </div>

      {!isViewingHistory && (
        <div className="contract-actions flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-paper-100 p-4">
          {editMode ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={cancelEdit} disabled={saving}>
                {t("draft.cancelEdit")}
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {t("draft.save")}
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={startEdit} disabled={!canEdit || sections.length === 0}>
              {t("draft.editToggle")}
            </Button>
          )}

          {!editMode && canEdit && sections.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant={reviewIsPrimary ? "primary" : "secondary"}
                size="sm"
                onClick={onRunReview}
                disabled={reviewing}
              >
                {reviewing ? t("review.running") : findings.length > 0 ? t("review.rerun") : t("review.run")}
              </Button>
              {status === "review" && (
                <Button size="sm" onClick={onApprove} disabled={approving}>
                  {t("approve")}
                </Button>
              )}
              {status === "ready" && (
                <>
                  {pdfUrl ? (
                    <Button size="sm" asChild>
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        {t("pdf.download")}
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" onClick={onGeneratePdf} disabled={generatingPdf}>
                      {generatingPdf ? t("pdf.generating") : t("pdf.generate")}
                    </Button>
                  )}
                  {shareSlot}
                </>
              )}
            </div>
          )}
          {status === "ready" && pdfError && (
            <p className="w-full text-helper text-state-error">{t("pdf.error")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export { DraftPanel };
