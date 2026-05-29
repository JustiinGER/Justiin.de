"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { RemoveButton } from "./RemoveButton";

interface SortableItemProps {
  id: string;
  index: number;
  children: React.ReactNode;
  onRemove?: () => void;
}

export function SortableItem({ id, index, children, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 40 - index,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-brand-card border border-brand-border rounded-2xl p-4 flex gap-4 hover:z-30 focus-within:z-40 ${
        isDragging ? "shadow-2xl shadow-brand-accent/20 border-brand-accent/50 z-50" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-8 cursor-grab hover:text-brand-accent text-brand-muted transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 space-y-4">
        {children}
      </div>

      {onRemove && (
        <RemoveButton variant="card" onClick={onRemove} title="Remove item" />
      )}
    </div>
  );
}
