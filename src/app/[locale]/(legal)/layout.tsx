import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

/**
 * Yasal sayfalar landing ile aynı açık yüzeyi ve aynı navbar/footer
 * kompozisyonunu paylaşır. `(auth)/layout.tsx` gibi burada `params` /
 * `setRequestLocale` yok — locale `[locale]/layout.tsx`te ayarlandı, her
 * sayfa kendi `setRequestLocale` çağrısını tekrarlar.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="grow">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
