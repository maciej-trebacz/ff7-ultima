import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SaveState } from "@/useSaveStates";

interface CategoryPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  existingCategories: string[];
  children: React.ReactNode;
}

export function CategoryPopover({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  existingCategories,
  children,
}: CategoryPopoverProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleSubmit = () => {
    onSubmit(inputValue);
    onOpenChange(false);
  };

  const handleCategorySelect = (category: string) => {
    setInputValue(category);
    onSubmit(category);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-2">
          <div className="text-xs font-medium text-zinc-400">Existing Categories</div>
          {existingCategories.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {existingCategories.map((category) => (
                <Button
                  key={category}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-6"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500">No existing categories</div>
          )}
          
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-zinc-400 mb-1">New Category</div>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter category name"
              className="text-xs h-6"
              autoFocus
            />
            <div className="flex justify-end space-x-1 mt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-xs h-6 px-2"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                className="text-xs h-6 px-2"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
