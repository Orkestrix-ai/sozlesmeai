import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * design.md §11 — masaüstünde maksimum içerik genişliği 1280–1440 px.
 */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1280px] px-5 sm:px-8", className)}
      {...props}
    />
  );
}
