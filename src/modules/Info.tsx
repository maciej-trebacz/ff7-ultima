import { EditModal } from "@/components/EditModal";
import Row from "@/components/Row";
import { GameModule } from "@/types";
import { FF7 } from "@/useFF7";
import { formatTime } from "@/util";
import { useState } from "react";

export function Info(props: { ff7: FF7 }) {
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