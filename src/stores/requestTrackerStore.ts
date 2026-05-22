import { create } from "zustand";

interface QuotaState {
  // Key: YYYY-MM-DD
  usage: Record<string, Record<string, number>>;
  incrementRequest: (modelId: string) => void;
  getRequestCountToday: (modelId: string) => number;
}

const STORAGE_KEY = "warid-request-quota-v1";

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const loadInitialUsage = (): Record<string, Record<string, number>> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Basic validation: clear old entries to prevent localStorage bloat, keeping only the last 7 days
    const today = getTodayString();
    const cleaned: Record<string, Record<string, number>> = {};
    for (const key of Object.keys(parsed)) {
      const diffTime = Math.abs(new Date(today).getTime() - new Date(key).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        cleaned[key] = parsed[key];
      }
    }
    return cleaned;
  } catch {
    return {};
  }
};

export const useRequestTrackerStore = create<QuotaState>((set, get) => ({
  usage: loadInitialUsage(),

  incrementRequest: (modelId: string) => {
    const today = getTodayString();
    set((state) => {
      const dayUsage = state.usage[today] ? { ...state.usage[today] } : {};
      dayUsage[modelId] = (dayUsage[modelId] ?? 0) + 1;
      const updatedUsage = { ...state.usage, [today]: dayUsage };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsage));
      return { usage: updatedUsage };
    });
  },

  getRequestCountToday: (modelId: string) => {
    const today = getTodayString();
    return get().usage[today]?.[modelId] ?? 0;
  },
}));
