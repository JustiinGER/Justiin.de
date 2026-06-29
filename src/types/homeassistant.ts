export type SensorTrend = "up" | "down" | "flat";

export interface SensorData {
  key: string;
  name: string;
  state: string;
  unit: string;
  device_class: string;
  last_changed: string;
  trend: SensorTrend | null;
}

export interface SensorGroup {
  label: string | null;
  sensors: SensorData[];
}

export interface HAData {
  configured: boolean;
  groups: SensorGroup[];
}

export interface HistoryPoint {
  time: string;
  mean: number;
  min: number;
  max: number;
}

export interface HistoryResponse {
  history: HistoryPoint[];
}

export const SENSOR_HISTORY_DAYS = 3;
export const SENSOR_HISTORY_MS = SENSOR_HISTORY_DAYS * 24 * 60 * 60 * 1000;
/** Background history refresh while modal is open (aligned with server cache). */
export const SENSOR_HISTORY_REFRESH_MS = 5 * 60 * 1000;
