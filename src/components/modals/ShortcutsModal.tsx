import { Modal } from "@/components/Modal";
import { useShortcuts } from "@/useShortcuts";
import { FF7 } from "@/useFF7";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatKeyForDisplay } from "@/lib/utils";

interface ShortcutsContentProps {
  ff7: FF7;
}

export function ShortcutsContent({ ff7 }: ShortcutsContentProps) {
  const { 
    shortcuts, 
    listeningFor, 
    startListening, 
    stopListening, 
    updateShortcut
  } = useShortcuts();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!listeningFor) return;

      e.preventDefault();

      // If ESC, unbind the shortcut
      if (e.key === "Escape") {
        await updateShortcut(listeningFor, "");
        stopListening();
        return;
      }

      // Skip if only modifier key was pressed
      if (e.key === "Control" || e.key === "Alt" || e.key === "Shift") {
        return;
      }

      let combo = "";
      if (e.ctrlKey) combo += "Ctrl+";
      if (e.altKey) combo += "Alt+";
      if (e.shiftKey) combo += "Shift+";
      combo += e.key.toUpperCase();

      await updateShortcut(listeningFor, combo);
      stopListening();
    };

    if (listeningFor) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [listeningFor]);

  return (
    <div className="space-y-4">
      <div className="text-slate-400 text-xs">
        Click on an action to bind a shortcut to it. Press ESC while binding to unbind the action.
      </div>
      <div className="h-[60vh] min-h-[200px] overflow-y-auto pr-2">
        <div className="space-y-0.5">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.action}
              onClick={() => startListening(shortcut.action)}
              className={cn(
                "w-full px-2 py-1 rounded text-left hover:bg-slate-800/50 ring-0 outline-none",
                listeningFor === shortcut.action && "bg-slate-800"
              )}
            >
              <div className="flex justify-between items-center">
                <div>{shortcut.action}</div>
                <div
                  className={cn(
                    "px-2 py-0.5 min-w-20 text-xs rounded text-center",
                    listeningFor === shortcut.action 
                      ? "bg-slate-700 animate-pulse" 
                      : shortcut.key 
                        ? "bg-slate-800"
                        : "bg-gray-900/50"
                  )}
                >
                  {listeningFor === shortcut.action 
                    ? "Press key..." 
                    : shortcut.key 
                      ? formatKeyForDisplay(shortcut.key)
                      : "Unbound"
                  }
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ShortcutsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  ff7: FF7;
}

export function ShortcutsModal({ isOpen, setIsOpen, ff7 }: ShortcutsModalProps) {
  return (
    <Modal
      open={isOpen}
      setIsOpen={setIsOpen}
      title="Keyboard Shortcuts"
      size="md"
      callback={() => {}}
      disableClose={false}
    >
      <ShortcutsContent ff7={ff7} />
    </Modal>
  );
} 