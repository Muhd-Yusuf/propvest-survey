import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PropVest — Help Shape the Future of Real Estate Investing",
  description:
    "Take a 2-minute survey and help us build a platform where anyone can invest in Nigerian real estate starting from ₦50K.",
  openGraph: {
    title: "PropVest Survey",
    description: "Help us build the future of real estate investing in Nigeria",
    type: "website",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full bg-[#0A0A0A] text-white">{children}</body>
    </html>
  );
}
