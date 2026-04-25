import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { FloatingNavbar } from "./components/FloatingNavbar";
import { SiteFooter } from "./components/SiteFooter";
import { AppProviders } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PharmaOpenings — Pharmaceutical careers & job search",
  description:
    "PharmaOpenings.com connects exceptional talent with cutting-edge pharmaceutical roles. Browse curated jobs, explore leading employers, and advance your career in research, clinical, regulatory, and commercial teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} min-h-dvh antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-[var(--background)] font-sans text-[#171717]">
        <AppProviders>
          <FloatingNavbar />
          <div
            id="site-main"
            className="flex min-h-0 flex-1 flex-col outline-none"
          >
            {children}
          </div>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
