import { atom, useAtom } from 'jotai';
import { useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash-es';
import { load, Store } from '@tauri-apps/plugin-store';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { logger } from './lib/logging';
import deepEqual from 'deep-equal';
import { Destination } from './types';
import { RandomEncounters } from './types';

export type AutoUpdateOption = 'auto' | 'notify' | 'disabled';

export interface GeneralSettings {
  autoUpdate: AutoUpdateOption;
  enableShortcuts: boolean;
  hasSeenSettingsHint: boolean;
  lastDismissedUpdateVersion: string | null;
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

export interface SaveStateBase {
  id: string;
  timestamp: number;
  title?: string;
}

export type SaveState = SaveStateBase & {
  regions: number[][];
  regionOffsets?: [number, number][];
  savemap: number[];
  fieldId: number;
  fieldName: string;
  destination?: Destination;
};

export type SnowBoardSaveState = SaveStateBase & {
  globalObjData: number[];
  entitiesData: number[];
};

const generalSettingsAtom = atom<GeneralSettings | null>(null);
const hackSettingsAtom = atom<HackSettings | null>(null);
const shortcutsAtom = atom<Record<string, string> | null>(null);
const saveStatesAtom = atom<SaveStates>({ fieldStates: [], snowboardStates: [] });

let storeInstance: Store | null = null;
let initializationPromise: Promise<void> | null = null;

async function getOrInitializeStore(): Promise<Store> {
  if (storeInstance) {
    return storeInstance;
  }
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const store = await load('settings.json', { autoSave: false });
        storeInstance = store;
        logger.info('Settings store initialized successfully.');
      } catch (error) {
        logger.error('Failed to initialize settings store', { error });
        initializationPromise = null;
        throw error;
      }
    })();
  }
  await initializationPromise;
  if (!storeInstance) {
    throw new Error('Store initialization failed unexpectedly after waiting.');
  }
  return storeInstance;
}

async function backupSaveStates(states: SaveStates) {
  try {
    const backup = { timestamp: Date.now(), states };
    const json = JSON.stringify(backup);
    await writeFile('settings.backup.json', new TextEncoder().encode(json));
    logger.info('Created save states backup', { timestamp: backup.timestamp });
  } catch (e) {
    logger.error('Failed to create backup', { error: e?.toString() });
  }
}

async function loadBackupSaveStates(store: Store): Promise<SaveStates | null> {
  try {
    const backupContent = await readFile('settings.backup.json');
    const json = new TextDecoder().decode(backupContent);
    const backup = JSON.parse(json);
    logger.info('Loaded save states from backup', { timestamp: backup.timestamp });
    await store.set('saveStates', backup.states);
    await store.save();
    return backup.states;
  } catch (e) {
    logger.error('Failed to load backup', { error: e?.toString() });
    return null;
  }
}

