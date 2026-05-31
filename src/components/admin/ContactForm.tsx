"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { IconPicker } from "./IconPicker";
import { AdminField } from "./AdminField";
import { Plus } from "lucide-react";

export function ContactForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...data.links];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...data, links: newItems });
  };

  const addItem = () => {
    const newItem = {
      id: `link-${Date.now()}`,
      name: "New Link",
      icon: "Link",
      url: "https://...",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10",
    };
    onChange({ ...data, links: [...data.links, newItem] });
  };

  const removeItem = (index: number) => {
    const newItems = [...data.links];
    newItems.splice(index, 1);
    onChange({ ...data, links: newItems });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = data.links.findIndex((s: any) => s.id === active.id);
      const newIndex = data.links.findIndex((s: any) => s.id === over.id);
      onChange({ ...data, links: arrayMove(data.links, oldIndex, newIndex) });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <AdminField label="Title" value={data.title} onChange={(v) => updateField("title", v)} />
        <AdminField label="Subtitle" type="textarea" rows={2} value={data.subtitle} onChange={(v) => updateField("subtitle", v)} />
        <AdminField label="Email Address" value={data.email} onChange={(v) => updateField("email", v)} />
      </div>

      <div className="pt-4 border-t border-brand-border">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Contact Links</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.links.map((i:any) => i.id || i.name)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {data.links.map((item: any, idx: number) => {
              const id = item.id || `contact-${idx}`;
              return (
                <SortableItem key={id} id={id} index={idx} onRemove={() => removeItem(idx)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                    <div>
                      <label className="block text-xs font-medium text-brand-muted mb-1">Icon</label>
                      <IconPicker value={item.icon} onChange={v => updateItem(idx, "icon", v)} />
                    </div>
                    <AdminField label="Name" size="compact" value={item.name} onChange={v => updateItem(idx, "name", v)} />
                    <AdminField label="URL" size="compact" className="sm:col-span-2" value={item.url} onChange={v => updateItem(idx, "url", v)} />
                    <AdminField label="Color Class" size="compact" value={item.color} onChange={v => updateItem(idx, "color", v)} />
                    <AdminField label="Bg Color" size="compact" value={item.bgColor || ""} onChange={v => updateItem(idx, "bgColor", v)} />
                  </div>
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      
      <button
        onClick={addItem}
        className="mt-6 w-full py-4 border-2 border-dashed border-brand-border hover:border-brand-accent/50 rounded-2xl flex items-center justify-center gap-2 text-brand-muted hover:text-brand-accent transition-colors"
      >
        <Plus className="w-5 h-5" /> Add Link
      </button>
      </div>
    </div>
  );
}
