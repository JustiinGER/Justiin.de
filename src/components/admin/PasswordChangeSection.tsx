"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import { getAdminToken } from "@/lib/admin-session.client";

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  "block w-full rounded-xl border bg-brand-bg px-4 py-3 text-brand-text placeholder-brand-muted transition-colors focus:outline-none focus:ring-2";

function inputStyles(hasError: boolean) {
  return hasError
    ? `${inputClass} border-red-500/40 focus:border-red-500/40 focus:ring-red-500/30`
    : `${inputClass} border-brand-border focus:border-brand-accent/50 focus:ring-brand-accent/50`;
}

type FieldErrors = {
  current?: string;
  new?: string;
  confirm?: string;
};

function validateFields(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): FieldErrors {
  const errors: FieldErrors = {};

  if (!currentPassword) {
    errors.current = "Please enter your current password.";
  }

  if (!newPassword) {
    errors.new = "Please enter a new password.";
  } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.new = `Use at least ${MIN_PASSWORD_LENGTH} characters (currently ${newPassword.length}).`;
  }

  if (!confirmPassword) {
    errors.confirm = "Please confirm your new password.";
  } else if (newPassword && confirmPassword !== newPassword) {
    errors.confirm = "Passwords do not match.";
  }

  return errors;
}

export function PasswordChangeSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess(false);

    const errors = validateFields(currentPassword, newPassword, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const token = await getAdminToken();
    if (!token) {
      setFormError("Session expired. Please sign in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 && data.error?.toLowerCase().includes("current")) {
          setFieldErrors({ current: data.error });
        } else {
          setFormError(data.error || "Failed to update password.");
        }
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Password settings"
      className="rounded-2xl border border-brand-border bg-brand-card/50 p-4 md:p-6"
    >
      <div className="mb-4 md:mb-6 flex items-start gap-3">
        <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
          <Lock className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-semibold text-brand-text">Change Password</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Update your admin login credentials.
          </p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="current-password" className="block text-sm font-medium text-brand-text">
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              clearFieldError("current");
            }}
            autoComplete="current-password"
            aria-invalid={!!fieldErrors.current}
            aria-describedby={fieldErrors.current ? "current-password-error" : undefined}
            className={inputStyles(!!fieldErrors.current)}
          />
          {fieldErrors.current && (
            <p id="current-password-error" className="text-sm text-red-400" role="alert">
              {fieldErrors.current}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-sm font-medium text-brand-text">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              clearFieldError("new");
              if (fieldErrors.confirm && e.target.value === confirmPassword) {
                clearFieldError("confirm");
              }
            }}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.new}
            aria-describedby={
              fieldErrors.new ? "new-password-error" : "new-password-hint"
            }
            className={inputStyles(!!fieldErrors.new)}
          />
          {fieldErrors.new ? (
            <p id="new-password-error" className="text-sm text-red-400" role="alert">
              {fieldErrors.new}
            </p>
          ) : (
            <p id="new-password-hint" className="text-xs text-brand-muted">
              At least {MIN_PASSWORD_LENGTH} characters
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-brand-text">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearFieldError("confirm");
            }}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.confirm}
            aria-describedby={fieldErrors.confirm ? "confirm-password-error" : undefined}
            className={inputStyles(!!fieldErrors.confirm)}
          />
          {fieldErrors.confirm && (
            <p id="confirm-password-error" className="text-sm text-red-400" role="alert">
              {fieldErrors.confirm}
            </p>
          )}
        </div>

        {formError && (
          <p
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-400"
            role="alert"
          >
            {formError}
          </p>
        )}

        {success && (
          <p className="flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-center text-sm font-medium text-green-400">
            <Check className="h-4 w-4 shrink-0" />
            Password updated successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-bg transition-colors hover:bg-brand-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </span>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </section>
  );
}
