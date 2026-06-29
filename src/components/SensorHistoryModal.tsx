"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity } from "lucide-react";
import type { HistoryResponse } from "@/types/homeassistant";
import { SENSOR_HISTORY_DAYS, SENSOR_HISTORY_MS, SENSOR_HISTORY_REFRESH_MS } from "@/types/homeassistant";

function buildChartXTicks(
  startTime: number,
  endTime: number,
  chartWidth: number,
  multiDay: boolean
): { time: Date; x: number }[] {
  const timeRange = endTime - startTime;
  if (timeRange <= 0) return [];

  if (!multiDay) {
    return Array.from({ length: 7 }, (_, i) => {
      const t = startTime + timeRange * (i / 6);
      return { time: new Date(t), x: (i / 6) * chartWidth };
    });
  }

  const ticks: { time: Date; x: number }[] = [];
  const dayCursor = new Date(startTime);
  dayCursor.setHours(0, 0, 0, 0);

  const endDay = new Date(endTime);
  endDay.setHours(0, 0, 0, 0);

  while (dayCursor.getTime() <= endDay.getTime()) {
    const t = dayCursor.getTime();
    let x = ((t - startTime) / timeRange) * chartWidth;
    if (ticks.length === 0 && x < 0) x = 0;
    if (x >= 0 && x <= chartWidth) {
      ticks.push({ time: new Date(dayCursor), x });
    }
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return ticks;
}

interface SensorHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensorKey: string;
  name: string;
  unit: string;
  deviceClass: string;
  live?: { state: number; time: string } | null;
}

