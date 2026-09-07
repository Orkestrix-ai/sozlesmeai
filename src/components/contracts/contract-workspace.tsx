"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { saveManualSectionsAction, approveContractAction } from "@/actions/contracts";
import { ChatPanel, type ChatMessage } from "@/components/contracts/chat-panel";
import { DraftPanel, type Finding, type VersionEntry } from "@/components/contracts/draft-panel";
import { SharePanel, type ShareEntry } from "@/components/contracts/share-panel";
import type { ContractSection } from "@/lib/contracts/schema";
import type { AppLocale } from "@/i18n/routing";

type ContractStatus = "draft" | "review" | "ready" | "shared" | "error";

type TurnEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: unknown }
  | { type: "sections"; sections: ContractSection[] }
  | { type: "error"; message: string }
  | { type: "done" };

/**
 * design.md §8 — orkestratör. Masaüstünde sohbet/taslak yan yana; mobilde
 * sekmeli tek kolon (§11). Sunucu her yeniden render'da yalnızca BAŞLANGIÇ
 * verisini verir; akış sırasında gelen her şey burada yerel state'e yazılır
 * (router.refresh() KULLANILMAZ — dashboard'daki workspace geçişinde
 * yaşanan istemci önbelleği tuzağını tekrarlamamak için).
 */
function ContractWorkspace({
  contractId,
  locale,
  initialStatus,
  canEdit,
  initialMessages,
  initialVersions,
  initialFindings,
  initialShares,
}: {
  contractId: string;
  locale: AppLocale;
  initialStatus: ContractStatus;
  canEdit: boolean;
  initialMessages: ChatMessage[];
  initialVersions: VersionEntry[];
  initialFindings: Finding[];
  initialShares: ShareEntry[];
}) {
  const tChat = useTranslations("dashboard.contractScreen.chat");
  const tDraft = useTranslations("dashboard.contractScreen.draft");
  const [mobileTab, setMobileTab] = React.useState<"chat" | "draft">("chat");

  const [messages, setMessages] = React.useState(initialMessages);
  const [streamingText, setStreamingText] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [chatError, setChatError] = React.useState(false);

  const [versions, setVersions] = React.useState(initialVersions);
  const [viewingVersionId, setViewingVersionId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<ContractStatus>(initialStatus);
  const [saving, setSaving] = React.useState(false);
  const [approving, setApproving] = React.useState(false);

  const [findings, setFindings] = React.useState(initialFindings);
  const [reviewing, setReviewing] = React.useState(false);
  const [reviewError, setReviewError] = React.useState(false);

  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = React.useState(false);
  const [pdfError, setPdfError] = React.useState(false);

  const latestSections = versions[0]?.sections ?? [];
  const viewingVersion = versions.find((v) => v.id === viewingVersionId) ?? null;
  const displayedSections = viewingVersion ? viewingVersion.sections : latestSections;

  const sendMessage = async (text: string) => {
    setChatError(false);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: text }]);
    setIsStreaming(true);
    setStreamingText("");

    let assistantText = "";

    try {
      const res = await fetch(`/api/contracts/${contractId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, locale }),
      });

      if (!res.body) throw new Error("no_stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as TurnEvent;

          if (event.type === "text") {
            assistantText += event.text;
            setStreamingText(assistantText);
          } else if (event.type === "sections") {
            setVersions((prev) => [
              {
                id: `pending-${Date.now()}`,
                versionNo: (prev[0]?.versionNo ?? 0) + 1,
                source: prev.length === 0 ? "ai_draft" : "ai_edit",
                sections: event.sections,
              },
              ...prev,
            ]);
          } else if (event.type === "tool" && event.name === "ask_missing_info") {
            const input = event.input as { questions?: string[] };
            const questions = input.questions ?? [];
            const narrative = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
            assistantText = assistantText ? `${assistantText}\n\n${narrative}` : narrative;
            setStreamingText(assistantText);
          } else if (event.type === "error") {
            setChatError(true);
          }
        }
      }
    } catch {
      setChatError(true);
    }

    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}-a`, role: "assistant", content: assistantText || "…" },
    ]);
    setIsStreaming(false);
    setStreamingText("");
  };

  const handleSaveSections = async (sections: ContractSection[]) => {
    setSaving(true);
    const result = await saveManualSectionsAction(contractId, sections);
    setSaving(false);
    if (result.error || !result.sections) return false;
    setVersions((prev) => [
      { id: `pending-${Date.now()}`, versionNo: (prev[0]?.versionNo ?? 0) + 1, source: "manual", sections: result.sections! },
      ...prev,
    ]);
    return true;
  };

  const handleRunReview = async () => {
    setReviewing(true);
    setReviewError(false);
    try {
      const res = await fetch(`/api/contracts/${contractId}/review`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "generic");
      setFindings(
        (data.findings as { code: string; severity: "info" | "warning" | "error"; sectionKey: string | null; detail: string }[]).map(
          (f, i) => ({ id: i, code: f.code, severity: f.severity, sectionKey: f.sectionKey, detail: f.detail }),
        ),
      );
      setStatus("review");
    } catch {
      setReviewError(true);
    } finally {
      setReviewing(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    const result = await approveContractAction(contractId);
    setApproving(false);
    if (!result.error) setStatus("ready");
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    setPdfError(false);
    try {
      const res = await fetch(`/api/contracts/${contractId}/pdf`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data?.error ?? "generic");
      setPdfUrl(data.url);
    } catch {
      setPdfError(true);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="flex h-[70dvh] min-h-[520px] flex-col overflow-hidden rounded-[var(--radius)] border border-stone-200 lg:h-[78dvh] lg:flex-row">
      <div className="flex border-b border-stone-200 bg-paper-50 lg:hidden">
        {(["chat", "draft"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={
              mobileTab === tab
                ? "flex-1 border-b-2 border-brand-red-600 py-2.5 text-center text-body font-medium text-ink-950"
                : "flex-1 border-b-2 border-transparent py-2.5 text-center text-body text-stone-600"
            }
          >
            {tab === "chat" ? tChat("title") : tDraft("title")}
          </button>
        ))}
      </div>

      <div className={`min-h-0 lg:w-2/5 lg:shrink-0 ${mobileTab === "chat" ? "flex-1" : "hidden lg:flex"}`}>
        <ChatPanel
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          error={chatError}
          disabled={!canEdit}
          onSend={sendMessage}
        />
      </div>

      <div className={`min-h-0 flex-1 ${mobileTab === "draft" ? "flex-1" : "hidden lg:flex"}`}>
        <DraftPanel
          status={status}
          sections={displayedSections}
          versions={versions}
          viewingVersionId={viewingVersionId}
          onSelectVersion={setViewingVersionId}
          canEdit={canEdit}
          onSaveSections={handleSaveSections}
          saving={saving}
          findings={findings}
          onRunReview={handleRunReview}
          reviewing={reviewing}
          reviewError={reviewError}
          onApprove={handleApprove}
          approving={approving}
          shareSlot={
            <SharePanel
              contractId={contractId}
              locale={locale}
              status={status}
              canEdit={canEdit}
              initialShares={initialShares}
            />
          }
          onGeneratePdf={handleGeneratePdf}
          generatingPdf={generatingPdf}
          pdfUrl={pdfUrl}
          pdfError={pdfError}
        />
      </div>
    </div>
  );
}

export { ContractWorkspace };
