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
  };

  const pushSnowboardState = (state: Omit<SnowBoardSaveState, "timestamp">) => {
    setSnowboardStates(prev => [...prev, { ...state, timestamp: Date.now() }]);
  };

  const getLatestFieldState = () => {
    if (fieldStates.length === 0) return null;
    return fieldStates[fieldStates.length - 1];
  };

  const getLatestSnowboardState = () => {
    if (snowboardStates.length === 0) return null;
    return snowboardStates[snowboardStates.length - 1];
  };

  const getFieldState = (index: number) => {
    if (index < 0 || index >= fieldStates.length) return null;
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
    updateSnowboardStateTitle
  };
} 