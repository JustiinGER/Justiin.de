"use client";

import { Lock } from "lucide-react";

export function PasswordChangeSection() {
  return (
    <section
      aria-label="Password settings"
      className="rounded-2xl border border-brand-border bg-brand-card/50 p-6"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-brand-text">Change Password</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Update your admin credentials. This feature will be available soon.
          </p>
        </div>
      </div>

      <div className="space-y-4 opacity-60">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-brand-text">Current Password</label>
          <input
            type="password"
            disabled
            placeholder="••••••••"
            className="block w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-brand-text placeholder-brand-muted"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-brand-text">New Password</label>
          <input
            type="password"
            disabled
            placeholder="••••••••"
            className="block w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-brand-text placeholder-brand-muted"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-brand-text">Confirm New Password</label>
          <input
            type="password"
            disabled
            placeholder="••••••••"
            className="block w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-brand-text placeholder-brand-muted"
          />
        </div>
        <button
          type="button"
          disabled
          className="rounded-xl bg-brand-accent/50 px-5 py-2.5 text-sm font-semibold text-brand-bg cursor-not-allowed"
        >
          Update Password
        </button>
      </div>
    </section>
  );
}
