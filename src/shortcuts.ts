import { FF7 } from "./useFF7";

export interface Shortcut {
  key: string;
  action: string;
  callback: (ff7: FF7) => Promise<void>;
}

export const defaultShortcuts: Shortcut[] = [
  {
    key: "F1",
    action: "Skip FMV",
    callback: async (ff7) => {
      await ff7.skipFMV();
    },
  },
  {
    key: "F2",
    action: "Escape battle immediately",
    callback: async (ff7) => {
      await ff7.endBattle(false);
    },
  },
  {
    key: "",
    action: "Win battle immediately",
    callback: async (ff7) => {
      await ff7.endBattle(false);
    },
  },
  {
    key: "",
    action: "Slow Speed (0.25x)",
    callback: async (ff7) => {
      await ff7.setSpeed(0.25);
    },
  },
  {
    key: "F4",
    action: "Normal Speed (1x)",
    callback: async (ff7) => {
      await ff7.setSpeed(1);
    },
  },
  {
    key: "F3",
    action: "Speed Up (4x)",
    callback: async (ff7) => {
      await ff7.setSpeed(4);
    },
  },
  {
    key: "F5",
    action: "Load State (on field)",
    callback: async (ff7) => {
      await ff7.loadState();
    },
  },
  {
    key: "F6",
    action: "Save State (on field)",
    callback: async (ff7) => {
      await ff7.saveState();
    },
  },
  {
    key: "F7",
    action: "Full Heal and remove bad status effects",
    callback: async (ff7) => {
      await ff7.fullHeal();
    },
  },
  {
    key: "F8",
    action: "Toggle Limit Bar (full or empty)",
    callback: async (ff7) => {
      await ff7.toggleLimitBar();
    },
  },
  {
    key: "F9",
    action: "Game Over",
    callback: async (ff7) => {
      await ff7.gameOver();
    },
  },
]; 