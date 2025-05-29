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
      // Disable modal focus trap
      const dialogElement = document.querySelector('[role="dialog"]') as HTMLElement;
      if (dialogElement) {
        dialogElement.setAttribute('data-modal-disabled', 'true');
        // Remove tabindex to disable focus trap
        dialogElement.removeAttribute('tabindex');
      }
      
      // Focus the input after modal focus trap is disabled
      const currentPopoverCount = document.querySelectorAll('.edit-popover-input').length;
      setTimeout(() => {
        const input = document.querySelector('.edit-popover-input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, currentPopoverCount > 0 ? 250 : 10);
    } else {
      // Re-enable modal focus trap when popover closes
      setTimeout(() => {
        const dialogElement = document.querySelector('[role="dialog"]') as HTMLElement;
        if (dialogElement && dialogElement.hasAttribute('data-modal-disabled')) {
          const currentPopoverCount = document.querySelectorAll('[data-state="open"][role="dialog"] .edit-popover-input').length;
          if (currentPopoverCount === 0) {
            dialogElement.removeAttribute('data-modal-disabled');
            dialogElement.setAttribute('tabindex', '-1');
          }
        }
      }, 10);
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
          className="z-[60] w-48 rounded-md border bg-popover p-2 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 pointer-events-auto"
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
