import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * design.md §5 — "Border, gölgeden baskındır." Varsayılan kart border
 * tabanlıdır, gölge yoktur. `tone="dark"`, §7.3'ün kredi özeti kartı gibi
 * ink-950 yüzeyler için (dark mode değil — marka yüzeyi, bkz. globals.css).
 */
function Card({
  className,
  tone = "light",
  ...props
}: React.ComponentProps<"div"> & { tone?: "light" | "dark" }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[var(--radius)] border p-5",
        tone === "light" && "border-stone-200 bg-paper-50 text-stone-800",
        tone === "dark" && "border-ink-800 bg-ink-950 text-paper-50",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("mb-4 space-y-1", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-card-title font-heading", className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  tone = "light",
  ...props
}: React.ComponentProps<"p"> & { tone?: "light" | "dark" }) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "text-helper",
        tone === "light" ? "text-stone-600" : "text-stone-400",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("mt-4 flex items-center gap-3", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
