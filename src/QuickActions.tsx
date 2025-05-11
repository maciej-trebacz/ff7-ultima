import { useState } from "react";
import { Button } from "./components/ui/button";
import { GameModule } from "./types";
import { FF7 } from "./useFF7";
import { musicList } from "./ff7Music";
import BattleAutocomplete, { BattleFormationItem } from "./components/BattleAutocomplete";
import { Modal } from "./components/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { useFF7Context } from "./FF7Context";
import { BattleLocations } from "./ff7BattleLocations";

export function QuickActions(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const currentModule = ff7.gameState.currentModule;
  const { gameData } = useFF7Context();
  const battleScenes = gameData.battleScenes;

  const [battleId, setBattleId] = useState<null | string>("");

  const [isStartBattleModalOpen, setIsStartBattleModalOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<number | null>(null);

  const skipBtnLabel = [GameModule.Highway, GameModule.Submarine, GameModule.SnowBoard, GameModule.Snowboard2, GameModule.Chocobo].includes(currentModule) ? "Skip Minigame" : "Skip FMV";

  const startBattle = () => {
    setBattleId("");
    setSelectedMusic(null);
    setIsStartBattleModalOpen(true);
    setTimeout(() => {
      (document.getElementById('battle-id') as any)?.focus();
    }, 50)
  };

  const closeStartBattleModal = () => {
    setIsStartBattleModalOpen(false);
  };

  const onSubmitBattleId = (battleId: string | null) => {
    if (battleId === null) {
      return;
    }
    ff7.startBattle(parseInt(battleId), selectedMusic || 0);
    closeStartBattleModal();
  }

  const onBattleModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeStartBattleModal();
    } else if (e.key === "Enter") {
      onSubmitBattleId(battleId);
    }
  };

  // Create a list of all battle formations with their enemies and locations
  const battleFormations: BattleFormationItem[] = [];
  battleScenes.forEach((scene, sceneIndex) => {
    scene.formations.forEach((formation, formationIndex) => {
      battleFormations.push({
        id: (sceneIndex * 4) + formationIndex, // Each scene has 4 formations
        formation,
        enemies: scene.enemies
      });
    });
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

    {currentModule !== GameModule.Submarine ?
      <Button size={"sm"} variant={"secondary"} onClick={() => ff7.skipFMV()}>{skipBtnLabel}</Button>
      :
      <div className="flex gap-2">
        <Button size={"sm"} variant={"secondary"} className="flex-1" onClick={() => ff7.skipFMV()}>Fail</Button>
        <Button size={"sm"} variant={"secondary"} className="flex-1" onClick={() => ff7.skipFMV(true)}>Win</Button>
      </div>
    }

    <Button size={"sm"} variant={"secondary"} onClick={() => ff7.gameOver()}>Game Over</Button>

    <Modal
      size="lg"
      open={isStartBattleModalOpen}
      setIsOpen={setIsStartBattleModalOpen}
      title="Start Battle"
      buttonText="Start"
      callback={() => onSubmitBattleId(battleId)}
    >
      <div className="mt-4 space-y-4">
        <BattleAutocomplete
          formations={battleFormations}
          isVisible={true}
          onSelect={(id) => setBattleId(id?.toString() ?? "")}
          onAccept={onBattleModalKeyDown}
          placeholder="Enter enemy name, location, or battle ID"
        />

        <div className="flex gap-2 whitespace-nowrap">
          Battle music:
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Select
                    value={"" + selectedMusic}
                    onValueChange={(value) => setSelectedMusic(
                      parseInt(value)
                    )}
                    disabled={currentModule !== GameModule.Field}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select music for the battle">
                        {musicList[selectedMusic || 0]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="h-[200px]">
                      {musicList.map((source, index) => (
                        <SelectItem
                          key={index}
                          value={"" + index}
                        >
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              {currentModule !== GameModule.Field && (
                <TooltipContent>
                  <p className="text-xs">Battle music can only be changed while on the field</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Modal>
  </>;
}