import { Modal } from "@/components/Modal";
import AutocompleteInput from "@/components/Autocomplete";
import { gameMoments } from "@/ff7GameMoments";
import { useState } from "react";

interface GameMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (momentId: string | null) => void;
  currentGameMoment: number;
}

const gameMomentList = gameMoments.map((moment) => {
  const [id] = moment.split(" - ");
  return {
    id: parseInt(id),
    name: moment,
  };
});

export function GameMomentModal({ isOpen, onClose, onSubmit, currentGameMoment }: GameMomentModalProps) {
  const [gameMomentId, setGameMomentId] = useState<string>("");

  const onGameMomentModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      onSubmit(gameMomentId);
    }
  };

  return (
    <Modal
      open={isOpen}
      setIsOpen={onClose}
      title="Set Game Moment"
      buttonText="Set"
      callback={() => onSubmit(gameMomentId)}
    >
      <div className="relative">
        <AutocompleteInput
          battles={gameMomentList}
          isVisible={true}
          onSelect={(id) => setGameMomentId(id?.toString() ?? "")}
          onAccept={onGameMomentModalKeyDown}
          placeholder="Enter game moment name or ID"
          value={gameMomentList.find(moment => moment.id === currentGameMoment)}
        />
      </div>
    </Modal>
  );
}
