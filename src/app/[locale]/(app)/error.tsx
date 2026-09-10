"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { StatusView } from "@/components/feedback/status-view";

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
  const t = useTranslations("errors.page");
  const tCommon = useTranslations("common.actions");

  useEffect(() => {
    console.error(error);
  }, [error]);

  const referenceCode = error.digest ? `REF-${error.digest.slice(0, 8).toUpperCase()}` : null;

  return (
    <StatusView
      fullScreen={false}
      icon={<CircleAlert />}
      title={t("unexpected.title")}
      description={t("unexpected.description")}
      primaryAction={<Button onClick={() => retry()}>{tCommon("retry")}</Button>}
      secondaryAction={
        <Button variant="secondary" asChild>
          <Link href="/dashboard">{t("actions.dashboard")}</Link>
        </Button>
      }
      reference={
        referenceCode
          ? {
              code: referenceCode,
              label: t("reference", { code: referenceCode }),
              hint: t("referenceHint"),
            }
          : undefined
      }
    />
  );
}
