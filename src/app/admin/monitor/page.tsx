"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { HealthPanel } from "@/components/admin/HealthPanel";
import { ContentHistory } from "@/components/admin/ContentHistory";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { getAdminToken } from "@/lib/admin-session.client";

export default function AdminMonitorPage() {
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
      <AdminSidebar activeNav="monitor" />

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <header className="border-b border-brand-border bg-brand-card/30 px-4 md:px-8 py-6 md:py-8 backdrop-blur-md">
          <h1 className="text-xl md:text-2xl font-semibold text-brand-text">Monitor</h1>
          <p className="mt-1 text-sm text-brand-muted">
            System health, content history, and activity logs.
          </p>
        </header>

        <div className="mx-auto max-w-6xl space-y-4 md:space-y-8 p-4 md:p-8 pb-20">
          <div className="rounded-2xl border border-brand-border bg-brand-card/50 p-4 md:p-6">
            <HealthPanel />
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card/50 p-4 md:p-6">
            <ContentHistory />
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card/50 p-4 md:p-6">
            <ActivityLog />
          </div>
        </div>
      </main>
    </div>
  );
}
