import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { jsonLdString, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const DESCRIPTION = "Buy from approved vendors across Nigeria. Pay securely, track your order and get it delivered to your door.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Shop from approved vendors in Nigeria`,
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_NG", url: SITE_URL, title: SITE_NAME, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: DESCRIPTION },
};

// Tells Google the name of the website, so search results show "Square Market" and can offer a search box.
const SITE_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: SITE_URL },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(SITE_DATA) }} />
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<header className="h-[6.5rem] bg-foreground md:h-[6.25rem]" />}>
              <Header />
            </Suspense>
            {children}
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
