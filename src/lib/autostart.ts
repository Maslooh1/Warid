import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

export async function setLaunchOnStartup(enabled: boolean): Promise<void> {
  const current = await isEnabled().catch(() => false);
  if (enabled && !current) {
    await enable();
  } else if (!enabled && current) {
    await disable();
  }
}

export async function isLaunchOnStartupEnabled(): Promise<boolean> {
  return isEnabled().catch(() => false);
}