export function SensorHistoryModal({ isOpen, onClose, sensorKey, name, unit, deviceClass, live = null }: SensorHistoryModalProps) {
  const [result, setResult] = useState<(HistoryResponse & { sensorKey: string }) | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  
  // Hover state
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    mean: number;
    min: number;
    max: number;
    time: string;
    isLive: boolean;
  } | null>(null);

  const chartWidth = 800;
  const chartHeight = 350;

  useEffect(() => {
    if (!isOpen || !sensorKey) return;

    const controller = new AbortController();
    let disposed = false;

    const loadHistory = async (background: boolean) => {
      try {
        const res = await fetch(
          `/api/homeassistant/history?sensorKey=${encodeURIComponent(sensorKey)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed");
        const data: HistoryResponse = await res.json();
        if (disposed) return;
        setResult({
          sensorKey,
          history: data.history || [],
        });
        setErrorKey(null);
      } catch (err) {
        if (disposed || (err instanceof DOMException && err.name === "AbortError")) return;
        console.error(err);
        if (!background) setErrorKey(sensorKey);
      }
    };

    void loadHistory(false);
    const interval = setInterval(() => void loadHistory(true), SENSOR_HISTORY_REFRESH_MS);

    return () => {
      disposed = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [isOpen, sensorKey]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const currentResult = result?.sensorKey === sensorKey ? result : null;
  const history = currentResult?.history ?? null;
  const loading = Boolean(isOpen && sensorKey && !currentResult && errorKey !== sensorKey);
  const error = Boolean(errorKey === sensorKey);

  const { meanPath, bandPath, dataPoints, yTicks, xTicks, livePoint } = useMemo(() => {
    if (!history) {
      return { meanPath: "", bandPath: "", dataPoints: [], yTicks: [], xTicks: [], livePoint: null };
    }

    const sorted = [...history].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const allMinValues = sorted.map((d) => d.min);
    const allMaxValues = sorted.map((d) => d.max);
    const liveValue = live?.state;
    const minState = Math.min(...(allMinValues.length ? allMinValues : [liveValue ?? 0]), liveValue ?? Number.POSITIVE_INFINITY);
    const maxState = Math.max(...(allMaxValues.length ? allMaxValues : [liveValue ?? 0]), liveValue ?? Number.NEGATIVE_INFINITY);
    
    const range = maxState - minState;
    const padding = range === 0 ? 1 : range * 0.1;
    const chartMin = minState - padding;
    const chartMax = maxState + padding;
    const chartRange = chartMax - chartMin;

    // Anchor the chart window to the most recent timestamp.
    const lastHistoryTime = sorted.length ? new Date(sorted[sorted.length - 1].time).getTime() : 0;
    const liveTime = live ? new Date(live.time).getTime() : 0;
    const endTime = Math.max(lastHistoryTime, liveTime);
    const startTime = endTime - SENSOR_HISTORY_MS;
    const timeRange = endTime - startTime;

    const historyPoints = sorted.map((d) => {
      const pointTime = new Date(d.time).getTime();
      let x = ((pointTime - startTime) / timeRange) * chartWidth;
      x = Math.max(0, Math.min(chartWidth, x));
      const y = chartHeight - ((d.mean - chartMin) / chartRange) * chartHeight;
      const yMin = chartHeight - ((d.min - chartMin) / chartRange) * chartHeight;
      const yMax = chartHeight - ((d.max - chartMin) / chartRange) * chartHeight;

      return { x, y, yMin, yMax, mean: d.mean, min: d.min, max: d.max, time: d.time, isLive: false };
    });

    let livePoint: { x: number; y: number; mean: number; min: number; max: number; time: string; isLive: boolean } | null = null;
    if (live && Number.isFinite(live.state)) {
      const liveTime = new Date(live.time).getTime();
      let liveX = ((liveTime - startTime) / timeRange) * chartWidth;
      liveX = Math.max(0, Math.min(chartWidth, liveX));
      const liveY = chartHeight - ((live.state - chartMin) / chartRange) * chartHeight;
      livePoint = {
        x: liveX,
        y: liveY,
        mean: live.state,
        min: live.state,
        max: live.state,
        time: live.time,
        isLive: true,
      };
    }

    const points = livePoint ? [...historyPoints, livePoint] : historyPoints;

    let meanPath = "";
    if (points.length > 0) {
      meanPath = `M ${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        meanPath += ` L ${points[i].x},${points[i].y}`;
      }
    }

    let bandPath = "";
    if (historyPoints.length > 1) {
      const upper = historyPoints.map((p) => `${p.x},${p.yMax}`).join(" L ");
      const lower = [...historyPoints].reverse().map((p) => `${p.x},${p.yMin}`).join(" L ");
      bandPath = `M ${upper} L ${lower} Z`;
    }

    const yTicks = Array.from({ length: 6 }).map((_, i) => {
      const val = chartMax - (chartRange * (i / 5));
      return { val, y: (i / 5) * chartHeight };
    });

    const xTicks = buildChartXTicks(
      startTime,
      endTime,
      chartWidth,
      SENSOR_HISTORY_DAYS > 1
    );

    return { meanPath, bandPath, dataPoints: points, yTicks, xTicks, livePoint };
  }, [history, live]);

  const updateHover = (mouseX: number) => {
    if (!dataPoints.length) return;
    if (mouseX < 0 || mouseX > chartWidth) return;
    
    let closest = dataPoints[0];
    let minDiff = Math.abs(mouseX - closest.x);
    
    for (let i = 1; i < dataPoints.length; i++) {
      const diff = Math.abs(mouseX - dataPoints[i].x);
      if (diff < minDiff) {
        minDiff = diff;
        closest = dataPoints[i];
      }
    }
    setHoveredPoint(closest);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    updateHover(mouseX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = ((touch.clientX - rect.left) / rect.width) * chartWidth;
    updateHover(mouseX);
  };

  const handleMouseLeave = () => setHoveredPoint(null);

  const lineColor = 
    deviceClass === "temperature" ? "stroke-orange-500" :
    deviceClass === "humidity" ? "stroke-blue-500" :
    "stroke-brand-accent";

  const hoverColorClass = 
    deviceClass === "temperature" ? "bg-orange-500 border-orange-500" :
    deviceClass === "humidity" ? "bg-blue-500 border-blue-500" :
    "bg-brand-accent border-brand-accent";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-12 pt-4">
              {loading ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Activity className="w-8 h-8 animate-pulse text-brand-accent" />
                    <span className="text-sm font-medium animate-pulse">Loading history...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="h-[350px] w-full flex items-center justify-center text-red-500">
                  Failed to load history data.
                </div>
              ) : history && history.length === 0 && !live ? (
                <div className="h-[350px] w-full flex items-center justify-center text-slate-400">
                  No data available for the last {SENSOR_HISTORY_DAYS} days.
                </div>
              ) : (
                <div className="relative w-full h-[350px] pl-12 pr-4 mt-4">
                  {/* Unit label */}
                  <div className="absolute -top-6 left-12 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {unit}
                  </div>

                  {/* Y-Axis Labels */}
                  {yTicks.map(t => (
                    <div 
                      key={`y-${t.y}`} 
                      className="absolute left-0 w-10 text-right text-xs text-slate-500 dark:text-slate-400 -translate-y-1/2 select-none" 
                      style={{ top: `${(t.y / chartHeight) * 100}%` }}
                    >
                      {t.val.toFixed(1)}
                    </div>
                  ))}

                  {/* Chart Container */}
                  <div 
                    className="relative w-full h-full border-b border-slate-200 dark:border-slate-800 cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseLeave}
                  >
                    {/* Grid */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                      {yTicks.map(t => (
                        <line key={`gl-y-${t.y}`} x1="0" y1={`${(t.y / chartHeight) * 100}%`} x2="100%" y2={`${(t.y / chartHeight) * 100}%`} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                      ))}
                      {xTicks.map(t => (
                        <line key={`gl-x-${t.x}`} x1={`${(t.x / chartWidth) * 100}%`} y1="0" x2={`${(t.x / chartWidth) * 100}%`} y2="100%" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                      ))}
                    </svg>

                    {/* Min/Max band + Mean line */}
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                      {bandPath && (
                        <path
                          d={bandPath}
                          fill={deviceClass === "temperature" ? "rgba(249,115,22,0.15)" : deviceClass === "humidity" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)"}
                        />
                      )}
                      <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        d={meanPath}
                        fill="none"
                        className={lineColor}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>

                    {livePoint && (
                      <div
                        className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full animate-pulse shadow-[0_0_0_2px_rgba(255,255,255,1)] dark:shadow-[0_0_0_2px_rgba(26,27,30,1)] ${hoverColorClass}`}
                        style={{
                          left: `${(livePoint.x / chartWidth) * 100}%`,
                          top: `${(livePoint.y / chartHeight) * 100}%`,
                        }}
                      />
                    )}

                    {/* Hover Overlay */}
                    {hoveredPoint && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Vertical Crosshair Line */}
                        <div 
                          className="absolute top-0 bottom-0 w-px bg-slate-400 dark:bg-slate-500"
                          style={{ left: `${(hoveredPoint.x / chartWidth) * 100}%` }}
                        />
                        
                        {/* Data Point Dot */}
                        <div 
                          className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,1)] dark:shadow-[0_0_0_2px_rgba(26,27,30,1)] ${hoverColorClass}`}
                          style={{ 
                            left: `${(hoveredPoint.x / chartWidth) * 100}%`, 
                            top: `${(hoveredPoint.y / chartHeight) * 100}%` 
                          }}
                        />

                        {/* Tooltip */}
                        <div 
                          className="absolute z-20 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white text-xs rounded-lg shadow-xl p-3 border border-slate-700/50 whitespace-nowrap transform -translate-x-1/2 -translate-y-[calc(100%+16px)] transition-all duration-75"
                          style={{ 
                            left: `${(hoveredPoint.x / chartWidth) * 100}%`, 
                            top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                            marginLeft: hoveredPoint.x < 150 ? "40px" : hoveredPoint.x > 650 ? "-40px" : "0"
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-bold">{hoveredPoint.mean.toFixed(1)}</span>
                            <span className="text-slate-300 font-medium">{unit}</span>
                            {hoveredPoint.isLive && (
                              <span className="text-[10px] uppercase tracking-widest text-emerald-300">Live</span>
                            )}
                          </div>
                          {!hoveredPoint.isLive && (
                            <div className="text-slate-300/90 font-medium mb-1">
                              ↑ {hoveredPoint.max.toFixed(1)} · ↓ {hoveredPoint.min.toFixed(1)}
                            </div>
                          )}
                          <div className="text-slate-400 font-medium">
                            {new Date(hoveredPoint.time).toLocaleString("en-GB", {
                              weekday: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* X-Axis Labels */}
                  {xTicks.map((t, i) => (
                    <div 
                      key={`x-${t.x}`} 
                      className="absolute top-full mt-3 text-xs text-slate-500 dark:text-slate-400 -translate-x-1/2 select-none" 
                      style={{ left: `calc(3rem + ${(t.x / chartWidth) * 100}%)` }}
                    >
                      {SENSOR_HISTORY_DAYS > 1 ||
                      i === 0 ||
                      (t.time.getHours() === 0 && t.time.getMinutes() === 0) ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {t.time.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </span>
                      ) : (
                        t.time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
