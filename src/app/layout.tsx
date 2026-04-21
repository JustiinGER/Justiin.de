import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Justin | Portfolio",
  description: "IT System Technician | Self-Hosting Enthusiast | Tech Explorer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="bg-brand-bg text-slate-50 min-h-screen relative font-sans" suppressHydrationWarning>
        <ScrollProgress />
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(circle,#2e3a4d_1px,transparent_1px)] [background-size:28px_28px] opacity-30 pointer-events-none" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
