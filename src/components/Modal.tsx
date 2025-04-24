import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  buttonText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  disableClose?: boolean;
  buttonDisabled?: boolean;
  callback?: () => void;
  leftButtonText?: string;
  leftButtonCallback?: () => void;
}

export function Modal({ open, setIsOpen, title, children, buttonText, size = "md", disableClose = false, buttonDisabled = false, callback, leftButtonText, leftButtonCallback }: ModalProps) {
  const handleOpenChange = (open: boolean) => {
    if (!disableClose) {
      setIsOpen(open);
    }
  };

  const sizes = {
    sm: 'max-w-[300px]',
    md: 'max-w-[400px]',
    lg: 'max-w-[500px]',
    xl: 'max-w-[600px]',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent className={`text-xs ${sizes[size]} p-3 pt-2.5`}>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        {children}
        {buttonText && callback && (
          <DialogFooter className="flex justify-between sm:justify-between">
            {leftButtonText && leftButtonCallback && (
              <Button 
                onClick={leftButtonCallback}
                variant="outline"
                className="mr-2"
              >
                {leftButtonText}
              </Button>
            )}
            <Button 
              onClick={callback}
              disabled={buttonDisabled}
            >
              {buttonText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}