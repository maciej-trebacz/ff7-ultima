import { useRef, useEffect } from "react";

export function AlertModal(props: { open: boolean, setIsOpen: (open: boolean) => void, title: string, children: React.ReactNode }) {
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
    <dialog className="modal" ref={ref} onKeyUp={handleKeyUp}>
      <div className="modal-box">
        <form method="dialog" onSubmit={() => props.setIsOpen(false)}>
          <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg mb-2 mt-0">
          {props.title}
        </h3>
        <div className="w-full mb-4">
          {props.children}
        </div>
        <div className="flex justify-end">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => props.setIsOpen(false)}
          >
            Ok
          </button>
        </div>
      </div>
    </dialog>
  );
}
