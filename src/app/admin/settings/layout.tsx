import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Admin",
  robots: "noindex, nofollow",
};

export default function AdminSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
