import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * design.md §10 — Durum badge'leri.
 *
 * Belge yaşam döngüsünün tek görsel dili budur. Yeni bir durum eklemek
 * gerekirse önce design.md güncellenmeli; buraya serbest renk eklenmemeli.
 */
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-helper font-medium",
  {
    variants: {
      status: {
        /** Taslak — henüz üzerinde çalışılıyor. */
        draft: "bg-paper-100 text-stone-800",
        /** İnceleniyor — kullanıcı onayı bekliyor. */
        review: "bg-state-warning-surface text-state-warning-text",
        /** Hazır — onaylandı, PDF üretilebilir. */
        ready: "bg-state-success-surface text-state-success-text",
        /** Paylaşıldı — karşı tarafa gönderildi. */
        shared: "bg-state-info-surface text-state-info-text",
        /** Hata — işlem başarısız. */
        error: "bg-state-error-surface text-state-error-text",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  },
);

function StatusBadge({
  className,
  status,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusBadgeVariants>) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ status, className }))}
      {...props}
    />
  );
}

export { StatusBadge, statusBadgeVariants };