export function useSettings() {
  const [generalSettings, setGeneralSettings] = useAtom(generalSettingsAtom);
  const [hackSettings, setHackSettings] = useAtom(hackSettingsAtom);
  const [shortcuts, setShortcuts] = useAtom(shortcutsAtom);
  const [saveStates, setSaveStates] = useAtom(saveStatesAtom);
  const loadAttemptedRef = useRef(false);

  useEffect(() => {
    if (loadAttemptedRef.current) {
      return;
    }
    loadAttemptedRef.current = true;

    const loadData = async () => {
      try {
        const store = await getOrInitializeStore();

        if (generalSettings !== null) {
          logger.debug('Settings seem already loaded. Skipping redundant load.');
          return;
        }

        logger.debug('Loading settings data into hook state...');

        let general = await store.get<GeneralSettings>('general');
        const defaultGeneral = getDefaultGeneralSettings();
        if (!general) {
          general = defaultGeneral;
          await store.set('general', general);
          await store.save();
        } else {
          const updatedGeneral = {
            ...defaultGeneral,
            ...general,
            rememberedHacks: { ...defaultGeneral.rememberedHacks, ...general.rememberedHacks },
          };
          if (!deepEqual(general, updatedGeneral, { strict: true })) {
            await store.set('general', updatedGeneral);
            await store.save();
            general = updatedGeneral;
          }
        }
        setGeneralSettings(prev => deepEqual(prev, general, { strict: true }) ? prev : general);

        const hacks = await store.get<HackSettings>('hacks');
        setHackSettings(prev => deepEqual(prev, hacks || null, { strict: true }) ? prev : (hacks || null));

        const shortcutsData = await store.get<Record<string, string>>('shortcuts');
        setShortcuts(prev => deepEqual(prev, shortcutsData || null, { strict: true }) ? prev : (shortcutsData || null));

        let states: SaveStates | null | undefined = await store.get<SaveStates>('saveStates');
        if (!states) {
            logger.warn('Main save states not found, attempting to load backup...');
            states = await loadBackupSaveStates(store);
        }
        const defaultStates = { fieldStates: [], snowboardStates: [] };
        const currentStates = states || defaultStates;
        const initializedStates: SaveStates = {
            fieldStates: (currentStates.fieldStates || []).map(state => ({
                ...state,
                id: state.id || crypto.randomUUID(),
            })),
            snowboardStates: (currentStates.snowboardStates || []).map(state => ({
                ...state,
                id: state.id || crypto.randomUUID(),
            })),
        };
        if (!states || !deepEqual(states, initializedStates, { strict: true })) {
            await store.set('saveStates', initializedStates);
            await store.save();
            logger.info('Initialized or updated save states in store.');
        }
        setSaveStates(prev => deepEqual(prev, initializedStates, { strict: true }) ? prev : initializedStates);

        logger.info('Settings loaded successfully into hook state.');

      } catch (error) {
        logger.error('Failed to load settings data in useSettings hook', { error });
      }
    };

    loadData();
  }, [generalSettings]);

  const saveGeneralSettings = useCallback(
    debounce(async (settings: GeneralSettings) => {
      try {
        const store = await getOrInitializeStore();
        await store.set('general', settings);
        await store.save();
        logger.info('Saved general settings', { settings });
      } catch (error) {
        logger.error('Failed to save general settings', { error });
      }
    }, 1000),
    []
  );

  const saveHackSettings = useCallback(
    debounce(async (settings: HackSettings) => {
       try {
        const store = await getOrInitializeStore();
        await store.set('hacks', settings);
        await store.save();
        logger.info('Saved hack settings', { settings });
      } catch (error) {
        logger.error('Failed to save hack settings', { error });
      }
    }, 1000),
    []
  );

  const saveShortcuts = useCallback(
    debounce(async (shortcutsData: Record<string, string>) => {
      try {
        const store = await getOrInitializeStore();
        await store.set('shortcuts', shortcutsData);
        await store.save();
        logger.info('Saved shortcuts', { count: Object.keys(shortcutsData).length });
      } catch (error) {
        logger.error('Failed to save shortcuts', { error });
      }
    }, 1000),
    []
  );

  const saveSaveStates = useCallback(
    debounce(async (states: SaveStates) => {
      try {
        const store = await getOrInitializeStore();
        const statesWithIds: SaveStates = {
            fieldStates: states.fieldStates.map(s => ({ ...s, id: s.id || crypto.randomUUID() })),
            snowboardStates: states.snowboardStates.map(s => ({ ...s, id: s.id || crypto.randomUUID() })),
        };
        await store.set('saveStates', statesWithIds);
        await store.save();
        logger.info('Saved states to main store', {
          fieldStatesCount: statesWithIds.fieldStates.length,
          snowboardStatesCount: statesWithIds.snowboardStates.length,
        });
        await backupSaveStates(statesWithIds);
      } catch (error) {
        logger.error('Failed to save save states', { error });
      }
    }, 1000),
    []
  );

  const updateGeneralSettings = useCallback((newSettings: GeneralSettings) => {
    setGeneralSettings(currentSettings => {
      if (deepEqual(currentSettings, newSettings, { strict: true })) {
        return currentSettings;
      }
      saveGeneralSettings(newSettings);
      return newSettings;
    });
  }, [saveGeneralSettings]);

  const updateHackSettings = useCallback((newSettings: HackSettings) => {
    setHackSettings(currentSettings => {
      if (deepEqual(currentSettings, newSettings, { strict: true })) {
        return currentSettings;
      }
      saveHackSettings(newSettings);
      return newSettings;
    });
  }, [saveHackSettings]);

  const updateShortcuts = useCallback((newShortcuts: Record<string, string>) => {
    setShortcuts(currentShortcuts => {
       if (deepEqual(currentShortcuts, newShortcuts, { strict: true })) {
        return currentShortcuts;
       }
       saveShortcuts(newShortcuts);
       return newShortcuts;
    });
  }, [saveShortcuts]);

  const updateSaveStates = useCallback((newSaveStates: SaveStates) => {
    setSaveStates(currentSaveStates => {
      const newStatesWithIds: SaveStates = {
            fieldStates: newSaveStates.fieldStates.map(s => ({ ...s, id: s.id || crypto.randomUUID() })),
            snowboardStates: newSaveStates.snowboardStates.map(s => ({ ...s, id: s.id || crypto.randomUUID() })),
      };
      if (deepEqual(currentSaveStates, newStatesWithIds, { strict: true })) {
          return currentSaveStates;
      }
      saveSaveStates(newStatesWithIds);
      return newStatesWithIds;
    });
  }, [saveSaveStates]);

  return {
    generalSettings,
    hackSettings,
    shortcuts,
    saveStates,
    updateGeneralSettings,
    updateHackSettings,
    updateShortcuts,
    updateSaveStates,
  };
}

function getDefaultGeneralSettings(): GeneralSettings {
  return {
    autoUpdate: 'auto',
    enableShortcuts: true,
    hasSeenSettingsHint: false,
    lastDismissedUpdateVersion: null,
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
      manualSlots: true,
    },
  };
}