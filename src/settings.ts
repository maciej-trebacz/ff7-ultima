import { Store, load } from '@tauri-apps/plugin-store';
import { RandomEncounters } from './types';

let settingsStore: Store | null = null;

export interface HackSettings {
  speed?: string;
  skipIntros?: boolean;
  unfocusPatch?: boolean;
  swirlSkip?: boolean;
  randomBattles?: RandomEncounters;
}

export async function getSettingsStore(): Promise<Store> {
  if (!settingsStore) {
    settingsStore = await load('settings.json', { autoSave: true });
  }
  return settingsStore;
}

export async function saveShortcuts(shortcuts: Record<string, string>) {
  const store = await getSettingsStore();
  await store.set('shortcuts', shortcuts);
  await store.save();
}

export async function loadShortcuts(): Promise<Record<string, string> | null> {
  try {
    const store = await getSettingsStore();
    const shortcuts = await store.get<Record<string, string>>('shortcuts');
    return shortcuts || null;
  } catch (e) {
    console.error('Failed to load shortcuts:', e);
    return null;
  }
}

export async function saveHackSettings(settings: HackSettings) {
  const store = await getSettingsStore();
  await store.set('hacks', settings);
  await store.save();
}

export async function loadHackSettings(): Promise<HackSettings | null> {
  try {
    const store = await getSettingsStore();
    const settings = await store.get<HackSettings>('hacks');
    return settings || null;
  } catch (e) {
    console.error('Failed to load hack settings:', e);
    return null;
  }
} 