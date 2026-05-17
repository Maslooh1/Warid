import { Store } from "@tauri-apps/plugin-store";
import { DEFAULT_SETTINGS, type Settings } from "../types";

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load("settings.json", { defaults: {}, autoSave: true });
  }
  return store;
}

export async function loadSettings(): Promise<Settings> {
  const s = await getStore();
  const saved: Partial<Settings> = {};

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const val = await s.get<Settings[typeof key]>(key);
    if (val !== null && val !== undefined) {
      (saved as Record<string, unknown>)[key] = val;
    }
  }

  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const s = await getStore();
  for (const [key, val] of Object.entries(settings)) {
    await s.set(key, val);
  }
}

export async function getApiKey(): Promise<string> {
  const s = await getStore();
  return (await s.get<string>("apiKey")) ?? "";
}

export async function setApiKey(key: string): Promise<void> {
  const s = await getStore();
  await s.set("apiKey", key);
}
