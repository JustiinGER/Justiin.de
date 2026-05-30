"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Palette } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PasswordChangeSection } from "@/components/admin/PasswordChangeSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { getAdminToken } from "@/lib/admin-session.client";

export default function AdminSettingsPage() {
  const router = useRouter();
  useAutoLogout();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getAdminToken().then((token) => {
      if (cancelled) return;
      if (!token) {
        router.push("/admin");
        return;
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <AdminSidebar activeNav="settings" />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <header className="border-b border-brand-border bg-brand-card/30 px-4 md:px-8 py-6 md:py-8 backdrop-blur-md">
          <h1 className="text-xl md:text-2xl font-semibold text-brand-text">Settings</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Manage appearance and account preferences for the admin area.
          </p>
        </header>

        <div className="mx-auto max-w-2xl space-y-4 md:space-y-6 p-4 md:p-8 pb-20">
          <section
            aria-label="Theme settings"
            className="rounded-2xl border border-brand-border bg-brand-card/50 p-4 md:p-6"
          >
            <div className="mb-4 md:mb-6 flex items-start gap-3">
              <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                <Palette className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-brand-text">Theme</h2>
                <p className="mt-1 text-sm text-brand-muted">
                  Choose how the admin area and site preview appear.
                </p>
              </div>
            </div>
            <ThemeToggle variant="panel" />
          </section>

          <PasswordChangeSection />
        </div>
      </main>
    </div>
  );
}
