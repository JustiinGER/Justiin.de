"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MotionToggle } from "@/components/MotionToggle";

type DisplaySettingsProps = {
  /** Use on pages without the navbar (e.g. privacy) so the trigger stays visible. */
  triggerVariant?: "navbar" | "floating";
};

export function DisplaySettings({ triggerVariant = "navbar" }: DisplaySettingsProps) {
  const [open, setOpen] = React.useState(false);
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const wasOpen = React.useRef(false);

  React.useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const triggerClassName =
    triggerVariant === "floating"
      ? "relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-card/80 text-brand-muted shadow-lg backdrop-blur-sm transition-colors hover:text-brand-accent"
      : "relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-brand-muted transition-colors hover:bg-black/5 hover:text-brand-accent max-[340px]:h-9 max-[340px]:w-9 dark:hover:bg-white/5 sm:h-auto sm:w-auto sm:px-4 sm:py-2";

  React.useEffect(() => {
    if (!open && wasOpen.current) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  const overlay = portalTarget ? (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close display settings"
            className="fixed inset-0 z-[100] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Display settings"
            className="fixed bottom-0 left-1/2 z-[110] w-full max-w-lg -translate-x-1/2 rounded-t-2xl border-x border-t border-brand-border bg-brand-card/95 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-brand-text">Display settings</h2>
              <button
                type="button"
                aria-label="Close display settings"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-brand-muted transition-colors hover:bg-black/5 hover:text-brand-accent dark:hover:bg-white/5"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <ThemeToggle variant="panel" />
              <MotionToggle variant="panel" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Display settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        className={triggerClassName}
      >
        <Settings className="h-5 w-5" aria-hidden="true" />
      </button>

      {portalTarget ? createPortal(overlay, portalTarget) : null}
    </>
  );
}
