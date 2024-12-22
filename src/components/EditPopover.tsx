import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReactNode, useEffect } from "react";

interface EditPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  children: ReactNode;
}

export function EditPopover({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  children,
}: EditPopoverProps) {
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      onSubmit();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  useEffect(() => {
    console.log("Popover open", open);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="flex items-center">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => {
              e.stopPropagation();
              onValueChange(e.target.value);
            }}
            onKeyUp={handleKeyUp}
            className="text-sm"
          />
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onSubmit();
            }} 
            className="w-full"
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
