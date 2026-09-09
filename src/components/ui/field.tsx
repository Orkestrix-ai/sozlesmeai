import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Label + kontrol + hata/açıklama üçlüsünü tek yerde birleştirir; `id`,
 * `aria-describedby` ve `aria-invalid` bağlantısını otomatik kurar. zod
 * kullanılmadığı için (src/lib/validation.ts anahtar döndürür) `error` burada
 * zaten çevrilmiş bir metin bekler.
 *
 * `asGroup`: kontrol tek bir form alanı değil bir grup olduğunda (radio group
 * — Radix Root bir `div[role="radiogroup"]`) `htmlFor` işlevsiz kalır. Bu
 * durumda etiket `<p>` olarak render edilir ve gruba `aria-labelledby` ile
 * bağlanır. Etiket satır içi bağlantı içerebildiği için de gereklidir:
 * `<label>` içindeki bağlantıya tıklamak kontrolü tetiklerdi.
 */
function Field({
  id,
  label,
  error,
  description,
  required,
  asGroup,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  error?: string;
  description?: string;
  required?: boolean;
  asGroup?: boolean;
  className?: string;
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    "aria-labelledby"?: string;
  }>;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const labelId = asGroup ? `${id}-label` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const labelContent = (
    <>
      {label}
      {required && <span className="text-brand-red-600"> *</span>}
    </>
  );

  return (
    <div className={cn("space-y-1.5", className)} data-slot="field">
      {asGroup ? (
        <p id={labelId} className="text-helper font-medium text-stone-800">
          {labelContent}
        </p>
      ) : (
        <Label htmlFor={id}>{labelContent}</Label>
      )}
      {React.cloneElement(children, {
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
        "aria-labelledby": labelId,
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
