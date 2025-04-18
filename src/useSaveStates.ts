import { useState } from "react";
import { Destination } from "./types";
import { useSettings } from "./useSettings";
import { logger } from "./lib/logging";

type RegionOffset = [number, number];

export const SaveRegions: RegionOffset[] = [
  [0xCBF5EC, 0xCC08E8],
  [0xCC08EC, 0xCC1670],
  [0xCFF180, 0xCFF3B0],
  [0xCFF464, 0xCFF48C],
  [0xCFF494, 0xCFF500],
  [0xCFF504, 0xCFF594],
  [0xCFF59C, 0xCFF738],
  [0xD000C4, 0xD011F4],
  [0xD8F4D8, 0xD8F678],
  [0xDB9580, 0xDBCAE0],
  [0x905E50, 0x905E54],
  [0xCBF588, 0xCBF589],
  [0xCC1F70, 0xCC2270],
];

for (let i = 0; i < 16; i++) {
  const start = 0xcc1678 + i * 0x88;
  const end = start + 0x80;
  SaveRegions.push([start, end]);
}

export type SaveStateBase = {
  id: string;
  timestamp: number;
  title?: string;
};

export type SaveState = SaveStateBase & {
  regions: number[][];
  regionOffsets?: RegionOffset[];
  savemap: number[];
  fieldId: number;
  fieldName: string;
  destination?: Destination;
};

export type SnowBoardSaveState = SaveStateBase & {
  globalObjData: number[];
  entitiesData: number[];
};

function generateId(): string {
  return crypto.randomUUID();
}

