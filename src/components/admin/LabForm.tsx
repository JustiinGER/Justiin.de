"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { AdminField } from "./AdminField";
import { Plus } from "lucide-react";
import { RemoveButton } from "./RemoveButton";

export function LabForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const updateServer = (index: number, serverData: any) => {
    const newServers = [...data.servers];
    newServers[index] = serverData;
    onChange({ ...data, servers: newServers });
  };

  const addServer = () => {
    const newServer = {
      id: `server-${Date.now()}`,
      name: "New Server",
      os: "Ubuntu",
      role: "App Server",
      ip: "192.168.x.x",
      osColor: "text-blue-400",
      osBg: "bg-blue-500/10",
      specs: [{ label: "RAM", value: "16 GB" }],
      services: [{ name: "Docker", tooltip: "Container engine" }]
    };
    onChange({ ...data, servers: [...data.servers, newServer] });
  };

  const removeServer = (index: number) => {
    const newServers = [...data.servers];
    newServers.splice(index, 1);
    onChange({ ...data, servers: newServers });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = data.servers.findIndex((s: any) => s.id === active.id);
      const newIndex = data.servers.findIndex((s: any) => s.id === over.id);
      onChange({ ...data, servers: arrayMove(data.servers, oldIndex, newIndex) });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <AdminField label="Title" value={data.title} onChange={(v) => updateField("title", v)} />
        <AdminField label="Subtitle" type="textarea" rows={2} value={data.subtitle} onChange={(v) => updateField("subtitle", v)} />
      </div>

      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Servers</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.servers.map((s:any) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {data.servers.map((server: any, idx: number) => (
                <SortableItem key={server.id} id={server.id} index={idx} onRemove={() => removeServer(idx)}>
                  <div className="grid grid-cols-2 gap-4">
                    <AdminField label="Name" size="compact" value={server.name} onChange={v => updateServer(idx, {...server, name: v})} />
                    <AdminField label="Internal ID" size="compact" value={server.id} onChange={v => updateServer(idx, {...server, id: v})} />
                    <AdminField label="IP Address" size="compact" value={server.ip || ""} onChange={v => updateServer(idx, {...server, ip: v})} />
                    <AdminField label="Role" size="compact" value={server.role} onChange={v => updateServer(idx, {...server, role: v})} />
                    <AdminField label="OS Name" size="compact" value={server.os} onChange={v => updateServer(idx, {...server, os: v})} />
                    <div className="grid grid-cols-2 gap-2">
                      <AdminField label="OS Text Color" size="compact" value={server.osColor} onChange={v => updateServer(idx, {...server, osColor: v})} />
                      <AdminField label="OS Background" size="compact" value={server.osBg} onChange={v => updateServer(idx, {...server, osBg: v})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/50 mt-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Hardware Specs</h4>
                      <div className="space-y-2">
                        {server.specs.map((spec: any, sIdx: number) => (
                          <div key={sIdx} className="group flex gap-2">
                            <input className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent/50" value={spec.label} onChange={e => {
                              const newSpecs = [...server.specs];
                              newSpecs[sIdx].label = e.target.value;
                              updateServer(idx, {...server, specs: newSpecs});
                            }} placeholder="Label" />
                            <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent/50" value={spec.value} onChange={e => {
                              const newSpecs = [...server.specs];
                              newSpecs[sIdx].value = e.target.value;
                              updateServer(idx, {...server, specs: newSpecs});
                            }} placeholder="Value" />
                            <RemoveButton
                              onClick={() => {
                                const newSpecs = [...server.specs];
                                newSpecs.splice(sIdx, 1);
                                updateServer(idx, {...server, specs: newSpecs});
                              }}
                              title="Remove spec"
                            />
                          </div>
                        ))}
                        <button onClick={() => updateServer(idx, {...server, specs: [...server.specs, {label: "New", value: ""}]})} className="text-sm text-brand-accent hover:underline">+ Add Spec</button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Services & Tags</h4>
                      <div className="space-y-2">
                        {server.services.map((svc: any, sIdx: number) => (
                          <div key={sIdx} className="group flex gap-2">
                            <input className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent/50" value={svc.name || svc} onChange={e => {
                              const newSvcs = [...server.services];
                              if(typeof newSvcs[sIdx] === 'string') newSvcs[sIdx] = e.target.value;
                              else newSvcs[sIdx].name = e.target.value;
                              updateServer(idx, {...server, services: newSvcs});
                            }} placeholder="Name" />
                            <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-accent/50" value={typeof svc === 'string' ? '' : svc.tooltip || ''} onChange={e => {
                              const newSvcs = [...server.services];
                              if(typeof newSvcs[sIdx] === 'string') newSvcs[sIdx] = {name: newSvcs[sIdx], tooltip: e.target.value};
                              else newSvcs[sIdx].tooltip = e.target.value;
                              updateServer(idx, {...server, services: newSvcs});
                            }} placeholder="Tooltip (optional)" />
                            <RemoveButton
                              onClick={() => {
                                const newSvcs = [...server.services];
                                newSvcs.splice(sIdx, 1);
                                updateServer(idx, {...server, services: newSvcs});
                              }}
                              title="Remove service"
                            />
                          </div>
                        ))}
                        <button onClick={() => updateServer(idx, {...server, services: [...server.services, {name: "New Service", tooltip: ""}]})} className="text-sm text-brand-accent hover:underline">+ Add Service</button>
                      </div>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        <button
          onClick={addServer}
          className="mt-6 w-full py-4 border-2 border-dashed border-slate-700 hover:border-brand-accent/50 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-brand-accent transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Server
        </button>
      </div>
    </div>
  );
}
