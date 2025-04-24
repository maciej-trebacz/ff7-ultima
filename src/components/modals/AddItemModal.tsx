import { Modal } from "@/components/Modal";
import AutocompleteInput from "@/components/Autocomplete";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { FF7 } from "@/useFF7";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: string | null, quantity: number) => void;
  onMaxItems?: () => void;
  ff7: FF7;
}

interface ItemOption {
  id: number;
  name: string;
}

export function AddItemModal({ isOpen, onClose, onSubmit, onMaxItems, ff7 }: AddItemModalProps) {
  const [itemId, setItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isMaxQuantity, setIsMaxQuantity] = useState(false);
  const [itemList, setItemList] = useState<ItemOption[]>([]);
  
  useEffect(() => {
    const loadItems = async () => {
      const items = (await ff7.getItemNames()) as string[];
      setItemList(items.map((item, index) => ({
        id: index,
        name: item,
      })));
    };
    if (isOpen) loadItems();
    setIsMaxQuantity(false);
    setItemId("");
    setQuantity(1);
  }, [isOpen]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      onSubmit(itemId, quantity);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMaxQuantity) {
      const value = parseInt(e.target.value) || 0;
      setQuantity(Math.max(-99, Math.min(99, value)));
    }
  };

  const handleMaxChange = (checked: boolean) => {
    setIsMaxQuantity(checked);
    if (checked) {
      setQuantity(99);
    } else {
      setQuantity(1); // Reset to 1 when unchecking max
    }
  };

  return (
    <Modal
      open={isOpen}
      setIsOpen={onClose}
      title="Add Item or Equipment"
      buttonText={quantity >= 0 ? "Add" : "Remove"}
      callback={() => onSubmit(itemId, quantity)}
      buttonDisabled={!itemId}
      leftButtonText={onMaxItems ? "Max Items" : undefined}
      leftButtonCallback={onMaxItems}
    >
      <div className="space-y-4">
        <div className="relative">
          <AutocompleteInput
            battles={itemList}
            isVisible={true}
            onSelect={(id) => setItemId(id?.toString() ?? "")}
            onAccept={onKeyDown}
            placeholder="Enter item or equipment name"
            value={itemList.find(item => item.id.toString() === itemId)}
          />
        </div>
        <div className="flex items-center gap-4">
          <label
            htmlFor="quantity"
            className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100"
          >
            Quantity:
          </label>
          <div className="flex items-center gap-4">
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min={-99}
              max={99}
              disabled={isMaxQuantity}
              className="w-20"
              placeholder="Quantity"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="maxQuantity"
                checked={isMaxQuantity}
                onCheckedChange={handleMaxChange}
              />
              <label
                htmlFor="maxQuantity"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Max
              </label>
            </div>
            <div className="flex-1" />
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Tip: use negative values to remove items
        </p>
      </div>
    </Modal>
  );
}
