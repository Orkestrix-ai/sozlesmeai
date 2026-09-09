"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `Field`'ın checkbox karşılığı: etiket kontrolün ÜSTÜNDE değil SAĞINDA durur.
 * `id`, `aria-invalid`, `aria-describedby` ve `aria-labelledby` bağlantısını
 * `Field` ile aynı biçimde otomatik kurar; hata metni `Field`'daki paragrafın
 * aynısıyla gösterilir (zaten çevrilmiş metin bekler).
 *
 * Etiket `<label htmlFor>` DEĞİL, `aria-labelledby` ile bağlanan bir `<span>`:
 * onay metni bağlantı içeriyor ve `<label>` içindeki bağlantıya tıklamak hem
 * sayfayı açar hem kutuyu işaretler. Metnin tıklanabilirliği kaybolmasın diye
 * bağlantıya düşmeyen tıklamalar kontrole iletiliyor.
 *
 * `field.tsx`ten ayrı dosyada çünkü bu bileşen olay dinleyicisi kullanıyor;
 * `field.tsx` sunucu bileşeni olarak kalmalı (style-guide onu öyle kullanıyor).
 */
function CheckboxField({
  id,
  label,
  error,
  description,
  required,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement<{
    id?: string;
    ref?: React.Ref<HTMLButtonElement>;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    "aria-labelledby"?: string;
  }>;
}) {
  const controlRef = React.useRef<HTMLButtonElement>(null);
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const labelId = `${id}-label`;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  function handleLabelClick(event: React.MouseEvent<HTMLElement>) {
    // Bağlantıya tıklandıysa yalnızca gezinme olsun, kutu işaretlenmesin.
    if ((event.target as HTMLElement).closest("a")) return;
    controlRef.current?.click();
  }

  return (
    <div className={cn("space-y-1.5", className)} data-slot="checkbox-field">
      <div className="flex items-start gap-2.5">
        {React.cloneElement(children, {
          id,
          ref: controlRef,
          "aria-invalid": Boolean(error),
          "aria-describedby": describedBy,
          "aria-labelledby": labelId,
        })}
        <span
          id={labelId}
          onClick={handleLabelClick}
          className="cursor-pointer text-helper leading-[18px] text-stone-800 select-none"
        >
          {label}
          {required && <span className="text-brand-red-600"> *</span>}
        </span>
      </div>
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

export { CheckboxField };
