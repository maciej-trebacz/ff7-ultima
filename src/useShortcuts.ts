import { useEffect, useState } from "react";
import { register, unregister, isRegistered as isTauriShortcutRegistered, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { Shortcut, defaultShortcuts } from "./shortcuts";
import { useSettings } from "./useSettings";
import { useFF7Context } from "./FF7Context";

function convertToTauriAccelerator(key: string): string {
  if (key.includes("+")) {
    return key;
  }
  
  const specialKeys: Record<string, string> = {
    "ARROWUP": "Up",
    "ARROWDOWN": "Down",
    "ARROWLEFT": "Left",
    "ARROWRIGHT": "Right",
    "ENTER": "Return",
    "ESCAPE": "Escape",
    "BACKSPACE": "Backspace",
    "DELETE": "Delete",
    "SPACE": "Space",
    "TAB": "Tab",
  };

  return specialKeys[key] || key;
}

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [listeningFor, setListeningFor] = useState<string | null>(null);
  const [customShortcuts, setCustomShortcuts] = useState<Map<string, () => void>>(new Map());
  const { connected } = useFF7Context();
  const { generalSettings, shortcuts: savedShortcuts, updateShortcuts } = useSettings();

  const shortcutsEnabled = generalSettings?.enableShortcuts ?? true;

  useEffect(() => {
    if (savedShortcuts) {
      setShortcuts(defaultShortcuts.map(shortcut => ({
        ...shortcut,
        key: savedShortcuts[shortcut.action] || shortcut.key,
      })));
    }
  }, [savedShortcuts]);

  useEffect(() => {
    const registerAllShortcuts = async () => {
      await unregisterAll();
      if (!connected || listeningFor || !shortcutsEnabled) return;
      
      for (const shortcut of shortcuts) {
        if (!shortcut.key) continue;
        
        const accelerator = convertToTauriAccelerator(shortcut.key);
        
        try {
          console.debug(`registering ${accelerator} for ${shortcut.action}`);
          await register(accelerator, (event) => {
            if (event.state === "Pressed") {
              console.debug(`${shortcut.key} pressed, calling ${shortcut.action}`);
              try {
                shortcut.callback((window as any).FF7);
              } catch (e) {
                console.error(`Error calling ${shortcut.action}:`, e);
              }
            }
          });
        } catch (e) {
          console.error(`Failed to register shortcut ${shortcut.key}:`, e);
        }
      }
    };
    registerAllShortcuts();
  }, [shortcuts, listeningFor, connected, shortcutsEnabled]);

  useEffect(() => {
    const registerCustomShortcuts = async () => {
      if (!connected) return;
      
      for (const [accelerator, callback] of customShortcuts.entries()) {
        try {
          if (await isTauriShortcutRegistered(accelerator)) {
            await unregister(accelerator);
          }
          await register(accelerator, (event) => {
            if (connected && event.state === "Pressed") {
              callback();
            }
          });
        } catch (e) {
          console.error(`Failed to register custom shortcut ${accelerator}:`, e);
        }
      }
    };

    registerCustomShortcuts();

    return () => {
      customShortcuts.forEach(async (_, accelerator) => {
        try {
          if (await isTauriShortcutRegistered(accelerator)) {
            await unregister(accelerator);
          }
        } catch (e) {
          console.error(`Failed to unregister custom shortcut ${accelerator}:`, e);
        }
      });
    };
  }, [customShortcuts, connected]);

  const updateShortcut = async (action: string, newKey: string) => {
    const shortcut = shortcuts.find(s => s.action === action);
    if (!shortcut) return;

    const conflictingShortcut = shortcuts.find(s => s.key === newKey && s.action !== action);

    const updatedShortcuts = shortcuts.map(s => {
      if (s.action === action) {
        return { ...s, key: newKey };
      } else if (s === conflictingShortcut) {
        return { ...s, key: "" };
      }
      return s;
    });
    
    setShortcuts(updatedShortcuts);

    const shortcutMap = updatedShortcuts.reduce((acc, s) => ({
      ...acc,
      [s.action]: s.key,
    }), {});
    updateShortcuts(shortcutMap);
  };

  const startListening = async (action: string) => {
    await unregisterAll();
    setListeningFor(action);
  };

  const stopListening = () => {
    setListeningFor(null);
  };

  const registerCustomShortcut = async (key: string, callback: () => void) => {
    const accelerator = convertToTauriAccelerator(key);
    setCustomShortcuts(prev => {
      const next = new Map(prev);
      next.set(accelerator, callback);
      return next;
    });
  };

  const unregisterCustomShortcut = async (key: string) => {
    const accelerator = convertToTauriAccelerator(key);
    try {
      if (await isTauriShortcutRegistered(accelerator)) {
        await unregister(accelerator);
      }
      setCustomShortcuts(prev => {
        const next = new Map(prev);
        next.delete(accelerator);
        return next;
      });
    } catch (e) {
      console.error(`Failed to unregister custom shortcut ${accelerator}:`, e);
    }
  };

  return {
    shortcuts,
    listeningFor,
    startListening,
    stopListening,
    updateShortcut,
    registerCustomShortcut,
    unregisterCustomShortcut,
  };
}