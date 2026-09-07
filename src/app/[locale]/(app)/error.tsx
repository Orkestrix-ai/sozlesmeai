"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Next.js 16.3 — prop adı `retry` (eski `reset` değil, bkz. error.js dosya
 * kuralı). Hata boundary'si Client Component OLMAK ZORUNDA.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common.actions");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-16">
      <Alert variant="error" className="max-w-md">
        <AlertTitle>{t("unexpected")}</AlertTitle>
        <AlertDescription>{t("generic")}</AlertDescription>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => retry()}>
          {tCommon("retry")}
        </Button>
      </Alert>
    </div>
  );
}
