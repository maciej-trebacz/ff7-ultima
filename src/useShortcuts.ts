import { useEffect, useState } from "react";
import { register, unregister, isRegistered as isTauriShortcutRegistered, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { Shortcut, defaultShortcuts } from "./shortcuts";
import { loadShortcuts, saveShortcuts } from "./settings";

function convertToTauriAccelerator(key: string): string {
  // If it's already a combination, just return it
  if (key.includes("+")) {
    return key;
  }
  
  // For single keys, we need to handle special cases
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

  // Load shortcuts from store on mount
  useEffect(() => {
    const loadSavedShortcuts = async () => {
      try {
        const savedShortcuts = await loadShortcuts();
        
        if (savedShortcuts) {
          // Update shortcuts with saved key bindings
          setShortcuts(shortcuts.map(shortcut => ({
            ...shortcut,
            key: savedShortcuts[shortcut.action] || shortcut.key
          })));
        }
      } catch (e) {
        console.error('Failed to load shortcuts:', e);
      }
    };
    loadSavedShortcuts();
  }, []);

  // Register all shortcuts
  useEffect(() => {
    const registerAllShortcuts = async () => {
      // Don't register any shortcuts while listening for a new binding
      if (listeningFor) return;
      
      for (const shortcut of shortcuts) {
        if (!shortcut.key) continue; // Skip unbound shortcuts
        
        const accelerator = convertToTauriAccelerator(shortcut.key);
        
        if (await isTauriShortcutRegistered(accelerator)) {
          await unregister(accelerator);
        }
        
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
  }, [shortcuts, listeningFor]);

  const updateShortcut = async (action: string, newKey: string) => {
    const shortcut = shortcuts.find(s => s.action === action);
    if (!shortcut) return;

    // Find if any other action was using this key
    const conflictingShortcut = shortcuts.find(s => s.key === newKey && s.action !== action);

    // Update shortcuts state
    const updatedShortcuts = shortcuts.map(s => {
      if (s.action === action) {
        // Update the target shortcut with new key
        return { ...s, key: newKey };
      } else if (s === conflictingShortcut) {
        // Clear the key from the conflicting shortcut
        return { ...s, key: "" };
      }
      return s;
    });
    
    setShortcuts(updatedShortcuts);

    // Save to store
    try {
      const shortcutMap = updatedShortcuts.reduce((acc, s) => ({
        ...acc,
        [s.action]: s.key
      }), {});
      await saveShortcuts(shortcutMap);
    } catch (e) {
      console.error('Failed to save shortcuts:', e);
    }
  };

  const startListening = async (action: string) => {
    // Unregister all shortcuts before starting to listen
    await unregisterAll();
    setListeningFor(action);
  };

  const stopListening = () => {
    setListeningFor(null);
  };

  return {
    shortcuts,
    listeningFor,
    startListening,
    stopListening,
    updateShortcut
  };
} 