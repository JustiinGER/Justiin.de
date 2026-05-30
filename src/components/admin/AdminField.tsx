"use client";

type AdminFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "textarea";
  size?: "default" | "compact";
  rows?: number;
  placeholder?: string;
  className?: string;
};

export function AdminField({
  label,
  value,
  onChange,
  type = "text",
  size = "default",
  rows = 3,
  placeholder,
  className = "",
}: AdminFieldProps) {
  const isCompact = size === "compact";

  const labelClass = isCompact
    ? "block text-xs font-medium text-brand-muted mb-1"
    : "block text-sm font-medium text-brand-text mb-1.5";

  const inputClass = isCompact
    ? "w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-accent/50"
    : "w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/50";

  const wrapperClass = isCompact ? "" : "space-y-1.5";

  return (
    <div className={`min-w-0 ${wrapperClass} ${className}`}>
      <label className={labelClass}>{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}
