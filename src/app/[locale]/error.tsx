"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { StatusView } from "@/components/feedback/status-view";

/**
 * plan §4 Katman 2 — landing, `(auth)`, `s/[token]` ve Katman 1'in kendisini
 * kapsar. `error.js` aynı segmentteki `not-found.js`'i SARAR ama `layout.js`'i
 * sarmaz (bkz. Next.js docs, error.md:96); kök layout çökerse `global-error.tsx`
 * devreye girer.
 *
 * Next.js 16.3 — prop adı `retry` (eski `reset` değil). `(app)/error.tsx` ile
 * aynı kalıp.
 */
export default function LocaleError({
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
      icon={<CircleAlert />}
      title={t("unexpected.title")}
      description={t("unexpected.description")}
      primaryAction={<Button onClick={() => retry()}>{tCommon("retry")}</Button>}
      secondaryAction={
        <Button variant="secondary" asChild>
          <Link href="/">{t("actions.home")}</Link>
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
