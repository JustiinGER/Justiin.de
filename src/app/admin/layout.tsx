import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Justin",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-brand-bg text-brand-text min-h-screen relative font-sans antialiased">
      {children}
    </div>
  );
}
