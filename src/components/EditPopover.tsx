import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReactNode, useEffect, useCallback, useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    console.log('🔍 EditPopover useEffect triggered, open:', open);

    // Debug DOM structure
    if (open) {
      setTimeout(() => {
        console.log('🔍 DOM Debug - All dialogs:', document.querySelectorAll('[role="dialog"]'));
        console.log('🔍 DOM Debug - All popovers:', document.querySelectorAll('[data-radix-popover-content]'));
        console.log('🔍 DOM Debug - All inputs:', document.querySelectorAll('.edit-popover-input'));
        console.log('🔍 DOM Debug - Active element:', document.activeElement);
      }, 100);
    }

    if (open) {
      // Find the closest parent dialog element to this popover
      const findParentDialog = () => {
        console.log('🔍 Looking for parent dialog...');

        // Find all dialog elements and determine which one is the parent modal
        const dialogElements = Array.from(document.querySelectorAll('[role="dialog"]')) as HTMLElement[];
        console.log('🔍 Found dialog elements:', dialogElements.length, dialogElements);

        // Filter out popover dialogs - we want the actual modal dialog
        const modalDialogs = dialogElements.filter(dialog => {
          // Popover dialogs are created by Radix Popover and have specific attributes
          const isPopover = dialog.hasAttribute('data-side') && dialog.hasAttribute('data-align');
          // Modal dialogs typically have fixed positioning and are larger
          const style = window.getComputedStyle(dialog);
          const isModal = style.position === 'fixed' &&
                         (dialog.classList.contains('max-w-') ||
                          parseInt(style.width) > 300);

          console.log('🔍 Dialog analysis:', {
            dialog,
            isPopover,
            isModal,
            position: style.position,
            width: style.width,
            classes: dialog.className,
            hasDataSide: dialog.hasAttribute('data-side'),
            hasDataAlign: dialog.hasAttribute('data-align')
          });

          return !isPopover && isModal;
        });

        console.log('🔍 Filtered modal dialogs:', modalDialogs);

        // Return the modal dialog that's currently open
        // Note: offsetParent can be null for fixed positioned elements, so we check differently
        const parentDialog = modalDialogs.find(dialog => {
          const dataState = dialog.getAttribute('data-state');
          const isOpen = dataState === 'open' || !dialog.hasAttribute('data-state');
          const style = window.getComputedStyle(dialog);
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden';

          console.log('🔍 Modal dialog check:', {
            dialog,
            dataState,
            isOpen,
            isVisible,
            display: style.display,
            visibility: style.visibility,
            offsetParent: dialog.offsetParent
          });
          return isOpen && isVisible;
        });

        console.log('🔍 Selected parent modal dialog:', parentDialog);
        return parentDialog;
      };

      // Disable modal focus trap for the specific parent dialog
      const disableFocusTrap = () => {
        console.log('🔍 Attempting to disable focus trap...');
        const dialogElement = findParentDialog();
        if (dialogElement) {
          console.log('🔍 Disabling focus trap for dialog:', dialogElement);
          dialogElement.setAttribute('data-modal-disabled', 'true');

          // Remove tabindex to disable focus trap
          const oldTabIndex = dialogElement.getAttribute('tabindex');
          console.log('🔍 Removing tabindex (was:', oldTabIndex, ')');
          dialogElement.removeAttribute('tabindex');

          // Also disable focus trap on any tab panels inside the modal
          const tabPanels = dialogElement.querySelectorAll('[role="tabpanel"]');
          tabPanels.forEach(panel => {
            const oldPanelTabIndex = panel.getAttribute('tabindex');
            console.log('🔍 Disabling tab panel focus trap, tabindex was:', oldPanelTabIndex);
            panel.setAttribute('data-original-tabindex', oldPanelTabIndex || '');
            panel.removeAttribute('tabindex');
          });
        } else {
          console.log('🔍 No dialog element found to disable focus trap');
        }
        return dialogElement;
      };

      // Focus the input after modal focus trap is disabled
      const focusInput = () => {
        console.log('🔍 Attempting to focus input...');
        console.log('🔍 inputRef.current:', inputRef.current);

        if (inputRef.current) {
          console.log('🔍 Input element found, focusing...');
          console.log('🔍 Input element details:', {
            disabled: inputRef.current.disabled,
            readOnly: inputRef.current.readOnly,
            tabIndex: inputRef.current.tabIndex,
            style: inputRef.current.style.cssText,
            offsetParent: inputRef.current.offsetParent
          });

          try {
            inputRef.current.focus();
            console.log('🔍 Focus called, activeElement:', document.activeElement);
            inputRef.current.select();
            console.log('🔍 Select called');
          } catch (error) {
            console.error('🔍 Error focusing input:', error);
          }
        } else {
          console.log('🔍 No input ref available');
        }
      };

      // Use requestAnimationFrame for better timing
      console.log('🔍 Using requestAnimationFrame for timing...');
      requestAnimationFrame(() => {
        console.log('🔍 In requestAnimationFrame callback');
        const dialogElement = disableFocusTrap();
        if (dialogElement) {
          console.log('🔍 Dialog element found, setting timeout for focus...');
          // Small delay to ensure the popover is fully rendered
          setTimeout(() => {
            console.log('🔍 In setTimeout callback, calling focusInput');
            focusInput();
          }, 50);
        } else {
          console.log('🔍 No dialog element, focusing immediately');
          // If no dialog found, focus immediately
          focusInput();
        }
      });
    } else {
      console.log('🔍 Popover closing, re-enabling focus trap...');
      // Re-enable modal focus trap when popover closes
      requestAnimationFrame(() => {
        // Find all dialogs that were disabled by this popover
        const disabledDialogs = Array.from(document.querySelectorAll('[role="dialog"][data-modal-disabled="true"]')) as HTMLElement[];
        console.log('🔍 Found disabled dialogs:', disabledDialogs.length, disabledDialogs);

        disabledDialogs.forEach(dialogElement => {
          // Check if there are any other open popovers in this dialog
          const openPopoversInDialog = dialogElement.querySelectorAll('.edit-popover-input').length;
          console.log('🔍 Open popovers in dialog:', openPopoversInDialog);

          if (openPopoversInDialog === 0) {
            console.log('🔍 No more open popovers, re-enabling focus trap for:', dialogElement);
            // No more open popovers, re-enable focus trap
            dialogElement.removeAttribute('data-modal-disabled');
            dialogElement.setAttribute('tabindex', '-1');

            // Restore tab panel focus traps
            const tabPanels = dialogElement.querySelectorAll('[role="tabpanel"][data-original-tabindex]');
            tabPanels.forEach(panel => {
              const originalTabIndex = panel.getAttribute('data-original-tabindex');
              console.log('🔍 Restoring tab panel tabindex to:', originalTabIndex);
              if (originalTabIndex) {
                panel.setAttribute('tabindex', originalTabIndex);
              }
              panel.removeAttribute('data-original-tabindex');
            });
          }
        });
      });
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
            console.log('🔍 PopoverContent onInteractOutside triggered:', e.target);
            const target = e.target as HTMLElement;

            // Don't prevent default if clicking on anything inside the popover content
            const popoverContent = (e.target as HTMLElement).closest('[data-side][data-align]');
            if (popoverContent) {
              console.log('🔍 Clicked inside popover content, allowing interaction');
              return;
            }

            // Only prevent default for modal dialogs (not popover dialogs) and triggers
            const modalDialog = target.closest('[role="dialog"]:not([data-side]):not([data-align])');
            const trigger = target.closest('[data-trigger="true"]');

            if (modalDialog || trigger) {
              console.log('🔍 Preventing default on interact outside for:', modalDialog ? 'modal dialog' : 'trigger');
              e.preventDefault();
            } else {
              console.log('🔍 Allowing interaction outside - not a modal dialog or trigger');
            }
          }}
          onOpenAutoFocus={(e) => {
            console.log('🔍 PopoverContent onOpenAutoFocus triggered, preventing default');
            e.preventDefault();
          }}

        >
          <div className="flex flex-col gap-2">
            <Input
              ref={inputRef}
              autoFocus
              type="text"
              value={value}
              onChange={(e) => {
                console.log('🔍 Input onChange triggered:', e.target.value);
                e.stopPropagation();
                onValueChange(e.target.value);
              }}
              onKeyUp={handleKeyUp}
              onFocus={() => console.log('🔍 Input onFocus triggered')}
              onBlur={() => console.log('🔍 Input onBlur triggered')}
              onClick={() => console.log('🔍 Input onClick triggered')}
              className="text-sm edit-popover-input"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSubmit();
                }}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
          <PopoverPrimitive.Arrow className="fill-border" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}
