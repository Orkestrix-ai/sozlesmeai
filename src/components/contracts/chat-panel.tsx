"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

/**
 * design.md §8 sol panel — AI mesajı ink-800/paper-50, kullanıcı mesajı
 * brand-red-700/paper-50. Gönder butonu bilerek küçük bir ikon: sağ paneldeki
 * Kaydet/Onayla ile aynı ekranda iki "birincil" kırmızı buton göstermemek
 * için (design.md §3/§5).
 */
function ChatPanel({
  messages,
  streamingText,
  isStreaming,
  error,
  disabled,
  onSend,
}: {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  error: boolean;
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const t = useTranslations("dashboard.contractScreen.chat");
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText]);

  const submit = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col bg-ink-950">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && !isStreaming && (
          <p className="text-body text-stone-400">{t("empty")}</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-[var(--radius)] px-3.5 py-2.5 text-body whitespace-pre-wrap text-paper-50",
                m.role === "user" ? "bg-brand-red-700" : "bg-ink-800",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-[var(--radius)] bg-ink-800 px-3.5 py-2.5 text-body whitespace-pre-wrap text-paper-50">
              {streamingText || t("thinking")}
            </div>
          </div>
        )}
        {error && <p className="text-helper text-brand-red-500">{t("error")}</p>}
      </div>
      <div className="shrink-0 border-t border-ink-800 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t("placeholder")}
            disabled={disabled}
            rows={2}
            className="flex-1 resize-none rounded-[var(--radius)] border border-ink-800 bg-ink-900 px-3 py-2 text-body text-paper-50 outline-none placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-brand-red-600 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={submit}
            disabled={disabled || isStreaming || !input.trim()}
            aria-label={t("send")}
            className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-brand-red-600 text-paper-50 outline-none hover:bg-brand-red-700 focus-visible:ring-2 focus-visible:ring-brand-red-600 disabled:opacity-50"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { ChatPanel };
