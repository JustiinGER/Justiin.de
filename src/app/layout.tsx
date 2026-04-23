import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavbarSlot } from "@/components/NavbarSlot";
import { Footer } from "@/components/Footer";
import dynamic from "next/dynamic";

const Background = dynamic(() => import("@/components/Background").then(m => ({ default: m.Background })));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Justin | About Me",
  description: "IT System Technician | Self-Hosting Enthusiast | Tech Explorer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('motion-reduced') === 'true') {
                  document.documentElement.classList.add('reduce-motion');
                }
              } catch (e) {}
              try {
                var pref = localStorage.getItem('theme');
                if (pref !== 'system' && pref !== 'light' && pref !== 'dark' && pref !== 'dynamic') {
                  pref = 'system';
                }
                var applied;
                if (pref === 'dynamic') {
                  var hs = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', hour: 'numeric', hour12: false }).format(new Date());
                  var hr = parseInt(hs, 10);
                  applied = (hr >= 6 && hr < 19) ? 'light' : 'dark';
                } else if (pref === 'system') {
                  applied = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                } else {
                  applied = pref;
                }
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(applied);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-brand-bg text-brand-text min-h-screen relative font-sans flex flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ScrollProgress />
          <Background />
          <NavbarSlot />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
