import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/constants";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const headingFont = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} | School Essentials Made Simple`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fdfbf7",
};

/**
 * Deliberately minimal: fonts, global styles, and the toast host only.
 * Public storefront chrome (header/footer/search/bag) lives in
 * `(site)/layout.tsx`; the admin surface has its own shell in
 * `admin/(protected)/layout.tsx`. Neither should leak into the other —
 * see docs/PHASE_3_REPORT.md "Admin architecture".
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
