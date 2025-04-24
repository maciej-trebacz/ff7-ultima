import { Modal } from "@/components/Modal";
import AutocompleteInput from "@/components/Autocomplete";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { FF7 } from "@/useFF7";

interface AddMateriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (materiaId: string | null, ap: number) => void;
  onMaxMateria?: () => void;
  ff7: FF7;
}

interface MateriaOption {
  id: number;
  name: string;
}

export function AddMateriaModal({ isOpen, onClose, onSubmit, onMaxMateria, ff7 }: AddMateriaModalProps) {
  const [materiaId, setMateriaId] = useState<string>("");
  const [ap, setAp] = useState<number>(0);
  const [isMaxAp, setIsMaxAp] = useState(false);
  const [materiaList, setMateriaList] = useState<MateriaOption[]>([]);
  
  useEffect(() => {
    const loadMaterias = async () => {
      const materias = await ff7.getMateriaNames() as string[];
      setMateriaList(materias
        .map((materia, index) => ({
          id: index,
          name: materia,
        }))
        .filter(materia => materia.name.trim() !== "")
      );
    };
    if (isOpen) {
      loadMaterias();
      setIsMaxAp(false);
      setMateriaId("");
      setAp(0);
    }
  }, [isOpen]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      onSubmit(materiaId, ap);
    }
  };

  const handleApChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMaxAp) {
      const value = parseInt(e.target.value) || 0;
      setAp(Math.max(0, Math.min(16777215, value)));
    }
  };

  const handleMaxChange = (checked: boolean) => {
    setIsMaxAp(checked);
    if (checked) {
      setAp(16777215);
    } else {
      setAp(0);
    }
  };

  return (
    <Modal
      open={isOpen}
      setIsOpen={onClose}
      title="Add Materia"
      buttonText="Add"
      callback={() => onSubmit(materiaId, ap)}
      buttonDisabled={!materiaId}
      leftButtonText={onMaxMateria ? "Max Materia" : undefined}
      leftButtonCallback={onMaxMateria}
    >
      <div className="space-y-4">
        <div className="relative">
          <AutocompleteInput
            battles={materiaList}
            isVisible={true}
            onSelect={(id) => {
              const idString = id?.toString() ?? "";
              setMateriaId(idString);
            }}
            onAccept={onKeyDown}
            placeholder="Enter materia name"
            value={materiaId ? materiaList.find(materia => materia.id.toString() === materiaId) : undefined}
          />
        </div>
        <div className="flex items-center gap-4">
          <label
            htmlFor="ap"
            className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100"
          >
            AP:
          </label>
          <div className="flex items-center gap-4">
            <Input
              id="ap"
              type="number"
              value={ap}
              onChange={handleApChange}
              min={0}
              max={16777215}
              disabled={isMaxAp}
              className="w-28"
              placeholder="AP"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="maxAp"
                checked={isMaxAp}
                onCheckedChange={handleMaxChange}
              />
              <label
                htmlFor="maxAp"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Max
              </label>
            </div>
            <div className="flex-1" />
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Note: Max Materia adds 1 of each materia at the end of materia list
        </p>
      </div>
    </Modal>
  );
}
