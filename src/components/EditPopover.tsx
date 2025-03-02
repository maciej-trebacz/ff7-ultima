import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReactNode, useEffect, useCallback } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

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
  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen);
  }, [onOpenChange]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      onSubmit();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const input = document.querySelector('.edit-popover-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    }
  }, [open]);

  return (
    <Popover 
      open={open} 
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <div className="flex items-center">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content 
          className="z-[60] w-48 rounded-md border bg-popover p-2 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          sideOffset={4}
          align="center"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[role="dialog"]') || target.closest('[data-trigger="true"]')) {
              e.preventDefault();
            }
          }}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
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
              className="text-sm edit-popover-input"
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
          <PopoverPrimitive.Arrow className="fill-border" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}
