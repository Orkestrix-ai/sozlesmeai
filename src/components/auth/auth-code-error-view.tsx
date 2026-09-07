import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * `/auth/confirm` Route Handler'ının token doğrulaması başarısız olduğunda
 * yönlendirdiği ekran. `reason` bağlantının süresi mi doldu yoksa geçersiz mi
 * olduğunu ayırt eder — ikisi de aynı `authError.cta` (yeniden gönder) ile çözülür.
 */
export function AuthCodeErrorView({ reason }: { reason: "expired" | "invalid" }) {
  const t = useTranslations("auth.authError");

  return (
    <div className="space-y-6">
      <Alert variant="error">
        <AlertDescription>{t(reason)}</AlertDescription>
      </Alert>
      <Button asChild size="lg" className="w-full">
        <Link href="/verify-email">{t("cta")}</Link>
      </Button>
    </div>
  );
}
