import { setRequestLocale } from "next-intl/server";

import { FaqSection } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { FinalCta } from "@/components/landing/final-cta";
import { FlowSection } from "@/components/landing/flow-section";
import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { TrustSection } from "@/components/landing/trust-section";

/**
 * Landing page — design.md §6'daki bölüm sırası.
 * Navbar → Hero → Problem → Ürün akışı → Özellikler → Paketler → Güven
 * → SSS → Final CTA.
 */
export default async function LandingPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main id="main" className="grow">
        <Hero />
        <ProblemSection />
        <FlowSection />
        <FeaturesSection />
        <PricingSection />
        <TrustSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
