import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Row from "@/components/Row";
import { FF7 } from "@/useFF7";
import { useState } from "react";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { AddMateriaModal } from "@/components/modals/AddMateriaModal";
import { KeyItemsModal } from "@/components/modals/KeyItemsModal";

const PHS = ['Cloud', 'Barret', 'Tifa', 'Aeris', 'Red XIII', 'Yuffie', 'Cait Sith', 'Vincent', 'Cid'];

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

  const handleAddMateria = async (materiaId: string | null, ap: number) => {
    if (materiaId) {
      await ff7.addMateria(parseInt(materiaId), ap);
      setIsAddMateriaModalOpen(false);
    }
  };

  const partyMemberSelect = (slot: number) => {
    return (
      <Select
        value={('' + ff7.gameState.partyMembers[slot]) || "1"}
        onValueChange={v => ff7.setPartyMemberSlot(slot, parseInt(v))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="h-[250px]">
          <SelectItem value="255">Empty</SelectItem>
          {PHS.map((p, i) => (
            <SelectItem key={i} value={"" + i}>
              {p}
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
      <div className="flex gap-2 mt-1">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setIsAddItemModalOpen(true)}
          size="sm"
        >
          Add Items
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setIsAddMateriaModalOpen(true)}
          size="sm"
        >
          Add Materia
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setIsKeyItemsModalOpen(true)}
          size="sm"
        >
          Manage Key Items
        </Button>
      </div>

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSubmit={handleAddItem}
        ff7={ff7}
      />
      <AddMateriaModal
        isOpen={isAddMateriaModalOpen}
        onClose={() => setIsAddMateriaModalOpen(false)}
        onSubmit={handleAddMateria}
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
