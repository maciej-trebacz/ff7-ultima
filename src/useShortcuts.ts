import { useEffect, useState } from "react";
import { register, unregister, isRegistered as isTauriShortcutRegistered, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { Shortcut, defaultShortcuts } from "./shortcuts";
import { loadShortcuts, saveShortcuts, loadGeneralSettings, subscribeToSettings, GeneralSettings } from "./settings";
import { useFF7Context } from "./FF7Context";

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
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [customShortcuts, setCustomShortcuts] = useState<Map<string, () => void>>(new Map());
  const {connected} = useFF7Context();

  // Load shortcuts and general settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedShortcuts, generalSettings] = await Promise.all([
          loadShortcuts(),
          loadGeneralSettings()
        ]);
        
        setShortcutsEnabled(generalSettings.enableShortcuts);
        
        if (savedShortcuts) {
          // Update shortcuts with saved key bindings
          setShortcuts(shortcuts.map(shortcut => ({
            ...shortcut,
            key: savedShortcuts[shortcut.action] || shortcut.key
          })));
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    };
    loadSettings();
  }, []);

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = subscribeToSettings((key, newValue) => {
      if (key === 'general') {
        const settings = newValue as GeneralSettings;
        setShortcutsEnabled(settings.enableShortcuts);
      } else if (key === 'shortcuts') {
        const savedShortcuts = newValue as Record<string, string>;
        setShortcuts(shortcuts.map(shortcut => ({
          ...shortcut,
          key: savedShortcuts[shortcut.action] || shortcut.key
        })));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [shortcuts]); // Include shortcuts in deps because we use it in the callback

  // Register/unregister shortcuts based on connection state and enabled setting
  useEffect(() => {
    const registerAllShortcuts = async () => {
      // First unregister all shortcuts
      await unregisterAll();
      
      // Don't register any shortcuts if:
      // - disconnected
      // - listening for a new binding
      // - shortcuts are disabled
      if (!connected || listeningFor || !shortcutsEnabled) return;
      
      for (const shortcut of shortcuts) {
        if (!shortcut.key) continue; // Skip unbound shortcuts
        
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

  // Effect for handling custom shortcuts
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
      // Cleanup custom shortcuts when component unmounts or dependencies change
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
    unregisterCustomShortcut
  };
} 