"use client";

import { useEffect, useState } from "react";
import { Thermometer, Droplets, Activity } from "lucide-react";
import { SensorHistoryModal } from "./SensorHistoryModal";

interface SensorData {
  key: string;
  name: string;
  state: string;
  unit: string;
  device_class: string;
}

interface SensorGroup {
  label: string | null;
  sensors: SensorData[];
}

interface HAData {
  configured: boolean;
  groups: SensorGroup[];
}

export function HomeAssistant() {
  const [data, setData] = useState<HAData | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/homeassistant");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch HA data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data || !data.configured || data.groups.length === 0) return null;

  const allEmpty = data.groups.every((g) => g.sensors.length === 0);
  if (allEmpty) return null;

  const getIcon = (deviceClass: string) => {
    switch (deviceClass) {
      case "temperature":
        return <Thermometer className="w-4 h-4" aria-hidden="true" />;
      case "humidity":
        return <Droplets className="w-4 h-4" aria-hidden="true" />;
      default:
        return <Activity className="w-4 h-4" aria-hidden="true" />;
    }
  };

  const hasLabels = data.groups.some((g) => g.label);

  return (
    <>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {data.groups.map((group, groupIdx) => (
          <div 
            key={groupIdx} 
            className="flex items-stretch rounded-full border border-brand-border bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm overflow-hidden"
          >
            {/* Label Section */}
            {hasLabels && group.label && (
              <div className="flex items-center justify-center px-4 bg-black/5 dark:bg-white/5 border-r border-brand-border/50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 select-none">
                  {group.label}
                </span>
              </div>
            )}

            {/* Sensors Section */}
              {group.sensors.map((sensor, idx) => (
                <button
                  key={sensor.key}
                  onClick={() => setSelectedSensor(sensor)}
                className={`group focus:outline-none flex items-center gap-1.5 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                  idx > 0 ? "border-l border-brand-border/50" : ""
                }`}
                  title={`View history for ${sensor.name}`}
              >
                <span
                  className={
                    sensor.device_class === "temperature"
                      ? "text-orange-500"
                      : sensor.device_class === "humidity"
                      ? "text-blue-500"
                      : "text-brand-accent"
                  }
                >
                  {getIcon(sensor.device_class)}
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {sensor.state}
                  <span className="text-[10px] ml-0.5 text-brand-muted font-medium">{sensor.unit}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <SensorHistoryModal
        isOpen={!!selectedSensor}
        onClose={() => setSelectedSensor(null)}
        sensorKey={selectedSensor?.key || ""}
        name={selectedSensor?.name || ""}
        unit={selectedSensor?.unit || ""}
        deviceClass={selectedSensor?.device_class || ""}
      />
    </>
  );
}
