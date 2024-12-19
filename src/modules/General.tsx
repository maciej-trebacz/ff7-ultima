import { EditModal } from "@/components/EditModal";
import Row from "@/components/Row";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { GameModule } from "@/types";
import { FF7 } from "@/useFF7";
import { formatTime } from "@/util";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function General(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;

  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [editInfoModalTitle, setEditInfoModalTitle] = useState("");
  const [editInfoModalValue, setEditInfoModalValue] = useState("");

  const gameModuleAsString = GameModule[state.currentModule];

  const openEditInfoModal = (title: string, value: string) => {
    setEditInfoModalTitle(title);
    setEditInfoModalValue(value);
    setEditInfoModalOpen(true);
  }

  const submitValue = () => {
    if (editInfoModalTitle === "Game Moment") {
      ff7.setGameMoment(parseInt(editInfoModalValue));
    } else if (editInfoModalTitle === "Party GP") {
      ff7.setGP(parseInt(editInfoModalValue));
    } else if (editInfoModalTitle === "Current Disc") {
      ff7.setDisc(parseInt(editInfoModalValue));
    } else if (editInfoModalTitle === "Party Gil") {
      ff7.setGil(parseInt(editInfoModalValue));
    } else if (editInfoModalTitle === "Battles Fought") {
      ff7.setBattleCount(parseInt(editInfoModalValue));
    } else if (editInfoModalTitle === "Battles Escaped") {
      ff7.setBattleEscapeCount(parseInt(editInfoModalValue));
    } else if (editInfoModalTitle === "In Game Time") {
      ff7.setInGameTime(parseInt(editInfoModalValue));
      // } else if (editInfoModalTitle === "HP" && currentAllyEditing !== null) {
      //   ff7.setHP(parseInt(editInfoModalValue), currentAllyEditing);
      // } else if (editInfoModalTitle === "MP" && currentAllyEditing !== null) {
      //   ff7.setMP(parseInt(editInfoModalValue), currentAllyEditing);
    }
    setEditInfoModalOpen(false);
  }

  const PHS = ['Cloud', 'Barret', 'Tifa', 'Aeris', 'Red XIII', 'Yuffie', 'Cait Sith', 'Vincent', 'Cid']
  const Menu = ['Item', 'Magic', 'Materia', 'Equip', 'Status', 'Order', 'Limit', 'Config', 'PHS', 'Save']

  return (
    <div>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="Module">{gameModuleAsString}</Row>
          <Row
            label="Party Gil"
            onRowClick={() =>
              openEditInfoModal("Party Gil", state.gil.toString())
            }
          >
            {state.gil}
          </Row>
          <Row
            label="Current Disc"
            onRowClick={() =>
              openEditInfoModal("Current Disc", state.discId.toString())
            }
          >
            {state.discId}
          </Row>
          <Row
            label="In Game Time"
            onRowClick={() =>
              openEditInfoModal(
                "In Game Time",
                formatTime(state.inGameTime)
              )
            }
          >
            {formatTime(state.inGameTime)}
          </Row>
          <Row label="PHS">
          <Popover>
              <PopoverTrigger className="flex items-center">
                Change
                <ChevronDown className="h-3 w-3 ml-0.5 mt-0.5 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="text-xs flex flex-col gap-1">
                {PHS.map((ally, index) => (
                  <label className="flex bg-zinc-800 p-1 px-2 rounded-sm flex-col gap-2" key={index}>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">{ally}</div>
                      <Checkbox checked={ff7.partyMemberEnabled(index)} onClick={(e) => ff7.togglePHS(index)} />
                    </div>
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </Row>
        </div>
        <div className="flex-1">
          <Row
            label="Game Moment"
            onRowClick={() =>
              openEditInfoModal(
                "Game Moment",
                state.gameMoment.toString()
              )
            }
          >
            {state.gameMoment}
          </Row>
          <Row
            label="Party GP"
            onRowClick={() =>
              openEditInfoModal("Party GP", state.gp.toString())
            }
          >
            {state.gp}
          </Row>
          <Row
            label="Battles Fought"
            onRowClick={() =>
              openEditInfoModal(
                "Battles Fought",
                state.battleCount.toString()
              )
            }
          >
            {state.battleCount}
          </Row>
          <Row
            label="Battles Escaped"
            onRowClick={() =>
              openEditInfoModal(
                "Battles Escaped",
                state.battleEscapeCount.toString()
              )
            }
          >
            {state.battleEscapeCount}
          </Row>
          <Row label="Menu access">
            <Popover>
              <PopoverTrigger className="flex items-center">
                Change
                <ChevronDown className="h-3 w-3 ml-0.5 mt-0.5 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="text-xs flex flex-col gap-1">
                {Menu.map((menu, index) => (
                  <div className="flex bg-zinc-800 p-1 px-2 rounded-sm flex-col gap-2" key={index}>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">{menu}</div>
                      show
                      <Checkbox checked={ff7.menuVisibilityEnabled(index)} onClick={(e) => ff7.toggleMenuVisibility(index)} />
                      lock
                      <Checkbox checked={ff7.menuLockEnabled(index)} onClick={(e) => ff7.toggleMenuLock(index)} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-center">
                  <a className="cursor-pointer hover:underline" onClick={() => {ff7.toggleMenuVisibility(-1); ff7.toggleMenuLock(-1)}}>Toggle all</a>
                </div>
              </PopoverContent>
            </Popover>
          </Row>
        </div>
      </div>

      <EditModal
        open={editInfoModalOpen}
        setIsOpen={setEditInfoModalOpen}
        value={editInfoModalValue}
        setValue={setEditInfoModalValue}
        title={editInfoModalTitle}
        buttonText="Save"
        onSubmit={submitValue}>
      </EditModal>
    </div>
  );
}