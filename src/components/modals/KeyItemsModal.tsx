import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { FF7 } from "@/useFF7";

interface KeyItemsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  ff7: FF7;
}

export function KeyItemsModal({ isOpen, setIsOpen, ff7 }: KeyItemsModalProps) {
  const [keyItemNames, setKeyItemNames] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadKeyItems();
    }
  }, [isOpen]);

  const loadKeyItems = async () => {
    const names = await ff7.getKeyItemNames() as string[];
    setKeyItemNames(names);
  };

  const toggleKeyItem = async (index: number) => {
    const currentItems = ff7.gameState.keyItems;
    const hasItem = currentItems.includes(index);
    
    if (hasItem) {
      await ff7.setKeyItems(currentItems.filter(id => id !== index));
    } else {
      await ff7.setKeyItems([...currentItems, index]);
    }
  };

  const toggleAll = async () => {
    const currentItems = ff7.gameState.keyItems;
    if (currentItems.length === 0) {
      // If no items, add all non-empty key items
      const allValidIndices = keyItemNames
        .map((name, index) => ({ name, index }))
        .filter(item => item.name.trim())
        .map(item => item.index);
      await ff7.setKeyItems(allValidIndices);
    } else {
      // If any items exist, clear all
      await ff7.setKeyItems([]);
    }
  };

  return (
    <Modal
      open={isOpen}
      setIsOpen={setIsOpen}
      title="Key Items"
      size="lg"
      callback={() => {}}
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 max-h-[60vh] overflow-y-auto">
        {keyItemNames.map((name, index) => name.trim() && (
          <Button
            key={index}
            variant={ff7.gameState.keyItems.includes(index) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleKeyItem(index)}
            className="w-full text-xs whitespace-normal h-10"
          >
            {name}
          </Button>
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={toggleAll}
          className="text-xs text-slate-400 hover:text-slate-200 hover:underline"
        >
          {ff7.gameState.keyItems.length === 0 ? "Give all key items" : "Clear all key items"}
        </button>
      </div>
    </Modal>
  );
}
