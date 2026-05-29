"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { IconPicker } from "./IconPicker";
import { AdminField } from "./AdminField";
import { Plus } from "lucide-react";
import { RemoveButton } from "./RemoveButton";

export function GearForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
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
      id: `gear-${Date.now()}`,
      name: "New Gear",
      icon: "Monitor",
      title: "New Title",
      desc: "New description"
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
        <AdminField label="Title" value={data.title} onChange={(v) => updateField("title", v)} />
        <AdminField label="Subtitle" type="textarea" rows={2} value={data.subtitle} onChange={(v) => updateField("subtitle", v)} />
      </div>

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Gear Items</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.items.map((i:any) => i.id || i.name)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {data.items.map((item: any, idx: number) => {
                const id = item.id || `gear-${idx}`;
                return (
                  <SortableItem key={item.id} id={item.id} index={idx} onRemove={() => removeItem(idx)}>
                    <div className="space-y-4 w-full">
                      <div className="grid grid-cols-2 gap-4">
                        <AdminField label="Title (Small Header)" size="compact" value={item.title || ""} onChange={v => updateItem(idx, "title", v)} />
                        <AdminField label="Name (Main Header)" size="compact" value={item.name} onChange={v => updateItem(idx, "name", v)} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Main Icon</label>
                          <IconPicker value={item.icon} onChange={v => updateItem(idx, "icon", v)} />
                        </div>
                        <AdminField label="Description" size="compact" value={item.desc || ""} onChange={v => updateItem(idx, "desc", v)} />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <AdminField label="CSS Class (Grid sizing)" size="compact" value={item.className || ""} onChange={v => updateItem(idx, "className", v)} />
                        <AdminField label="Color Class" size="compact" value={item.color || ""} onChange={v => updateItem(idx, "color", v)} />
                        <AdminField label="Bg Color Class" size="compact" value={item.bgColor || ""} onChange={v => updateItem(idx, "bgColor", v)} />
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-medium text-slate-400 mb-2">Sub-Items (RAM, CPU, etc.)</label>
                        <div className="space-y-2">
                          {(item.items || []).map((subItem: any, sIdx: number) => (
                            <div key={sIdx} className="group grid grid-cols-12 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                              <div className="col-span-2">
                                <IconPicker value={subItem.icon} onChange={v => {
                                  const newItems = [...(item.items || [])];
                                  newItems[sIdx] = { ...newItems[sIdx], icon: v };
                                  updateItem(idx, "items", newItems);
                                }} />
                              </div>
                              <div className="col-span-3">
                                <input className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent/50" value={subItem.name} onChange={e => {
                                  const newItems = [...(item.items || [])];
                                  newItems[sIdx] = { ...newItems[sIdx], name: e.target.value };
                                  updateItem(idx, "items", newItems);
                                }} placeholder="e.g. CPU" />
                              </div>
                              <div className="col-span-3">
                                <input className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent/50" value={subItem.size} onChange={e => {
                                  const newItems = [...(item.items || [])];
                                  newItems[sIdx] = { ...newItems[sIdx], size: e.target.value };
                                  updateItem(idx, "items", newItems);
                                }} placeholder="e.g. 16 Core" />
                              </div>
                              <div className="col-span-3">
                                <input className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent/50" value={subItem.type} onChange={e => {
                                  const newItems = [...(item.items || [])];
                                  newItems[sIdx] = { ...newItems[sIdx], type: e.target.value };
                                  updateItem(idx, "items", newItems);
                                }} placeholder="e.g. AMD Ryzen" />
                              </div>
                              <div className="col-span-1 flex items-center justify-center">
                                <RemoveButton
                                  onClick={() => {
                                    const newItems = [...(item.items || [])];
                                    newItems.splice(sIdx, 1);
                                    updateItem(idx, "items", newItems);
                                  }}
                                  title="Remove sub-item"
                                />
                              </div>
                            </div>
                          ))}
                          <button onClick={() => updateItem(idx, "items", [...(item.items || []), {name: "New Item", icon: "Cpu", size: "Size", type: "Type"}])} className="text-sm text-brand-accent hover:underline">+ Add Sub-Item</button>
                        </div>
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
          <Plus className="w-5 h-5" /> Add Gear Item
        </button>
      </div>
    </div>
  );
}
