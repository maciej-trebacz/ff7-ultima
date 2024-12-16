"use strict";

import { useState } from "react";
import { useFF7 } from "./useFF7";
import { useFF7Context } from "./FF7Context";
import AutocompleteInput, { BattleItem } from "./components/Autocomplete";
import { battles } from "./ff7Battles";
import { Info } from "./modules/Info";
import { Field } from "./modules/Field";
import { World } from "./modules/World";
import { Battle } from "./modules/Battle";
import { Hacks } from "./modules/Hacks";

enum Tabs {
  Info = "info",
  Field = "field",
  World = "world",
  Battle = "battle",
}

function Home() {
  const addresses = useFF7Context();

  if (!addresses) {
    return <></>
  }
  const ff7 = useFF7(addresses);

  if (!ff7.gameState) {
    return <></>
  }

  const state = ff7.gameState;
  const [battleId, setBattleId] = useState<null | string>("");
  const [currentTab, setCurrentTab] = useState<Tabs>(Tabs.Info);
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

  return (
    <div className="w-full h-full flex text-sm select-none">
      <div className="flex-1 p-3">
        <div role="tablist" className="tabs tabs-bordered">
          <a
            role="tab"
            className={`tab ${currentTab === Tabs.Info ? "tab-active" : ""}`}
            onClick={() => setCurrentTab(Tabs.Info)}
          >
            Info
          </a>
          <a
            role="tab"
            className={`tab ${currentTab === Tabs.Field ? "tab-active" : ""}`}
            onClick={() => setCurrentTab(Tabs.Field)}
          >
            Field
          </a>
          <a
            role="tab"
            className={`tab ${currentTab === Tabs.World ? "tab-active" : ""}`}
            onClick={() => setCurrentTab(Tabs.World)}
          >
            World
          </a>
          <a
            role="tab"
            className={`tab ${currentTab === Tabs.Battle ? "tab-active" : ""}`}
            onClick={() => setCurrentTab(Tabs.Battle)}
          >
            Battle
          </a>
        </div>

        {currentTab === Tabs.Info && (
          <Info ff7={ff7} />
        )}

        {currentTab === Tabs.Field && (
          <Field ff7={ff7} />
        )}

        {currentTab === Tabs.World && (
          <World ff7={ff7} />
        )}

        {currentTab === Tabs.Battle && (
          <Battle ff7={ff7} />
        )}

        <h2 className="uppercase border-b mt-4">Hacks</h2>
        <Hacks ff7={ff7} />

        <h2 className="uppercase border-b mt-4">Quick Actions</h2>
        <div className="flex gap-1">
          <div className="flex-1 py-1">
            <button
              className="btn btn-primary btn-sm w-full"
              onClick={() => startBattle()}
            >
              Start Battle
            </button>
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
          </div>
          <div className="flex flex-1 py-1">
            <button
              className="btn btn-primary btn-sm flex-1"
              onClick={() => ff7.endBattle(false)}
            >
              Escape
            </button>
            <button
              className="btn btn-primary btn-sm ml-0.5 flex-1"
              onClick={() => ff7.endBattle(true)}
            >
              Win
            </button>
          </div>
          <div className="flex-1 py-1">
            <button
              className="btn btn-primary btn-sm w-full"
              onClick={() => ff7.skipFMV()}
            >
              Skip FMV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;