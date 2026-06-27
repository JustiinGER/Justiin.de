"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity } from "lucide-react";

interface HistoryDataPoint {
  state: number;
  time: string;
}

interface SensorHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensorKey: string;
  name: string;
  unit: string;
  deviceClass: string;
}

export function SensorHistoryModal({ isOpen, onClose, sensorKey, name, unit, deviceClass }: SensorHistoryModalProps) {
  const [history, setHistory] = useState<HistoryDataPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Hover state
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, state: number, time: string} | null>(null);

  useEffect(() => {
    if (isOpen && sensorKey) {
      setLoading(true);
      setError(false);
      setHistory(null);
      setHoveredPoint(null);
      
      fetch(`/api/homeassistant/history?sensorKey=${encodeURIComponent(sensorKey)}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed");
          return res.json();
        })
        .then(data => {
          setHistory(data.history || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(true);
          setLoading(false);
        });
    }
  }, [isOpen, sensorKey]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const { path, dataPoints, yTicks, xTicks } = useMemo(() => {
    if (!history || history.length === 0) return { path: "", dataPoints: [], yTicks: [], xTicks: [] };
    
    const sorted = [...history].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const states = sorted.map(d => d.state);
    const minState = Math.min(...states);
    const maxState = Math.max(...states);
    
    const range = maxState - minState;
    const padding = range === 0 ? 1 : range * 0.1;
    const chartMin = minState - padding;
    const chartMax = maxState + padding;
    const chartRange = chartMax - chartMin;

    const width = 800;
    const height = 300;

    // Fix the X-axis to exactly the last 24 hours
    const endTime = Date.now();
    const startTime = endTime - 24 * 60 * 60 * 1000;
    const timeRange = endTime - startTime;

    const points = sorted.map((d) => {
      const pointTime = new Date(d.time).getTime();
      // Clamp to 0-width just in case data is slightly out of bounds
      let x = ((pointTime - startTime) / timeRange) * width;
      x = Math.max(0, Math.min(width, x));
      const y = height - ((d.state - chartMin) / chartRange) * height;
      return { x, y, state: d.state, time: d.time };
    });

    let d = "";
    if (points.length > 0) {
      d = `M ${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x},${points[i].y}`;
      }
    }

    // 6 horizontal grid lines
    const yTicks = Array.from({length: 6}).map((_, i) => {
      const val = chartMax - (chartRange * (i / 5));
      return { val, y: (i / 5) * height };
    });

    // 7 vertical grid lines (every 4 hours)
    const xTicks = Array.from({length: 7}).map((_, i) => {
      const t = startTime + (timeRange * (i / 6));
      return { time: new Date(t), x: (i / 6) * width };
    });

    return { path: d, dataPoints: points, yTicks, xTicks };
  }, [history]);

  const updateHover = (mouseX: number) => {
    if (!dataPoints.length) return;
    if (mouseX < 0 || mouseX > 800) return;
    
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
    const mouseX = ((e.clientX - rect.left) / rect.width) * 800;
    updateHover(mouseX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = ((touch.clientX - rect.left) / rect.width) * 800;
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
              ) : history && history.length === 0 ? (
                <div className="h-[350px] w-full flex items-center justify-center text-slate-400">
                  No data available for the last 24 hours.
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
                      style={{ top: `${(t.y / 350) * 100}%` }}
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
                        <line key={`gl-y-${t.y}`} x1="0" y1={`${(t.y / 350) * 100}%`} x2="100%" y2={`${(t.y / 350) * 100}%`} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                      ))}
                      {xTicks.map(t => (
                        <line key={`gl-x-${t.x}`} x1={`${(t.x / 800) * 100}%`} y1="0" x2={`${(t.x / 800) * 100}%`} y2="100%" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                      ))}
                    </svg>

                    {/* Data Line */}
                    <svg viewBox="0 0 800 350" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                      <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        d={path}
                        fill="none"
                        className={lineColor}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Hover Overlay */}
                    {hoveredPoint && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Vertical Crosshair Line */}
                        <div 
                          className="absolute top-0 bottom-0 w-px bg-slate-400 dark:bg-slate-500"
                          style={{ left: `${(hoveredPoint.x / 800) * 100}%` }}
                        />
                        
                        {/* Data Point Dot */}
                        <div 
                          className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,1)] dark:shadow-[0_0_0_2px_rgba(26,27,30,1)] ${hoverColorClass}`}
                          style={{ 
                            left: `${(hoveredPoint.x / 800) * 100}%`, 
                            top: `${(hoveredPoint.y / 350) * 100}%` 
                          }}
                        />

                        {/* Tooltip */}
                        <div 
                          className="absolute z-20 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md text-white text-xs rounded-lg shadow-xl p-3 border border-slate-700/50 whitespace-nowrap transform -translate-x-1/2 -translate-y-[calc(100%+16px)] transition-all duration-75"
                          style={{ 
                            left: `${(hoveredPoint.x / 800) * 100}%`, 
                            top: `${(hoveredPoint.y / 350) * 100}%`,
                            marginLeft: hoveredPoint.x < 150 ? '40px' : hoveredPoint.x > 650 ? '-40px' : '0'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-bold">{hoveredPoint.state.toFixed(1)}</span>
                            <span className="text-slate-300 font-medium">{unit}</span>
                          </div>
                          <div className="text-slate-400 font-medium">
                            {new Date(hoveredPoint.time).toLocaleString('en-GB', { 
                              weekday: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
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
                      style={{ left: `calc(3rem + ${(t.x / 800) * 100}%)` }}
                    >
                      {/* For the first tick or midnight, show date */}
                      {i === 0 || (t.time.getHours() === 0 && t.time.getMinutes() === 0) ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {t.time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      ) : (
                        t.time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
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
