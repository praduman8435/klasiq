import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BRAND } from "@/lib/constants";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader storeName={BRAND.name} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter storeName={BRAND.name} />
    </>
  );
}
