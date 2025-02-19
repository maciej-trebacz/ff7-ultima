import { Store, load } from '@tauri-apps/plugin-store';
import { RandomEncounters } from './types';
import { SaveState, SnowBoardSaveState } from './useSaveStates';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';

let settingsStore: Store | null = null;

export interface HackSettings {
  speed?: string;
  skipIntros?: boolean;
  unfocusPatch?: boolean;
  swirlSkip?: boolean;
  randomBattles?: RandomEncounters;
}

export interface SaveStates {
  fieldStates: SaveState[];
  snowboardStates: SnowBoardSaveState[];
}

export async function getSettingsStore(): Promise<Store> {
  if (!settingsStore) {
    settingsStore = await load('settings.json', { autoSave: true });
  }
  return settingsStore;
}

async function backupSaveStates(states: SaveStates) {
  try {
    const backup = {
      timestamp: Date.now(),
      states
    };
    const json = JSON.stringify(backup);
    await writeFile('settings.backup.json', new TextEncoder().encode(json));
  } catch (e) {
    console.error('Failed to create backup:', e);
  }
}

async function loadBackupSaveStates(): Promise<SaveStates | null> {
  try {
    const backupContent = await readFile('settings.backup.json');
    const json = new TextDecoder().decode(backupContent);
    const backup = JSON.parse(json);
    return backup.states;
  } catch (e) {
    console.error('Failed to load backup:', e);
    return null;
  }
}

export async function saveSaveStates(states: SaveStates) {
  try {
    const store = await getSettingsStore();
    await store.set('saveStates', states);
    await store.save();
    // Create a backup after successful save
    await backupSaveStates(states);
  } catch (e) {
    console.error('Failed to save states:', e);
    // Try to save to backup file if main save fails
    await backupSaveStates(states);
  }
}

export async function loadSaveStates(): Promise<SaveStates | null> {
  try {
    const store = await getSettingsStore();
    const states = await store.get<SaveStates>('saveStates');
    
    if (!states) {
      // Try to load from backup if main file is empty
      const backup = await loadBackupSaveStates();
      if (backup) {
        console.log('Restored states from backup file');
        return backup;
      }
      return { fieldStates: [], snowboardStates: [] };
    }

    // Ensure each state has an ID
    const fieldStates = states.fieldStates.map(state => ({
      ...state,
      id: state.id || crypto.randomUUID()
    }));

    const snowboardStates = states.snowboardStates.map(state => ({
      ...state,
      id: state.id || crypto.randomUUID()
    }));

    // Save the updated states back to disk
    await store.set('saveStates', { fieldStates, snowboardStates });
    await store.save();
    
    return { fieldStates, snowboardStates };
  } catch (e) {
    console.error('Failed to load save states:', e);
    // Try to load from backup if main file fails
    const backup = await loadBackupSaveStates();
    if (backup) {
      console.log('Restored states from backup file');
      return backup;
    }
    return { fieldStates: [], snowboardStates: [] };
  }
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