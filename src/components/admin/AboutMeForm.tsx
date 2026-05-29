"use client";

import { useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { AboutMe } from "@/lib/data";
import { AdminField } from "./AdminField";
import { SortableItem } from "./SortableItem";

function ensureBioIds(ids: string[], length: number) {
  while (ids.length < length) {
    ids.push(`bio-${Date.now()}-${ids.length}`);
  }
  ids.length = length;
}

export function AboutMeForm({ data, onChange }: { data: AboutMe; onChange: (v: AboutMe) => void }) {
  const bioIdsRef = useRef<string[]>([]);
  ensureBioIds(bioIdsRef.current, data.bio.length);

  const bioItems = data.bio.map((text, i) => ({
    id: bioIdsRef.current[i],
    text,
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateBio = (newBio: string[]) => {
    ensureBioIds(bioIdsRef.current, newBio.length);
    onChange({ ...data, bio: newBio });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bioItems.findIndex((b) => b.id === active.id);
    const newIndex = bioItems.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    bioIdsRef.current = arrayMove([...bioIdsRef.current], oldIndex, newIndex);
    onChange({ ...data, bio: arrayMove(data.bio, oldIndex, newIndex) });
  };

  const removeBio = (index: number) => {
    bioIdsRef.current.splice(index, 1);
    updateBio(data.bio.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <AdminField label="Title" value={data.title} onChange={(v) => onChange({ ...data, title: v })} />
      <AdminField
        label="Tagline"
        type="textarea"
        value={data.tagline}
        onChange={(v) => onChange({ ...data, tagline: v })}
      />
      <AdminField
        label="Quick Facts (comma separated)"
        value={data.quickFacts.join(", ")}
        onChange={(v) => onChange({ ...data, quickFacts: v.split(",").map((s) => s.trim()) })}
      />

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Bio Paragraphs</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={bioItems.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {bioItems.map((item, idx) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  index={idx}
                  onRemove={data.bio.length > 1 ? () => removeBio(idx) : undefined}
                >
                  <AdminField
                    label={`Paragraph ${idx + 1}`}
                    type="textarea"
                    size="compact"
                    rows={3}
                    value={item.text}
                    onChange={(v) => {
                      const newBio = [...data.bio];
                      newBio[idx] = v;
                      onChange({ ...data, bio: newBio });
                    }}
                  />
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          onClick={() => updateBio([...data.bio, ""])}
          className="mt-6 w-full py-4 border-2 border-dashed border-slate-700 hover:border-brand-accent/50 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-brand-accent transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Paragraph
        </button>
      </div>
    </div>
  );
}
