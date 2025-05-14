import { FF7 } from "./useFF7";

export interface Shortcut {
  key: string;
  action: string;
  callback: (ff7: FF7) => Promise<void>;
}

export const defaultShortcuts: Shortcut[] = [
  {
    key: "F1",
    action: "Skip FMV / Minigame",
    callback: async (ff7) => {
      await ff7.skipFMV(true);
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
      await ff7.endBattle(true);
    },
  },
  {
    key: "",
    action: "Slow Speed (0.25x)",
    callback: async (ff7) => {
      await ff7.setSpeed(0.25);
      await ff7.showGameMessage("0.25x Speed", 2000);
    },
  },
  {
    key: "F3",
    action: "Normal Speed (1x)",
    callback: async (ff7) => {
      await ff7.setSpeed(1);
      await ff7.showGameMessage("Normal Speed", 2000);
    },
  },
  {
    key: "F4",
    action: "Speed Up (5x)",
    callback: async (ff7) => {
      await ff7.setSpeed(5);
      await ff7.showGameMessage("5x Speed", 2000);
    },
  },
  {
    key: "F5",
    action: "Load State (on field)",
    callback: async (ff7) => {
      await ff7.loadState();
      await ff7.showGameMessage("State Loaded", 2000, 5);
    },
  },
  {
    key: "F6",
    action: "Save State (on field)",
    callback: async (ff7) => {
      await ff7.saveState();
      await ff7.showGameMessage("State Saved", 2000, 5);
    },
  },
  {
    key: "F7",
    action: "Full Heal and remove bad status effects",
    callback: async (ff7) => {
      await ff7.fullHeal();
      await ff7.showGameMessage("Full Party Heal", 2000);
    },
  },
  {
    key: "F8",
    action: "Toggle Limit Bar (full or empty)",
    callback: async (ff7) => {
      await ff7.toggleLimitBar();
      await ff7.showGameMessage("Toggled Limit Bars", 2000);
    },
  },
  {
    key: "F9",
    action: "Game Over",
    callback: async (ff7) => {
      await ff7.gameOver();
    },
  },
  {
    key: "",
    action: "Toggle Skip Dialogues",
    callback: async (ff7) => {
      await ff7.toggleSkipDialogues();
      const enabled = !ff7.gameState.fieldSkipDialoguesEnabled;
      await ff7.showGameMessage("Skip Dialogues " + (enabled ? "Enabled" : "Disabled"), 2000, enabled ? 4 : 6);
    },
  },
  {
    key: "",
    action: "Toggle Walk Anywhere",
    callback: async (ff7) => {
      ff7.gameState.walkAnywhereEnabled
        ? await ff7.disableWalkAnywhere()
        : await ff7.enableWalkAnywhere();
      const enabled = !ff7.gameState.walkAnywhereEnabled;
      await ff7.showGameMessage("Walk Anywhere " + (enabled ? "Enabled" : "Disabled"), 2000, enabled ? 4 : 6);
    },
  },
  {
    key: "",
    action: "Toggle Manual Slots",
    callback: async (ff7) => {
      ff7.gameState.manualSlotsEnabled
        ? await ff7.disableManualSlots()
        : await ff7.enableManualSlots();
      const enabled = !ff7.gameState.manualSlotsEnabled;
      await ff7.showGameMessage("Manual Slots " + (enabled ? "Enabled" : "Disabled"), 2000, enabled ? 4 : 6);
    },
  },
  {
    key: "",
    action: "Toggle Invincibility",
    callback: async (ff7) => {
      ff7.gameState.invincibilityEnabled
        ? await ff7.disableInvincibility()
        : await ff7.enableInvincibility();
      const enabled = !ff7.gameState.invincibilityEnabled;
      await ff7.showGameMessage("Invincibility " + (enabled ? "Enabled" : "Disabled"), 2000, enabled ? 4 : 6);
    },
  },
  {
    key: "",
    action: "Toggle Instant ATB",
    callback: async (ff7) => {
      ff7.gameState.instantATBEnabled
        ? await ff7.disableInstantATB()
        : await ff7.enableInstantATB();
      const enabled = !ff7.gameState.instantATBEnabled;
      await ff7.showGameMessage("Instant ATB " + (enabled ? "Enabled" : "Disabled"), 2000, enabled ? 4 : 6);
    },
  },
]; 