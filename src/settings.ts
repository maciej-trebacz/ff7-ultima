import { Store, load } from '@tauri-apps/plugin-store';
import { RandomEncounters } from './types';
import { SaveState, SnowBoardSaveState } from './useSaveStates';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { logger } from './lib/logging';
import deepEqual from 'deep-equal';

// Settings change event system
type SettingsKey = 'general' | 'hacks' | 'shortcuts' | 'saveStates';
type SettingsListener = (key: SettingsKey, newValue: any) => void;

const listeners = new Set<SettingsListener>();

export function subscribeToSettings(listener: SettingsListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifySettingsChange(key: SettingsKey, newValue: any) {
  listeners.forEach(listener => {
    try {
      listener(key, newValue);
    } catch (e) {
      logger.error('Error in settings listener', { error: e?.toString() });
    }
  });
}

let settingsStore: Store | null = null;

export type AutoUpdateOption = 'auto' | 'notify' | 'disabled';

export interface GeneralSettings {
  autoUpdate: AutoUpdateOption;
  enableShortcuts: boolean;
  hasSeenSettingsHint?: boolean;
  speedHackEnhancements: boolean;
  rememberedHacks: {
    speed: boolean;
    skipIntros: boolean;
    unfocusPatch: boolean;
    swirlSkip: boolean;
    randomBattles: boolean;
    expMultiplier: boolean;
    apMultiplier: boolean;
    invincibility: boolean;
    instantATB: boolean;
    manualSlots: boolean;
  };
}

export interface HackSettings {
  speed?: string;
  skipIntros?: boolean;
  unfocusPatch?: boolean;
  swirlSkip?: boolean;
  randomBattles?: RandomEncounters;
  invincibility?: boolean;
  instantATB?: boolean;
  expMultiplier?: number;
  apMultiplier?: number;
  manualSlots?: boolean;
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
    logger.info('Created save states backup', { timestamp: backup.timestamp });
  } catch (e) {
    logger.error('Failed to create backup', { error: e?.toString() });
  }
}

async function loadBackupSaveStates(): Promise<SaveStates | null> {
  try {
    const backupContent = await readFile('settings.backup.json');
    const json = new TextDecoder().decode(backupContent);
    const backup = JSON.parse(json);
    logger.info('Loaded save states from backup', { timestamp: backup.timestamp });
    return backup.states;
  } catch (e) {
    logger.error('Failed to load backup', { error: e?.toString() });
    return null;
  }
}

export async function saveSaveStates(states: SaveStates) {
  try {
    const store = await getSettingsStore();
    await store.set('saveStates', states);
    await store.save();
    notifySettingsChange('saveStates', states);
    logger.info('Saved states to main store', { 
      fieldStatesCount: states.fieldStates.length,
      snowboardStatesCount: states.snowboardStates.length 
    });
    // Create a backup after successful save
    await backupSaveStates(states);
  } catch (e) {
    logger.error('Failed to save states to main store', { error: e?.toString() });
    // Try to save to backup file if main save fails
    await backupSaveStates(states);
  }
}

