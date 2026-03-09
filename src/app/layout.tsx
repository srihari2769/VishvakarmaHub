import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.vishvakarmahub.com'),
  title: {
    default: "Vishvakarma Hub - From Idea to Innovation",
    template: "%s | Vishvakarma Hub",
  },
  description:
    "A platform where innovators submit ideas, teams form, the public supports projects, and startups are launched.",
  keywords: [
    "startup",
    "innovation",
    "funding",
    "crowdfunding",
    "ideas",
    "entrepreneurship",
  ],
  openGraph: {
    title: "Vishvakarma Hub - From Idea to Innovation",
    description:
      "A platform where innovators submit ideas, teams form, the public supports projects, and startups are launched.",
    type: "website",
    url: "https://www.vishvakarmahub.com",
    locale: "en_IN",
    siteName: "Vishvakarma Hub",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <LayoutWrapper header={<Header />} footer={<Footer />}>
          {children}
        </LayoutWrapper>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
