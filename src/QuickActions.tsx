import { useState } from "react";
import { Button } from "./components/ui/button";
import { GameModule } from "./types";
import { FF7 } from "./useFF7";
import { battles } from "./ff7Battles";
import AutocompleteInput, { BattleItem } from "./components/Autocomplete";

export function QuickActions(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const currentModule = ff7.gameState.currentModule;

  const [battleId, setBattleId] = useState<null | string>("");
  const [isStartBattleModalOpen, setIsStartBattleModalOpen] = useState(false);

  const startBattle = async () => {
    setBattleId("");
    setIsStartBattleModalOpen(true);
    (document.getElementById('start_battle_modal') as any)?.showModal();
    setTimeout(() => {
      (document.getElementById('battle-id') as any)?.focus();
    }, 50)
  };

  const closeStartBattleModal = () => {
    setIsStartBattleModalOpen(false);
    (document.getElementById('start_battle_modal') as any)?.close();
  };

  const onSubmitBattleId = (battleId: string | null) => {
    if (battleId === null) {
      return;
    }
    ff7.startBattle(parseInt(battleId));
    closeStartBattleModal();
  }

  const onBattleModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeStartBattleModal();
    } else if (e.key === "Enter") {
      onSubmitBattleId(battleId);
    }
  };

  const battleList: BattleItem[] = battles.map((battle, index) => {
    const tmp = battle.split(" - ");
    return {
      id: parseInt(tmp[0]),
      name: battle,
    };
  });

  return <>
    {currentModule !== GameModule.Battle ?
      <Button size={"sm"} variant={"secondary"} onClick={() => startBattle()}>Start Battle</Button>
      :
      <div className="flex gap-2">
        <Button size={"sm"} variant={"secondary"} className="flex-1" onClick={() => ff7.endBattle(false)}>Escape</Button>
        <Button size={"sm"} variant={"secondary"} className="flex-1" onClick={() => ff7.endBattle(true)}>Win</Button>
      </div>
    }

    <Button size={"sm"} variant={"secondary"} onClick={() => ff7.skipFMV()}>Skip FMV</Button>
    <Button size={"sm"} variant={"secondary"} onClick={() => ff7.gameOver()}>Game Over</Button>

    <dialog id="start_battle_modal" className="modal">
              <div className="modal-box overflow-visible">
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={closeStartBattleModal}>
                    ✕
                  </button>
                </form>
                <h3 className="font-bold text-lg mb-2 mt-0">Start Battle</h3>
                <div className="relative"></div>
                <AutocompleteInput
                  battles={battleList}
                  isVisible={isStartBattleModalOpen}
                  onSelect={(id: number | null) =>
                    setBattleId(id ? id.toString() : null)
                  }
                  onAccept={(e: any) => { onSubmitBattleId(battleId); e.preventDefault(); }}
                />
                <div className="flex gap-2 w-full">
                  <button
                    className="btn btn-primary btn-sm w-full"
                    onClick={(e: any) => onSubmitBattleId(battleId)}
                  >
                    Start
                  </button>
                </div>
              </div>
            </dialog>    
  </>;
}