export async function loadSaveStates(): Promise<SaveStates | null> {
  try {
    const store = await getSettingsStore();
    const states = await store.get<SaveStates>('saveStates');
    
    if (!states) {
      logger.warn('No states found in main store, attempting to load from backup');
      // Try to load from backup if main file is empty
      const backup = await loadBackupSaveStates();
      if (backup) {
        logger.info('Restored states from backup file');
        return backup;
      }
      logger.info('No backup found, returning empty states');
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

    logger.info('Loaded states from main store', {
      fieldStatesCount: fieldStates.length,
      snowboardStatesCount: snowboardStates.length
    });

    // Save the updated states back to disk
    await store.set('saveStates', { fieldStates, snowboardStates });
    await store.save();
    
    return { fieldStates, snowboardStates };
  } catch (e) {
    logger.error('Failed to load save states from main store', { error: e?.toString() });
    // Try to load from backup if main file fails
    const backup = await loadBackupSaveStates();
    if (backup) {
      logger.info('Restored states from backup file');
      return backup;
    }
    return { fieldStates: [], snowboardStates: [] };
  }
}

export async function saveShortcuts(shortcuts: Record<string, string>) {
  try {
    const store = await getSettingsStore();
    await store.set('shortcuts', shortcuts);
    await store.save();
    notifySettingsChange('shortcuts', shortcuts);
    logger.info('Saved shortcuts', { count: Object.keys(shortcuts).length });
  } catch (e) {
    logger.error('Failed to save shortcuts', { error: e?.toString() });
  }
}

export async function loadShortcuts(): Promise<Record<string, string> | null> {
  try {
    const store = await getSettingsStore();
    const shortcuts = await store.get<Record<string, string>>('shortcuts');
    logger.info('Loaded shortcuts', { count: shortcuts ? Object.keys(shortcuts).length : 0 });
    return shortcuts || null;
  } catch (e) {
    logger.error('Failed to load shortcuts', { error: e?.toString() });
    return null;
  }
}

export async function saveHackSettings(settings: HackSettings) {
  try {
    const store = await getSettingsStore();
    await store.set('hacks', settings);
    await store.save();
    notifySettingsChange('hacks', settings);
    logger.info('Saved hack settings', { settings });
  } catch (e) {
    logger.error('Failed to save hack settings', { error: e?.toString() });
  }
}

export async function loadHackSettings(): Promise<HackSettings | null> {
  try {
    const store = await getSettingsStore();
    const settings = await store.get<HackSettings>('hacks');
    logger.info('Loaded hack settings', { settings: settings || 'none' });
    return settings || null;
  } catch (e) {
    logger.error('Failed to load hack settings', { error: e?.toString() });
    return null;
  }
}

export async function saveGeneralSettings(settings: GeneralSettings) {
  try {
    const store = await getSettingsStore();
    await store.set('general', settings);
    await store.save();
    notifySettingsChange('general', settings);
    logger.info('Saved general settings', { settings });
  } catch (e) {
    logger.error('Failed to save general settings', { error: e?.toString() });
  }
}

export async function loadGeneralSettings(): Promise<GeneralSettings> {
  const defaultSettings: GeneralSettings = {
    autoUpdate: 'auto',
    enableShortcuts: true,
    hasSeenSettingsHint: false,
    speedHackEnhancements: true,
    rememberedHacks: {
      speed: true,
      skipIntros: true,
      unfocusPatch: true,
      swirlSkip: true,
      randomBattles: true,
      expMultiplier: true,
      apMultiplier: true,
      invincibility: true,
      instantATB: true,
      manualSlots: true
    }
  };

  try {
    const store = await getSettingsStore();
    const settings = await store.get<GeneralSettings>('general');

    if (!settings) {
      logger.info('No general settings found, using defaults', { settings: defaultSettings });
      await saveGeneralSettings(defaultSettings);
      return defaultSettings;
    }

    // Ensure all fields have default values for users upgrading from older versions
    const updatedSettings: GeneralSettings = {
      autoUpdate: settings.autoUpdate ?? defaultSettings.autoUpdate,
      enableShortcuts: settings.enableShortcuts ?? defaultSettings.enableShortcuts,
      hasSeenSettingsHint: settings.hasSeenSettingsHint ?? defaultSettings.hasSeenSettingsHint,
      speedHackEnhancements: settings.speedHackEnhancements ?? defaultSettings.speedHackEnhancements,
      rememberedHacks: {
        ...defaultSettings.rememberedHacks,
        ...settings.rememberedHacks
      }
    };

    // If any defaults were applied, save the updated settings
    if (!deepEqual(settings, updatedSettings, { strict: true })) {
      logger.info('Updating settings with defaults for missing fields', { 
        original: settings,
        updated: updatedSettings
      });
      await saveGeneralSettings(updatedSettings);
    }

    logger.info('Loaded general settings', { settings: updatedSettings });
    return updatedSettings;
  } catch (e) {
    logger.error('Failed to load general settings', { error: e?.toString() });
    // Return default settings on error
    return defaultSettings;
  }
} 