export function useSaveStates() {
  const { saveStates, updateSaveStates } = useSettings();
  const [lastLoadedFieldStateId, setLastLoadedFieldStateId] = useState<string | null>(null);

  const pushFieldState = (state: Omit<SaveState, "timestamp" | "regionOffsets" | "id">) => {
    const id = generateId();
    const newState = {
      ...state,
      id,
      timestamp: Date.now(),
      regionOffsets: SaveRegions,
    };
    updateSaveStates({
      ...saveStates,
      fieldStates: [...saveStates.fieldStates, newState],
    });
    setLastLoadedFieldStateId(null);
    logger.info('Created new field state', {
      id,
      fieldId: state.fieldId,
      fieldName: state.fieldName,
    });
  };

  const pushSnowboardState = (state: Omit<SnowBoardSaveState, "timestamp" | "id">) => {
    const id = generateId();
    updateSaveStates({
      ...saveStates,
      snowboardStates: [...saveStates.snowboardStates, { ...state, id, timestamp: Date.now() }],
    });
    logger.info('Created new snowboard state', { id });
  };

  const getLatestFieldState = () => {
    if (saveStates.fieldStates.length === 0) {
      logger.debug('No field states available');
      return null;
    }
    if (lastLoadedFieldStateId) {
      const state = saveStates.fieldStates.find(state => state.id === lastLoadedFieldStateId);
      if (state) {
        logger.debug('Returning last manually loaded state', { id: state.id });
        return state;
      }
    }
    const state = saveStates.fieldStates[saveStates.fieldStates.length - 1];
    logger.debug('Returning latest field state', { id: state.id });
    return state;
  };

  const getLatestSnowboardState = () => {
    if (saveStates.snowboardStates.length === 0) {
      logger.debug('No snowboard states available');
      return null;
    }
    const state = saveStates.snowboardStates[saveStates.snowboardStates.length - 1];
    logger.debug('Returning latest snowboard state', { id: state.id });
    return state;
  };

  const getFieldState = (index: number) => {
    if (index < 0 || index >= saveStates.fieldStates.length) return null;
    setLastLoadedFieldStateId(null);
    return saveStates.fieldStates[index];
  };

  const getFieldStateById = (id: string) => {
    const state = saveStates.fieldStates.find(state => state.id === id);
    if (!state) return null;
    setLastLoadedFieldStateId(id);
    return state;
  };

  const getSnowboardState = (index: number) => {
    if (index < 0 || index >= saveStates.snowboardStates.length) return null;
    return saveStates.snowboardStates[index];
  };

  const getSnowboardStateById = (id: string): SnowBoardSaveState | null => {
    const index = saveStates.snowboardStates.findIndex(state => state.id === id);
    if (index === -1) return null;
    return saveStates.snowboardStates[index];
  };

  const removeFieldState = (id: string) => {
    const newFieldStates = saveStates.fieldStates.filter(state => state.id !== id);
    updateSaveStates({ ...saveStates, fieldStates: newFieldStates });
    if (lastLoadedFieldStateId === id) {
      setLastLoadedFieldStateId(null);
    }
    logger.info('Removed field state', { id });
  };

  const removeSnowboardState = (id: string) => {
    const newSnowboardStates = saveStates.snowboardStates.filter(state => state.id !== id);
    updateSaveStates({ ...saveStates, snowboardStates: newSnowboardStates });
    logger.info('Removed snowboard state', { id });
  };

  const clearFieldStates = () => {
    updateSaveStates({ ...saveStates, fieldStates: [] });
    setLastLoadedFieldStateId(null);
    logger.info('Cleared all field states', { count: saveStates.fieldStates.length });
  };

  const clearSnowboardStates = () => {
    updateSaveStates({ ...saveStates, snowboardStates: [] });
    logger.info('Cleared all snowboard states', { count: saveStates.snowboardStates.length });
  };

  const clearAllStates = () => {
    updateSaveStates({ fieldStates: [], snowboardStates: [] });
    setLastLoadedFieldStateId(null);
    logger.info('Cleared all states');
  };

  const updateFieldStateTitle = (id: string, title: string) => {
    const newFieldStates = saveStates.fieldStates.map(state =>
      state.id === id ? { ...state, title } : state
    );
    updateSaveStates({ ...saveStates, fieldStates: newFieldStates });
    logger.info('Updated field state title', { id, title });
  };

  const updateSnowboardStateTitle = (id: string, title: string) => {
    const newSnowboardStates = saveStates.snowboardStates.map(state =>
      state.id === id ? { ...state, title } : state
    );
    updateSaveStates({ ...saveStates, snowboardStates: newSnowboardStates });
    logger.info('Updated snowboard state title', { id, title });
  };

  const reorderFieldStates = (fromId: string, toId: string) => {
    const fromIndex = saveStates.fieldStates.findIndex(state => state.id === fromId);
    const toIndex = saveStates.fieldStates.findIndex(state => state.id === toId);
    if (fromIndex === -1 || toIndex === -1) {
      logger.warn('Attempted to reorder with invalid state IDs', { fromId, toId });
      return;
    }
    const newFieldStates = [...saveStates.fieldStates];
    const [removed] = newFieldStates.splice(fromIndex, 1);
    newFieldStates.splice(toIndex, 0, removed);
    updateSaveStates({ ...saveStates, fieldStates: newFieldStates });
    logger.info('Reordered field states', { fromId, toId, fromIndex, toIndex });
  };

  const exportStates = () => {
    logger.info('Exporting states', {
      fieldStatesCount: saveStates.fieldStates.length,
      snowboardStatesCount: saveStates.snowboardStates.length,
    });

    const encodedFieldStates = saveStates.fieldStates.map(state => ({
      ...state,
      regionOffsets: state.regionOffsets || SaveRegions,
      regions: state.regions.map(region =>
        btoa(String.fromCharCode.apply(null, region))
      ),
      savemap: btoa(String.fromCharCode.apply(null, state.savemap)),
    }));

    const encodedSnowboardStates = saveStates.snowboardStates.map(state => ({
      ...state,
      globalObjData: btoa(String.fromCharCode.apply(null, state.globalObjData)),
      entitiesData: btoa(String.fromCharCode.apply(null, state.entitiesData)),
    }));

    return { fieldStates: encodedFieldStates, snowboardStates: encodedSnowboardStates };
  };

  const importStates = (data: { fieldStates: any[]; snowboardStates: any[] }) => {
    logger.info('Importing states', {
      fieldStatesCount: data.fieldStates.length,
      snowboardStatesCount: data.snowboardStates.length,
    });

    const existingFieldIds = new Set(saveStates.fieldStates.map(state => state.id));
    const newFieldStates = data.fieldStates
      .filter(state => !state.id || !existingFieldIds.has(state.id))
      .map(state => ({
        ...state,
        id: state.id || generateId(),
        regionOffsets: state.regionOffsets || SaveRegions,
        regions: state.regions.map((base64: string) =>
          Array.from(atob(base64), char => char.charCodeAt(0))
        ),
        savemap: Array.from(atob(state.savemap), char => char.charCodeAt(0)),
      }));

    const existingSnowboardIds = new Set(saveStates.snowboardStates.map(state => state.id));
    const newSnowboardStates = data.snowboardStates
      .filter(state => !state.id || !existingSnowboardIds.has(state.id))
      .map(state => ({
        ...state,
        id: state.id || generateId(),
        globalObjData: Array.from(atob(state.globalObjData), char => char.charCodeAt(0)),
        entitiesData: Array.from(atob(state.entitiesData), char => char.charCodeAt(0)),
      }));

    updateSaveStates({
      fieldStates: [...saveStates.fieldStates, ...newFieldStates],
      snowboardStates: [...saveStates.snowboardStates, ...newSnowboardStates],
    });

    logger.info('Imported states', {
      fieldImported: newFieldStates.length,
      snowboardImported: newSnowboardStates.length,
    });
  };

  return {
    fieldStates: saveStates.fieldStates,
    snowboardStates: saveStates.snowboardStates,
    pushFieldState,
    pushSnowboardState,
    getLatestFieldState,
    getLatestSnowboardState,
    getFieldState,
    getFieldStateById,
    getSnowboardState,
    getSnowboardStateById,
    removeFieldState,
    removeSnowboardState,
    clearFieldStates,
    clearSnowboardStates,
    clearAllStates,
    updateFieldStateTitle,
    updateSnowboardStateTitle,
    reorderFieldStates,
    exportStates,
    importStates,
  };
}