import { useRef, useEffect } from 'react';
import { Modal } from "@/components/Modal";
import type { BattleLogItem } from "@/hooks/useBattleLog";
import { BattleLogRow } from "@/components/BattleLogRow";

interface BattleLogModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  logs: BattleLogItem[];
}

export function BattleLogModal({ isOpen, setIsOpen, logs }: BattleLogModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      console.log("Scrolled to top");
    }
  }, [logs, isOpen]);

  return (
    <Modal
      open={isOpen}
      setIsOpen={setIsOpen}
      title="Full Battle Log"
      size="lg"
      callback={() => setIsOpen(false)}
    >
      <div ref={scrollRef} className="max-h-[70vh] overflow-y-auto p-2 flex-col">
        {logs.length > 0 ? logs.slice().reverse().map((log, index) => (
          <BattleLogRow
            key={`${log.timestamp}-${log.queuePosition}-${log.priority}-${index}`}
            log={log}
          />
        )) : (
          <div className="text-zinc-500 text-center py-4">No battle actions recorded yet</div>
        )}
      </div>
    </Modal>
  );
} 