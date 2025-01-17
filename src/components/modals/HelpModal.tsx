import { Modal } from "@/components/Modal";

interface HelpModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function HelpModal({ isOpen, setIsOpen }: HelpModalProps) {
  return (
    <Modal
      open={isOpen}
      setIsOpen={setIsOpen}
      title="Keyboard Shortcuts"
      size="sm"
      callback={() => {}}
    >
      <div className="space-y-2">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <div className="text-slate-400">F1</div>
          <div>Skip FMV</div>
          <div className="text-slate-400">F2</div>
          <div>End Battle (by escaping)</div>
          <div className="text-slate-400">F3</div>
          <div>Speed Up (4x)</div>
          <div className="text-slate-400">F4</div>
          <div>Normal Speed (1x)</div>
          <div className="text-slate-400">F5</div>
          <div>Load State (on field)</div>
          <div className="text-slate-400">F6</div>
          <div>Save State (on field)</div>
          <div className="text-slate-400">F7</div>
          <div>Full Heal and remove bad status effects</div>
          <div className="text-slate-400">F8</div>
          <div>Toggle Limit Bar (full or empty)</div>
          <div className="text-slate-400">F9</div>
          <div>Game Over</div>
        </div>
      </div>
    </Modal>
  );
}
