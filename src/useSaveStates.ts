import { useEffect, useState } from "react";
import { Destination } from "./types";
import { loadSaveStates, saveSaveStates } from "./settings";

export type SaveStateBase = {
  timestamp: number;
  title?: string;
}

export type SaveState = SaveStateBase & {
  regions: number[][];
  savemap: number[];
  fieldId: number;
  fieldName: string;
  destination?: Destination;
};

export type SnowBoardSaveState = SaveStateBase & {
  globalObjData: number[];
  entitiesData: number[];
};

export function useSaveStates() {
  const [fieldStates, setFieldStates] = useState<SaveState[]>([]);
  const [snowboardStates, setSnowboardStates] = useState<SnowBoardSaveState[]>([]);
  const [lastLoadedFieldStateIndex, setLastLoadedFieldStateIndex] = useState<number | null>(null);

  // Load states from disk on mount
  useEffect(() => {
    loadSaveStates().then(states => {
      if (states) {
        setFieldStates(states.fieldStates);
        setSnowboardStates(states.snowboardStates);
      }
    });
  }, []);

  // Save states to disk whenever they change
  useEffect(() => {
    saveSaveStates({
      fieldStates,
      snowboardStates
    });
  }, [fieldStates, snowboardStates]);

  const pushFieldState = (state: Omit<SaveState, "timestamp">) => {
    setFieldStates(prev => [...prev, { ...state, timestamp: Date.now() }]);
    setLastLoadedFieldStateIndex(null);
  };

  const pushSnowboardState = (state: Omit<SnowBoardSaveState, "timestamp">) => {
    setSnowboardStates(prev => [...prev, { ...state, timestamp: Date.now() }]);
  };

  const getLatestFieldState = () => {
    if (fieldStates.length === 0) return null;
    // If we have a manually loaded state, return that
    if (lastLoadedFieldStateIndex !== null && lastLoadedFieldStateIndex < fieldStates.length) {
      return fieldStates[lastLoadedFieldStateIndex];
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
    setLastLoadedFieldStateIndex(index);
    return fieldStates[index];
  };

  const getSnowboardState = (index: number) => {
    if (index < 0 || index >= snowboardStates.length) return null;
    return snowboardStates[index];
  };

  const removeFieldState = (index: number) => {
    setFieldStates(prev => {
      const newStates = [...prev];
      newStates.splice(index, 1);
      // If we remove the last loaded state, reset the index
      if (lastLoadedFieldStateIndex === index) {
        setLastLoadedFieldStateIndex(null);
      } else if (lastLoadedFieldStateIndex !== null && lastLoadedFieldStateIndex > index) {
        // Adjust the index if we remove a state before it
        setLastLoadedFieldStateIndex(lastLoadedFieldStateIndex - 1);
      }
      return newStates;
    });
  };

  const removeSnowboardState = (index: number) => {
    setSnowboardStates(prev => {
      const newStates = [...prev];
      newStates.splice(index, 1);
      return newStates;
    });
  };

  const clearFieldStates = () => {
    setFieldStates([]);
    setLastLoadedFieldStateIndex(null);
  };

  const clearSnowboardStates = () => {
    setSnowboardStates([]);
  };

  const clearAllStates = () => {
    clearFieldStates();
    clearSnowboardStates();
  };

  const updateFieldStateTitle = (index: number, title: string) => {
    setFieldStates(prev => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], title };
      return newStates;
    });
  };

  const updateSnowboardStateTitle = (index: number, title: string) => {
    setSnowboardStates(prev => {
      const newStates = [...prev];
      newStates[index] = { ...newStates[index], title };
      return newStates;
    });
  };

  const reorderFieldStates = (fromIndex: number, toIndex: number) => {
    setFieldStates(prev => {
      const newStates = [...prev];
      const [removed] = newStates.splice(fromIndex, 1);
      newStates.splice(toIndex, 0, removed);
      
      // Update lastLoadedFieldStateIndex if needed
      if (lastLoadedFieldStateIndex === fromIndex) {
        setLastLoadedFieldStateIndex(toIndex);
      } else if (
        lastLoadedFieldStateIndex !== null &&
        fromIndex < lastLoadedFieldStateIndex &&
        toIndex >= lastLoadedFieldStateIndex
      ) {
        setLastLoadedFieldStateIndex(lastLoadedFieldStateIndex - 1);
      } else if (
        lastLoadedFieldStateIndex !== null &&
        fromIndex > lastLoadedFieldStateIndex &&
        toIndex <= lastLoadedFieldStateIndex
      ) {
        setLastLoadedFieldStateIndex(lastLoadedFieldStateIndex + 1);
      }
      
      return newStates;
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
    getSnowboardState,
    removeFieldState,
    removeSnowboardState,
    clearFieldStates,
    clearSnowboardStates,
    clearAllStates,
    updateFieldStateTitle,
    updateSnowboardStateTitle,
    reorderFieldStates
  };
} 