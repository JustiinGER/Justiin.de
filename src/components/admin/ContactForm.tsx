"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { IconPicker } from "./IconPicker";
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
      href: "https://...",
      color: "hover:text-blue-400"
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
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
          <input
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            value={data.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Subtitle</label>
          <textarea
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            value={data.subtitle}
            onChange={(e) => updateField("subtitle", e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
          <input
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
            value={data.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Contact Links</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.links.map((i:any) => i.id || i.name)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {data.links.map((item: any, idx: number) => {
              const id = item.id || `contact-${idx}`;
              return (
                <SortableItem key={id} id={id} index={idx} onRemove={() => removeItem(idx)}>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Icon</label>
                      <IconPicker value={item.icon} onChange={v => updateItem(idx, "icon", v)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={item.name} onChange={e => updateItem(idx, "name", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">URL (href)</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={item.href} onChange={e => updateItem(idx, "href", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Hover Color Class</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={item.color} onChange={e => updateItem(idx, "color", e.target.value)} />
                    </div>
                  </div>
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      
      <button
        onClick={addItem}
        className="mt-6 w-full py-4 border-2 border-dashed border-slate-700 hover:border-brand-accent/50 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-brand-accent transition-colors"
      >
        <Plus className="w-5 h-5" /> Add Link
      </button>
      </div>
    </div>
  );
}
