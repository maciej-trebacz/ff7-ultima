"use strict";

import Row from "./components/Row";
import { GameModule } from "./types";
import { useFF7 } from "./useFF7";
import { formatTime } from "./util";
import GroupButton from "./components/GroupButton";
import { useState } from "react";

function Home() {
  const ff7 = useFF7();
  const state = ff7.gameState;
  const [battleId, setBattleId] = useState("");

  const gameModuleAsString = GameModule[state.currentModule];

  const startBattle = async () => {
    setBattleId("");
    (document.getElementById('start_battle_modal') as any)?.showModal();
    setTimeout(() => {
      (document.getElementById('battle-id') as any)?.focus();
    }, 50)
  };

  const closeStartBattleModal = () => {
    (document.getElementById('start_battle_modal') as any)?.close();
  };

  return (
    <div className="w-full h-full flex text-sm select-none">
      <div className="flex-1 p-3">
        <h2 className="uppercase border-b">Info</h2>
        <div>
          <div className="flex gap-1">
            <div className="flex-1">
              <Row label="Module">{gameModuleAsString}</Row>
              <Row label="Game Moment">{state.gameMoment}</Row>
              <Row label="Field ID">{state.fieldId}</Row>
              <Row label="In Game Time">{formatTime(state.inGameTime)}</Row>
            </div>
            <div className="flex-1">
              <Row label="Current Disc">{state.discId}</Row>
              <Row label="Party Gil">{state.gil}</Row>
              <Row label="Battles Fought">{state.battleCount}</Row>
              <Row label="Battles Escaped">{state.battleEscapeCount}</Row>
            </div>
          </div>
        </div>

        <h2 className="uppercase border-b mt-4">Hacks</h2>
        <div>
          <Row label="Speed">
            <div className="join">
              <GroupButton active={ff7.gameState.speed === "0.25"} onClick={() => ff7.setSpeed(0.25)}>0.25x</GroupButton>
              <GroupButton active={ff7.gameState.speed === "0.5"} onClick={() => ff7.setSpeed(0.5)}>0.5x</GroupButton>
              <GroupButton active={ff7.gameState.speed === "1"} onClick={() => ff7.setSpeed(1)}>1x</GroupButton>
              <GroupButton active={ff7.gameState.speed === "2"} onClick={() => ff7.setSpeed(2)}>2x</GroupButton>
              <GroupButton active={ff7.gameState.speed === "4"} onClick={() => ff7.setSpeed(4)}>4x</GroupButton>
            </div>
          </Row>
          <Row label="Battles">
            <div className="join">
              <GroupButton active={ff7.gameState.battlesDisabled} onClick={() => ff7.disableBattles()}>None</GroupButton>
              <GroupButton active={!ff7.gameState.battlesDisabled && !ff7.gameState.maxBattlesEnabled} onClick={() => ff7.enableBattles()}>Normal</GroupButton>
              <GroupButton active={ff7.gameState.maxBattlesEnabled} onClick={() => ff7.maxBattles()}>Max</GroupButton>
            </div>
          </Row>
          <Row label="Swirl Skip">
            <div className="join">
              <GroupButton active={!ff7.gameState.battleSwirlDisabled} onClick={() => ff7.enableBattleSwirl()}>Disable</GroupButton>
              <GroupButton active={ff7.gameState.battleSwirlDisabled} onClick={() => ff7.disableBattleSwirl()}>Enable</GroupButton>
            </div>
          </Row>
          <Row label="Instant ATB">
            <div className="join">
              <GroupButton active={!ff7.gameState.instantATBEnabled} onClick={() => ff7.disableInstantATB()}>Disable</GroupButton>
              <GroupButton active={ff7.gameState.instantATBEnabled} onClick={() => ff7.enableInstantATB()}>Enable</GroupButton>
            </div>
          </Row>
          <Row label="Skip Intro">
            <div className="join">
              <GroupButton active={!ff7.introDisabled} onClick={() => ff7.disableSkipIntro()}>Disable</GroupButton>
              <GroupButton active={ff7.introDisabled} onClick={() => ff7.enableSkipIntro()}>Enable</GroupButton>
            </div>
          </Row>
          <Row label="Unfocus patch">
            <div className="join">
              <div className="tooltip tooltip-left" data-tip={ff7.gameState.isFFnx ? "FFNx has this patch applied by default" : ""}>
                <GroupButton active={!ff7.gameState.unfocusPatchEnabled} disabled={ff7.gameState.isFFnx} onClick={() => ff7.unpatchWindowUnfocus()}>Disable</GroupButton>
                <GroupButton active={ff7.gameState.unfocusPatchEnabled} disabled={ff7.gameState.isFFnx} onClick={() => ff7.patchWindowUnfocus()}>Enable</GroupButton>
              </div>
            </div>
          </Row>
          <Row label="PHS" onLabelClick={() => ff7.togglePHS(-1)}>
            <div className="join">
              <GroupButton active={ff7.partyMemberEnabled(0)} onClick={() => ff7.togglePHS(0)}>Cloud</GroupButton>
              <GroupButton active={ff7.partyMemberEnabled(1)} onClick={() => ff7.togglePHS(1)}>Barret</GroupButton>
              <GroupButton active={ff7.partyMemberEnabled(2)} onClick={() => ff7.togglePHS(2)}>Tifa</GroupButton>
              <GroupButton active={ff7.partyMemberEnabled(3)} onClick={() => ff7.togglePHS(3)}>Aeris</GroupButton>
              <GroupButton active={ff7.partyMemberEnabled(4)} onClick={() => ff7.togglePHS(4)}>Red</GroupButton>
            </div>
            <div className="join">
              <GroupButton active={ff7.partyMemberEnabled(5)} onClick={() => ff7.togglePHS(5)}>Yuffie</GroupButton>
              <GroupButton active={ff7.partyMemberEnabled(6)} onClick={() => ff7.togglePHS(6)}>Cait Sith</GroupButton>
              <GroupButton active={ff7.partyMemberEnabled(7)} onClick={() => ff7.togglePHS(7)}>Vincent</GroupButton>
              <GroupButton active={ff7.partyMemberEnabled(8)} onClick={() => ff7.togglePHS(8)}>Cid</GroupButton>
            </div>
          </Row>
          <Row label="Menu Visibility" onLabelClick={() => ff7.toggleMenuVisibility(-1)}>
            <div className="join">
              <GroupButton active={ff7.menuVisibilityEnabled(0)} onClick={() => ff7.toggleMenuVisibility(0)}>Item</GroupButton>
              <GroupButton active={ff7.menuVisibilityEnabled(1)} onClick={() => ff7.toggleMenuVisibility(1)}>Magic</GroupButton>
              <GroupButton active={ff7.menuVisibilityEnabled(2)} onClick={() => ff7.toggleMenuVisibility(2)}>Materia</GroupButton>
              <GroupButton active={ff7.menuVisibilityEnabled(3)} onClick={() => ff7.toggleMenuVisibility(3)}>Equip</GroupButton>
              <GroupButton active={ff7.menuVisibilityEnabled(4)} onClick={() => ff7.toggleMenuVisibility(4)}>Status</GroupButton>
            </div>
            <div className="join">
              <GroupButton active={ff7.menuVisibilityEnabled(5)} onClick={() => ff7.toggleMenuVisibility(5)}>Order</GroupButton>
              <GroupButton active={ff7.menuVisibilityEnabled(6)} onClick={() => ff7.toggleMenuVisibility(6)}>Limit</GroupButton>
              <GroupButton active={ff7.menuVisibilityEnabled(7)} onClick={() => ff7.toggleMenuVisibility(7)}>Config</GroupButton>
              <GroupButton active={ff7.menuVisibilityEnabled(8)} onClick={() => ff7.toggleMenuVisibility(8)}>PHS</GroupButton>
              <GroupButton active={ff7.menuVisibilityEnabled(9)} onClick={() => ff7.toggleMenuVisibility(9)}>Save</GroupButton>
            </div>
          </Row>
          <Row label="Menu Locks" onLabelClick={() => ff7.toggleMenuLock(-1)}>
            <div className="join">
              <GroupButton active={ff7.menuLockEnabled(0)} onClick={() => ff7.toggleMenuLock(0)}>Item</GroupButton>
              <GroupButton active={ff7.menuLockEnabled(1)} onClick={() => ff7.toggleMenuLock(1)}>Magic</GroupButton>
              <GroupButton active={ff7.menuLockEnabled(2)} onClick={() => ff7.toggleMenuLock(2)}>Materia</GroupButton>
              <GroupButton active={ff7.menuLockEnabled(3)} onClick={() => ff7.toggleMenuLock(3)}>Equip</GroupButton>
              <GroupButton active={ff7.menuLockEnabled(4)} onClick={() => ff7.toggleMenuLock(4)}>Status</GroupButton>
            </div>
            <div className="join">
              <GroupButton active={ff7.menuLockEnabled(5)} onClick={() => ff7.toggleMenuLock(5)}>Order</GroupButton>
              <GroupButton active={ff7.menuLockEnabled(6)} onClick={() => ff7.toggleMenuLock(6)}>Limit</GroupButton>
              <GroupButton active={ff7.menuLockEnabled(7)} onClick={() => ff7.toggleMenuLock(7)}>Config</GroupButton>
              <GroupButton active={ff7.menuLockEnabled(8)} onClick={() => ff7.toggleMenuLock(8)}>PHS</GroupButton>
              <GroupButton active={ff7.menuLockEnabled(9)} onClick={() => ff7.toggleMenuLock(9)}>Save</GroupButton>
            </div>
          </Row>
        </div>

        <h2 className="uppercase border-b mt-4">Quick Actions</h2>
        <div className="flex gap-1">
          <div className="flex-1 py-1">
            <button className="btn btn-primary btn-sm w-full" onClick={() => startBattle()}>Start Battle</button>
            <dialog id="start_battle_modal" className="modal">
              <div className="modal-box">
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">✕</button>
                </form>
                <h3 className="font-bold text-lg mb-2 mt-0">Start Battle</h3>
                <input id="battle-id" className="p-2 w-full mb-2" placeholder="Enter battle id" value={battleId} onChange={(e) => setBattleId(e.target.value)} />
                <div className="flex gap-2 w-full">
                  <button className="btn btn-primary btn-sm w-full" onClick={() => { ff7.startBattle(parseInt(battleId)); closeStartBattleModal(); }}>Start</button>
                </div>
              </div>
            </dialog>            
          </div>
          <div className="flex-1 py-1">
            <button className="btn btn-primary btn-sm w-full" onClick={() => ff7.endBattle()}>End Battle</button>
          </div>
          <div className="flex-1 py-1">
            <button className="btn btn-primary btn-sm w-full" onClick={() => ff7.skipFMV()}>Skip FMV</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;