import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Row from "@/components/Row";
import { FF7 } from "@/useFF7";
import { useState } from "react";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { AddMateriaModal } from "@/components/modals/AddMateriaModal";
import { KeyItemsModal } from "@/components/modals/KeyItemsModal";

interface PartyProps {
  ff7: FF7;
}

export function Party({ ff7 }: PartyProps) {
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddMateriaModalOpen, setIsAddMateriaModalOpen] = useState(false);
  const [isKeyItemsModalOpen, setIsKeyItemsModalOpen] = useState(false);

  const handleAddItem = async (itemId: string | null, quantity: number) => {
    if (itemId) {
      await ff7.addItem(parseInt(itemId), quantity);
      setIsAddItemModalOpen(false);
    }
  };

  const handleMaxItems = async () => {
    await ff7.addMaxItems();
    setIsAddItemModalOpen(false);
  };

  const handleAddMateria = async (materiaId: string | null, ap: number) => {
    if (materiaId) {
      await ff7.addMateria(parseInt(materiaId), ap);
      setIsAddMateriaModalOpen(false);
    }
  };

  const handleMaxMateria = async () => {
    await ff7.addMaxMateria();
    setIsAddMateriaModalOpen(false);
  };

  const names = ff7.gameState.partyMembers.map(p => p.name);

  const partyMemberSelect = (slot: number) => {
    return (
      <Select
        value={('' + ff7.gameState.partyMemberIds[slot]) || "1"}
        onValueChange={v => ff7.setPartyMemberSlot(slot, parseInt(v))}
      >
        <SelectTrigger>
          <span className="truncate text-right" style={{ width: 'calc(21vw - 64px)' }}>
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent className="h-[250px]">
          <SelectItem value="255">[Empty]</SelectItem>
          {names.map((p, i) => (
            <SelectItem key={i} value={"" + i}>
              {p || "[Unnamed]"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <>
      <h2 className="uppercase font-medium text-sm border-b border-zinc-600 pb-0 mb-2 tracking-wide text-zinc-900 dark:text-zinc-100">
        Party
      </h2>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="Slot 1">{partyMemberSelect(0)}</Row>
        </div>
        <div className="flex-1">
          <Row label="Slot 2">{partyMemberSelect(1)}</Row>
        </div>
        <div className="flex-1">
          <Row label="Slot 3">{partyMemberSelect(2)}</Row>
        </div>
      </div>
      <div className="flex gap-1">
        <div className="flex-1 flex flex-col gap-1 mt-1">
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddItemModalOpen(true)}
              size="sm"
            >
              Add Items
            </Button>
          </div>
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddMateriaModalOpen(true)}
              size="sm"
            >
              Add Materia
            </Button>
          </div>
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsKeyItemsModalOpen(true)}
              size="sm"
            >
              Manage Key Items
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1 mt-1">
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => ff7.fullHeal()}
              size="sm"
            >
              Full Party Heal
            </Button>
          </div>
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => ff7.toggleLimitBar()}
              size="sm"
            >
              Toggle Limit Bars
            </Button>
          </div>
        </div>
      </div>

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSubmit={handleAddItem}
        onMaxItems={handleMaxItems}
        ff7={ff7}
      />
      <AddMateriaModal
        isOpen={isAddMateriaModalOpen}
        onClose={() => setIsAddMateriaModalOpen(false)}
        onSubmit={handleAddMateria}
        onMaxMateria={handleMaxMateria}
        ff7={ff7}
      />
      <KeyItemsModal
        isOpen={isKeyItemsModalOpen}
        setIsOpen={setIsKeyItemsModalOpen}
        ff7={ff7}
      />
    </>
  );
}
