import { useRef, useEffect } from "react";
import { Modal } from "./Modal";
import { Input } from "./ui/input";

interface EditModalProps {
  open: boolean;
  buttonText: string;
  setIsOpen: (open: boolean) => void;
  title: string;
  value: string;
  setValue: (value: string) => void;
  onSubmit: () => void;
}

export function EditModal(props: EditModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.open) {
      // Focus and select input after modal is shown
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [props.open]);

  const handleSubmit = () => {
    props.onSubmit();
    props.setIsOpen(false);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      props.setIsOpen(false);
    } else if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Modal
      open={props.open}
      setIsOpen={props.setIsOpen}
      title={props.title}
      buttonText={props.buttonText}
      callback={handleSubmit}
    >
      <Input
        ref={inputRef}
        type="text"
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
        onKeyUp={handleKeyUp}
        className="w-full text-sm"
      />
    </Modal>
  );
}
