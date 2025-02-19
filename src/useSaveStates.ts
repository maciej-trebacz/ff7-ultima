import { useEffect, useState, useRef } from "react";
import { Destination } from "./types";
import { loadSaveStates, saveSaveStates, SaveStates } from "./settings";

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

// Copy entity/model objs but skip the pointers in the first 8 bytes
for (let i = 0; i < 16; i++) {
  const start = 0xcc1678 + i * 0x88;
  const end = start + 0x80;

  SaveRegions.push([start, end]);
}

export type SaveStateBase = {
  id: string;
  timestamp: number;
  title?: string;
}

export type SaveState = SaveStateBase & {
  regions: number[][];
  regionOffsets?: RegionOffset[]; // Optional for backwards compatibility
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
  const [fieldStates, setFieldStates] = useState<SaveState[]>([]);
  const [snowboardStates, setSnowboardStates] = useState<SnowBoardSaveState[]>([]);
  const [lastLoadedFieldStateId, setLastLoadedFieldStateId] = useState<string | null>(null);
  const saveTimeout = useRef<number | null>(null);
  const lastSavedStates = useRef<SaveStates | null>(null);

  // Load states from disk on mount
  useEffect(() => {
    loadSaveStates().then(states => {
      if (states) {
        setFieldStates(states.fieldStates);
        setSnowboardStates(states.snowboardStates);
        lastSavedStates.current = states;
      }
    });

    // Cleanup any pending saves on unmount
    return () => {
      if (saveTimeout.current !== null) {
        window.clearTimeout(saveTimeout.current);
        // Ensure the final state is saved
        if (lastSavedStates.current) {
          saveSaveStates(lastSavedStates.current);
        }
      }
    };
  }, []);

  // Save states to disk whenever they change, with debouncing
  useEffect(() => {
    const currentStates = {
      fieldStates,
      snowboardStates
    };
    
    // Store the current states for the cleanup function
    lastSavedStates.current = currentStates;

    // Clear any existing timeout
    if (saveTimeout.current !== null) {
      window.clearTimeout(saveTimeout.current);
    }

    // Set a new timeout to save the states
    saveTimeout.current = window.setTimeout(() => {
      saveSaveStates(currentStates);
      saveTimeout.current = null;
    }, 1000); // Debounce for 1 second
  }, [fieldStates, snowboardStates]);

  const pushFieldState = (state: Omit<SaveState, "timestamp" | "regionOffsets" | "id">) => {
    setFieldStates(prev => [...prev, { 
      ...state, 
      id: generateId(),
      timestamp: Date.now(),
      regionOffsets: SaveRegions // Store the current region offsets with the state
    }]);
    setLastLoadedFieldStateId(null);
  };

  const pushSnowboardState = (state: Omit<SnowBoardSaveState, "timestamp" | "id">) => {
    setSnowboardStates(prev => [...prev, { 
      ...state, 
      id: generateId(),
      timestamp: Date.now() 
    }]);
  };

  const getLatestFieldState = () => {
    if (fieldStates.length === 0) return null;
    // If we have a manually loaded state, return that
    if (lastLoadedFieldStateId) {
      const state = fieldStates.find(state => state.id === lastLoadedFieldStateId);
      if (state) return state;
    }
    // Otherwise return the last saved state
    return fieldStates[fieldStates.length - 1];
  };

  const getLatestSnowboardState = () => {
    if (snowboardStates.length === 0) return null;
    return snowboardStates[snowboardStates.length - 1];
  };

  const getFieldState = (index: number) => {
    if (index < 0 || index >= fieldStates.length) return null;
    // Update the last loaded state index when manually loading a state
    setLastLoadedFieldStateId(null);
    return fieldStates[index];
  };

  const getFieldStateById = (id: string) => {
    const state = fieldStates.find(state => state.id === id);
    if (!state) return null;
    setLastLoadedFieldStateId(id);
    return state;
  };

  const getSnowboardState = (index: number) => {
    if (index < 0 || index >= snowboardStates.length) return null;
    return snowboardStates[index];
  };

  const getSnowboardStateById = (id: string): SnowBoardSaveState | null => {
    const index = snowboardStates.findIndex(state => state.id === id);
    if (index === -1) return null;
    return snowboardStates[index];
  };

  const removeFieldState = (id: string) => {
    setFieldStates(prev => {
      const newStates = prev.filter(state => state.id !== id);
      // If we remove the last loaded state, reset the ID
      if (lastLoadedFieldStateId === id) {
        setLastLoadedFieldStateId(null);
      }
      return newStates;
    });
  };

  const removeSnowboardState = (id: string) => {
    setSnowboardStates(prev => {
      const index = prev.findIndex(state => state.id === id);
      if (index === -1) return prev;
      
      const newStates = [...prev];
      newStates.splice(index, 1);
      return newStates;
    });
  };

  const clearFieldStates = () => {
    setFieldStates([]);
    setLastLoadedFieldStateId(null);
  };

  const clearSnowboardStates = () => {
    setSnowboardStates([]);
  };

  const clearAllStates = () => {
    clearFieldStates();
    clearSnowboardStates();
  };

  const updateFieldStateTitle = (id: string, title: string) => {
    setFieldStates(prev => {
      const index = prev.findIndex(state => state.id === id);
      if (index === -1) return prev;
      
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], title };
      return newStates;
    });
  };

  const updateSnowboardStateTitle = (id: string, title: string) => {
    setSnowboardStates(prev => {
      const index = prev.findIndex(state => state.id === id);
      if (index === -1) return prev;
      
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], title };
      return newStates;
    });
  };

  const reorderFieldStates = (fromId: string, toId: string) => {
    setFieldStates(prev => {
      const fromIndex = prev.findIndex(state => state.id === fromId);
      const toIndex = prev.findIndex(state => state.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const newStates = [...prev];
      const [removed] = newStates.splice(fromIndex, 1);
      newStates.splice(toIndex, 0, removed);
      return newStates;
    });
  };

  const exportStates = () => {
    const encodedFieldStates = fieldStates.map(state => ({
      ...state,
      regionOffsets: state.regionOffsets || SaveRegions, // Include current offsets if not present
      regions: state.regions.map(region =>
        btoa(String.fromCharCode.apply(null, region))
      ),
      savemap: btoa(String.fromCharCode.apply(null, state.savemap))
    }));
    
    const encodedSnowboardStates = snowboardStates.map(state => ({
      ...state,
      globalObjData: btoa(String.fromCharCode.apply(null, state.globalObjData)),
      entitiesData: btoa(String.fromCharCode.apply(null, state.entitiesData))
    }));
    
    return { fieldStates: encodedFieldStates, snowboardStates: encodedSnowboardStates };
  };

  const importStates = (data: { fieldStates: any[], snowboardStates: any[] }) => {
    // Instead of clearing states, we'll append the imported ones
    setFieldStates(prev => {
      // Get set of existing IDs
      const existingIds = new Set(prev.map(state => state.id));
      
      // Filter out states with duplicate IDs and map the remaining ones
      const newStates = data.fieldStates
        .filter(state => !state.id || !existingIds.has(state.id))
        .map(state => ({
          ...state,
          id: state.id || generateId(), // Use existing ID if available, otherwise generate new one
          // Use provided region offsets if available, otherwise use current SaveRegions
          regionOffsets: state.regionOffsets || SaveRegions,
          regions: state.regions.map((base64: string) => {
            const binary = atob(base64);
            return Array.from(binary, char => char.charCodeAt(0));
          }),
          savemap: Array.from(atob(state.savemap), char => char.charCodeAt(0))
        }));

      return [...prev, ...newStates];
    });

    setSnowboardStates(prev => {
      // Get set of existing IDs
      const existingIds = new Set(prev.map(state => state.id));
      
      // Filter out states with duplicate IDs and map the remaining ones
      const newStates = data.snowboardStates
        .filter(state => !state.id || !existingIds.has(state.id))
        .map(state => ({
          ...state,
          id: state.id || generateId(), // Use existing ID if available, otherwise generate new one
          globalObjData: Array.from(atob(state.globalObjData), char => char.charCodeAt(0)),
          entitiesData: Array.from(atob(state.entitiesData), char => char.charCodeAt(0))
        }));

      return [...prev, ...newStates];
    });
  };

  return {
    fieldStates,
    snowboardStates,
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
    importStates
  };
} 