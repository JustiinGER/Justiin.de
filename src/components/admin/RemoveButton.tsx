"use client";

import { Trash2 } from "lucide-react";

type RemoveButtonProps = {
  onClick: () => void;
  variant?: "card" | "inline";
  title?: string;
  className?: string;
};

export function RemoveButton({
  onClick,
  variant = "inline",
  title = "Remove",
  className = "",
}: RemoveButtonProps) {
  const shared =
    "p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shrink-0";

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`absolute top-2 right-2 ${shared} ${className}`}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`self-center ${shared} ${className}`}
    >
      <Trash2 className="w-3 h-3" />
    </button>
  );
}
