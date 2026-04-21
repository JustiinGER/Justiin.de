import { cn } from "@/lib/utils";

interface SpecBadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function SpecBadge({ children, className, variant = "default" }: SpecBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        variant === "default" && "bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-black/10 dark:border-white/10",
        variant === "outline" && "border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 bg-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}
