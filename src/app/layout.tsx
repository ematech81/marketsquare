import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Square Market",
  description: "Buy from trusted vendors across Nigeria.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<header className="h-16 border-b border-line bg-white" />}>
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
