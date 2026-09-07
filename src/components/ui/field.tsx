import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Label + kontrol + hata/açıklama üçlüsünü tek yerde birleştirir; `id`,
 * `aria-describedby` ve `aria-invalid` bağlantısını otomatik kurar. zod
 * kullanılmadığı için (src/lib/validation.ts anahtar döndürür) `error` burada
 * zaten çevrilmiş bir metin bekler.
 */
function Field({
  id,
  label,
  error,
  description,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)} data-slot="field">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-brand-red-600"> *</span>}
      </Label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })}
      {description && !error && (
        <p id={descriptionId} className="text-helper text-stone-600">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-helper text-state-error">
          {error}
        </p>
      )}
    </div>
  );
}

export { Field };
