import { cn } from "@/lib/utils";

/**
 * Bölüm başlığı + açıklama. design.md §4 ölçeğini ve §6'daki renk
 * kullanımını tek yerde tutar.
 */
export function SectionHeading({
  title,
  description,
  align = "start",
  tone = "light",
  className,
}: {
  title: string;
  description?: string;
  align?: "start" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <h2
        className={cn(
          "font-heading text-[1.75rem] font-bold leading-tight tracking-tight sm:text-[2rem] lg:text-section",
          tone === "dark" ? "text-paper-50" : "text-ink-950",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4",
            tone === "dark" ? "text-stone-400" : "text-stone-600",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
