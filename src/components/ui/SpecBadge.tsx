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
        variant === "default" && "bg-white/5 text-slate-300 border border-white/10",
        variant === "outline" && "border border-white/10 text-slate-400 bg-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}
