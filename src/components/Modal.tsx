import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { X } from "lucide-react";

export function Modal(props: {
  open: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  buttonText?: string;
  size?: 'sm' | 'md' | 'lg';
  callback: () => void;
  buttonDisabled?: boolean;
}) {
  const sizes = {
    sm: 'max-w-[300px]',
    md: 'max-w-[400px]',
    lg: 'max-w-[500px]',
  };
  return (
    <Dialog open={props.open} onOpenChange={props.setIsOpen}>
      <DialogContent className={`text-xs ${sizes[props.size || 'md']} p-3 pt-2.5`}>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-lg">{props.title}</DialogTitle>
        </DialogHeader>
        {props.children}
        {props.buttonText &&
          <div className="flex w-full">
            <Button 
              variant="secondary" 
              className="w-full" 
              onClick={props.callback}
              disabled={props.buttonDisabled}
            >
              {props.buttonText}
            </Button>
          </div>
        }
      </DialogContent>
    </Dialog>
  );
}