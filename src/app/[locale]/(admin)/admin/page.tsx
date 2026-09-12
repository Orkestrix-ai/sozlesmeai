import { setRequestLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { actorLabel, isKnownAction } from "@/lib/admin/audit";
import { getAdminAuditLog, getAdminFinancials, getAdminUsageStats, getAdminWorkspaces } from "@/lib/admin/dal";

/**
 * Admin panelinin iniş sayfası. Önceden burası yalnızca /admin/users'a
 * yönlendiriyordu; admin panele girince bir kullanıcı listesiyle karşılaşıyor,
 * "şu an ne oluyor" sorusunun cevabını hiçbir yerde bulamıyordu.
 *
 * Ham toplamlar /admin/usage'da KALIR, burada tekrar edilmez. Bu sayfa
 * operasyonel: neye müdahale etmem gerekiyor?
 */
export default async function AdminOverviewPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.overview");
  const tUsage = await getTranslations("admin.usage.metrics");
  const tAudit = await getTranslations("admin.auditLog");
  const tWorkspaces = await getTranslations("admin.workspaces");
  const tBilling = await getTranslations("admin.billing");
  const tFin = await getTranslations("admin.financials");

  const [stats, workspaces, recent, financials] = await Promise.all([
    getAdminUsageStats(),
    getAdminWorkspaces(),
    getAdminAuditLog(5),
    getAdminFinancials(),
  ]);

  /* Para birimi arayüz dilinden BAĞIMSIZ olarak ₺: kur TRY, yalnızca gösterim
     biçimi yerelleştirilir. Maliyet kesirli çıkabildiği için 2 basamağa
     yuvarlanır — ham toLocaleString uzun ondalık basardı. */
  const money = (value: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(value);

  /* Ödeme sağlayıcısı yok (bkz. CLAUDE.md "Açık maddeler"): bir bakiye ancak
     bu panelden artıyor. Dolayısıyla "kimin kredisi bitti" admin'in tek
     gerçek operasyonel sorusu — eşik dashboard'daki lowBalance ile aynı. */
  const lowBalance = workspaces.filter((ws) => ws.balance <= 1);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {/* Gelir/gider şeridi — design.md §3: tek kırmızı vurgu kuralı geçerli,
          negatif net yalnızca METİN rengiyle işaretlenir, kart yüzeyi kırmızı
          yapılmaz. */}
      <section className="mb-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-card-title font-heading text-ink-950">{tFin("title")}</h2>
          <span className="text-helper text-stone-600">
            {tFin("windowNote", { days: financials.windowDays })}
          </span>
        </div>

        {!financials.hasData ? (
          <p className="text-body text-stone-600">{tFin("noData")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard label={tFin("revenue")} value={money(financials.revenueTry)} />
              <MetricCard
                label={tFin("cost")}
                value={financials.costTry === null ? tFin("ratesMissing") : money(financials.costTry)}
              />
              <MetricCard
                label={tFin("net")}
                value={financials.netTry === null ? tFin("ratesMissing") : money(financials.netTry)}
                valueClassName={
                  financials.netTry !== null && financials.netTry < 0 ? "text-state-error" : undefined
                }
              />
            </div>
            <p className="mt-3 text-helper leading-relaxed text-stone-600">
              {tFin("costNote", {
                calls: financials.calls,
                tokens: financials.tokens.toLocaleString("tr-TR"),
              })}
            </p>
            {financials.ratesMissing && (
              <p className="mt-1 text-helper leading-relaxed text-stone-600">
                {tFin("ratesMissingNote")}
              </p>
            )}
            <p className="mt-1 text-helper leading-relaxed text-stone-600">{tFin("revenueNote")}</p>
          </>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label={tUsage("totalUsers")} value={stats.totalUsers} />
        <MetricCard label={tUsage("totalWorkspaces")} value={stats.totalWorkspaces} />
        <MetricCard label={tUsage("totalContracts")} value={stats.totalContracts} />
        <MetricCard label={tUsage("creditsConsumed")} value={stats.creditsConsumed} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("lowBalance")}</CardTitle>
          </CardHeader>
          <CardContent>
            {lowBalance.length === 0 ? (
              <p className="text-body text-stone-600">{t("lowBalanceEmpty")}</p>
            ) : (
              <ul className="space-y-3">
                {lowBalance.map((ws) => (
                  <li key={ws.id} className="flex items-center justify-between gap-3">
                    <span className="truncate text-body font-medium text-ink-950">
                      {ws.isPersonal ? tWorkspaces("personal") : ws.name}
                    </span>
                    <span className="shrink-0 text-helper text-stone-600" data-numeric>
                      {ws.balance}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-helper">
              <Link href="/admin/billing" className="text-ink-950 underline underline-offset-2">
                {tBilling("addCredits")}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-body text-stone-600">{tAudit("empty")}</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3">
                    <span className="text-body text-stone-800">
                      {isKnownAction(entry.action) ? tAudit(`actions.${entry.action}`) : entry.action}
                      <span className="ml-2 text-helper text-stone-600">
                        {actorLabel(entry.actorName, entry.actor_id)}
                      </span>
                    </span>
                    <time
                      dateTime={entry.created_at}
                      className="shrink-0 text-helper text-stone-600"
                      data-numeric
                    >
                      {new Date(entry.created_at).toLocaleDateString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-helper">
              <Link href="/admin/audit-log" className="text-ink-950 underline underline-offset-2">
                {t("allActions")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
