import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKeyForDisplay(key: string): string {
  // Special key mappings
  const specialKeys: Record<string, string> = {
    "ARROWUP": "↑",
    "ARROWDOWN": "↓",
    "ARROWLEFT": "←",
    "ARROWRIGHT": "→",
    "ENTER": "⏎",
    "ESCAPE": "Esc",
    "BACKSPACE": "⌫",
    "DELETE": "Del",
    "SPACE": "Space",
    "TAB": "⇥",
    "CONTROL": "Ctrl",
    "ALT": "Alt",
    "SHIFT": "⇧",
    "META": "⌘",
  };

  // Handle key combinations
  if (key.includes("+")) {
    return key.split("+").map(part => {
      // Don't transform the modifiers, they're already in display format
      if (part === "Ctrl" || part === "Alt" || part === "Shift") {
        return part;
      }
      return specialKeys[part] || part;
    }).join("+");
  }

  return specialKeys[key] || key;
}
