"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { IconPicker } from "./IconPicker";
import { Plus } from "lucide-react";
import { RemoveButton } from "./RemoveButton";

export function PassionsForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem = {
      id: `passion-${Date.now()}`,
      title: "New Passion",
      icon: "Heart",
      content: "Description here...",
      tags: [],
      className: "md:col-span-6 lg:col-span-6",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (index: number) => {
    const newItems = [...data.items];
    newItems.splice(index, 1);
    onChange({ ...data, items: newItems });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = data.items.findIndex((s: any) => s.id === active.id);
      const newIndex = data.items.findIndex((s: any) => s.id === over.id);
      onChange({ ...data, items: arrayMove(data.items, oldIndex, newIndex) });
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
      </div>

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Passions List</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.items.map((i:any) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {data.items.map((item: any, idx: number) => (
              <SortableItem key={item.id} id={item.id} index={idx} onRemove={() => removeItem(idx)}>
                <div className="space-y-4 w-full">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={item.title} onChange={e => updateItem(idx, "title", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Icon</label>
                      <IconPicker value={item.icon} onChange={v => updateItem(idx, "icon", v)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Content / Description</label>
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" rows={3} value={item.content} onChange={e => updateItem(idx, "content", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">CSS Class (Grid sizing)</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={item.className} onChange={e => updateItem(idx, "className", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Color Class</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={item.color} onChange={e => updateItem(idx, "color", e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Bg Color Class</label>
                      <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={item.bgColor} onChange={e => updateItem(idx, "bgColor", e.target.value)} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-400 mb-2">Tags</label>
                    <div className="space-y-2">
                      {item.tags.map((tag: any, tIdx: number) => (
                        <div key={tIdx} className="group flex gap-2">
                          <input className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white" value={tag.name} onChange={e => {
                            const newTags = [...item.tags];
                            newTags[tIdx].name = e.target.value;
                            updateItem(idx, "tags", newTags);
                          }} placeholder="Tag Name" />
                          <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white" value={tag.tooltip || ""} onChange={e => {
                            const newTags = [...item.tags];
                            newTags[tIdx].tooltip = e.target.value;
                            updateItem(idx, "tags", newTags);
                          }} placeholder="Tooltip" />
                          <RemoveButton
                            onClick={() => {
                              const newTags = [...item.tags];
                              newTags.splice(tIdx, 1);
                              updateItem(idx, "tags", newTags);
                            }}
                            title="Remove tag"
                          />
                        </div>
                      ))}
                      <button onClick={() => updateItem(idx, "tags", [...item.tags, {name: "New", tooltip: ""}])} className="text-sm text-brand-accent hover:underline">+ Add Tag</button>
                    </div>
                  </div>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <button
        onClick={addItem}
        className="mt-6 w-full py-4 border-2 border-dashed border-slate-700 hover:border-brand-accent/50 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-brand-accent transition-colors"
      >
        <Plus className="w-5 h-5" /> Add Passion
      </button>
      </div>
    </div>
  );
}
