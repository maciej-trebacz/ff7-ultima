import { useRef, useEffect } from "react";
import { Button } from "./ui/button";

export function Modal(props: { open: boolean, setIsOpen: (open: boolean) => void, title: string, children: React.ReactNode, buttonText: string, callback: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (props.open) {
        ref.current.showModal();
      } else {
        ref.current.close();
      }
    }
  }, [ref.current, props.open]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "Escape") {
      props.setIsOpen(false);
    }
  };

  return (
    <dialog className="modal text-xs" ref={ref} onKeyUp={handleKeyUp}>
      <div className="modal-box p-4">
        <form method="dialog" onSubmit={() => props.setIsOpen(false)}>
          <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg mb-2 mt-0">
          {props.title}
        </h3>
        {props.children}
        <div className="flex w-full">
          <Button variant="secondary" className="w-full" onClick={props.callback}>
            {props.buttonText}
          </Button>
        </div>
      </div>
    </dialog>
  );
}