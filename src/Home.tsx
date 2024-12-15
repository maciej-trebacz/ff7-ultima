"use strict";

import Row from "./components/Row";
import { EnemyData, GameModule, WorldModelType, WorldWalkmeshType, ElementalType, ElementalEffect, BattleCharObj, ItemType } from "./types";
import { formatTime } from "./util";
import GroupButton from "./components/GroupButton";
import { useState } from "react";
import { useFF7 } from "./useFF7";
import { useFF7Context } from "./FF7Context";
import AutocompleteInput, { Battle } from "./components/Autocomplete";
import { battles } from "./ff7Battles";
import { statuses } from "./ff7Statuses";

enum Tabs {
  Info = "info",
  Field = "field",
  World = "world",
  Battle = "battle",
}

function Home() {
  const addresses = useFF7Context();

  if (!addresses) {
    return <div>FF7 addresses not available</div>;
  }
  const ff7 = useFF7(addresses);

  if (!ff7.gameState) {
    return <div>FF7 game state not available</div>;
  }

  const state = ff7.gameState;
  const [battleId, setBattleId] = useState<null | string>("");
  const [currentTab, setCurrentTab] = useState<Tabs>(Tabs.Info);
  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [editStatusModalOpen, setEditStatusModalOpen] = useState(false);
  const [editInfoModalTitle, setEditInfoModalTitle] = useState("");
  const [editInfoModalValue, setEditInfoModalValue] = useState("");
  const [isStartBattleModalOpen, setIsStartBattleModalOpen] = useState(false);
  const [currentAllyEditing, setCurrentAllyEditing] = useState<number | null>(null);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertText, setAlertText] = useState("");
  const [isEnemyInfoModalOpen, setIsEnemyInfoModalOpen] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<number | null>(null);
  const [enemyData, setEnemyData] = useState<EnemyData | null>(null);
  const [enemyName, setEnemyName] = useState<string>("");

  const gameModuleAsString = GameModule[state.currentModule];

  const showAlert = (title: string, text: string) => {
    setAlertTitle(title);
    setAlertText(text);
    (document.getElementById('alert_modal') as any)?.showModal();
  };

  const openEditStatusModal = () => {
    setEditStatusModalOpen(true);
    (document.getElementById('edit_status_modal') as any)?.showModal();
  };

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

  const onEditInfoModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      (document.getElementById('edit_info_modal') as any)?.close();
    } else if (e.key === "Enter") {
      submitValue();
    }
  };

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
    } else if (editInfoModalTitle === "HP" && currentAllyEditing !== null) {
      ff7.setHP(parseInt(editInfoModalValue), currentAllyEditing);
    } else if (editInfoModalTitle === "MP" && currentAllyEditing !== null) {
      ff7.setMP(parseInt(editInfoModalValue), currentAllyEditing);
    }
    setEditInfoModalOpen(false);
    (document.getElementById('edit_info_modal') as any)?.close();
  }

  const openEditInfoModal = (title: string, value: string) => {
    (document.getElementById('edit_info_modal') as any)?.showModal();
    setEditInfoModalTitle(title);
    setEditInfoModalValue(value);
    setTimeout(() => {
      (document.getElementById('edit-input-id') as any)?.focus();
      (document.getElementById('edit-input-id') as any)?.select();
    }, 50)
  }

  const battleList: Battle[] = battles.map((battle, index) => {
    const tmp = battle.split(" - ");
    return {
      id: parseInt(tmp[0]),
      name: battle,
    };
  });

  const formatStatus = (status: number, flags: number) => {
    const statusList: string[] = [];
    for (const key in statuses) {
      if (status & statuses[key as keyof typeof statuses]) {
        statusList.push(key);
      }
    }
    if (flags & 0x1) {
      statusList.push("ImmunePhysical");
    }
    if (flags & 0x2) {
      statusList.push("ImmuneMagic");
    }
    return statusList.join(", ");
  }

  const setSpeed = async (speed: number) => {
    const check = await ff7.setSpeed(speed);
    if (!check) {
      showAlert("Not supported", "This version of FFNx is not supported for setting speed. Use the built-in speedhack instead.");
    }
  };

  const showEnemyInfoModal = async (sceneId: number, name: string) => {
    const data = await ff7.readEnemyData(sceneId);
    setEnemyData(data);
    setEnemyName(name);
    setSelectedEnemy(sceneId);
    (document.getElementById('enemy_info_modal') as any)?.showModal();
    setIsEnemyInfoModalOpen(true);
  }

  const parseEnemyName = (enemy: BattleCharObj) => {
    const enemies = ff7.gameState.battleEnemies.filter(e => e.name === enemy.name);
    if (enemies.length === 1) {
      return enemy.name;
    } else {

      // Return name with a letter suffix at the end, eg. "Enemy A", "Enemy B", etc.
      return enemy.name + " " + String.fromCharCode(65 + enemies.indexOf(enemy));
    }
  }

  const getElementName = (element: number) => {
    if (element >= 0x10 && element < 0x20) {
      return "No Effect";
    }
    if (element >= 0x20 && element < 0x40) {
      return Object.keys(statuses)[element - 0x20] + " (status)";
    }
    return ElementalType[element] || "Unknown";
  }

  const actors = currentAllyEditing !== null && currentAllyEditing > 3 ? ff7.gameState.battleEnemies : ff7.gameState.battleAllies;
  const actorIdx = currentAllyEditing !== null && currentAllyEditing > 3 ? currentAllyEditing - 4 : currentAllyEditing;

  return (
    <div className="w-full h-full flex text-sm select-none">
      <div className="flex-1 p-3">
        {/* <h2 className="uppercase border-b">Info</h2> */}
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
          </div>
        )}

        {currentTab === Tabs.Field && (
          <div>
            <div className="flex gap-1">
              <div className="flex-1">
                <Row label="Field ID">
                  {state.fieldId}{" "}
                  {state.fieldId > 0 && (
                    <span className="text-zinc-400">({state.fieldName})</span>
                  )}
                </Row>
                <Row label="Step Fraction">{state.stepFraction}</Row>
              </div>
              <div className="flex-1">
                <Row label="Step ID">{state.stepId}</Row>
                <Row label="Danger Value">{state.dangerValue}</Row>
              </div>
            </div>

            <h4 className="text-center mt-2 mb-1 font-medium">Field Models</h4>
            <table className="w-full">
              <thead className="bg-zinc-800 text-xs text-left">
                <tr>
                  <th className="p-1">Name</th>
                  <th className="p-1 px-2">X</th>
                  <th className="p-1 px-2">Y</th>
                  <th className="p-1 px-2">Z</th>
                  <th className="p-1">Direction</th>
                </tr>
                </thead>
              <tbody>
              {ff7.gameState.fieldModels.map((model, index) => {
                return model ? (
                  <tr key={index} className="bg-zinc-800 text-xs">
                    <td className="p-1 text-nowrap w-14 font-bold">{model.name}</td>
                    <td className="p-1 px-2 text-nowrap">{model.x}</td>
                    <td className="p-1 px-2 text-nowrap">{model.y}</td>
                    <td className="p-1 px-2 text-nowrap">{model.z}</td>
                    <td className="p-1">{model.direction}</td>
                  </tr>
                  ) : (
                  <tr key={index} className="bg-zinc-800 text-xs">
                    <td className="p-1 text-nowrap w-14 font-bold">N/A</td>
                    <td className="p-1 px-2 text-nowrap">N/A</td>
                    <td className="p-1 px-2 text-nowrap">N/A</td>
                    <td className="p-1 px-2 text-nowrap">N/A</td>
                    <td className="p-1">N/A</td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {currentTab === Tabs.World && (
          <div>
            <h4 className="text-center mt-2 mb-1 font-medium">Current Position</h4>
            <div className="flex gap-1">
              <div className="flex-1">
                <Row label="X">{ff7.gameState.worldCurrentModel.x}</Row>
                <Row label="Y">{ff7.gameState.worldCurrentModel.y}</Row>
                <Row label="Z">{ff7.gameState.worldCurrentModel.z}</Row>
                <Row label="Direction">{ff7.gameState.worldCurrentModel.direction}</Row>
              </div>
              <div className="flex-1">
                <Row label="Model">{WorldModelType[ff7.gameState.worldCurrentModel.model_id]}</Row>
                <Row label="Terrain">
                  {WorldWalkmeshType[ff7.gameState.worldCurrentModel.walkmesh_type] || ff7.gameState.worldCurrentModel.walkmesh_type}
                </Row>
                <Row label="Script ID">{ff7.gameState.worldCurrentModel.script}</Row>
              </div>
            </div>
          </div>
        )}

        {currentTab === Tabs.Battle && (
          <div>
            <div className="flex flex-col gap-1">
              <div className="flex-1">
                <Row label="Battle ID">
                  {state.battleId > 0 && state.battleId < 0xffff
                    ? state.battleId
                    : "-"}
                </Row>
              </div>

              <h4 className="text-center mt-2 mb-1 font-medium">Allies</h4>
              <table>
                <thead className="bg-zinc-800 text-xs text-left">
                  <tr>
                    <th className="p-1">Name</th>
                    <th className="p-1 px-2">HP</th>
                    <th className="p-1 px-2">MP</th>
                    <th className="p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
              {ff7.gameState.battleAllies.map((char, index) => {
                if (!char.name.trim()) return null;
                return (
                  <tr key={index} className="bg-zinc-800 text-xs">
                    <td className="p-1 text-nowrap w-14 font-bold">{char.name}</td>
                    <td className="p-1 cursor-pointer px-2 text-nowrap" onClick={() => {setCurrentAllyEditing(index); openEditInfoModal("HP", char.hp + "")}}>{char.hp} / {char.max_hp}</td>
                    <td className="p-1 cursor-pointer px-2 text-nowrap" onClick={() => {setCurrentAllyEditing(index); openEditInfoModal("MP", char.mp + "")}}>{char.mp} / {char.max_mp}</td>
                    <td className="p-1 cursor-pointer" onClick={() => {setCurrentAllyEditing(index); openEditStatusModal(); }}>{formatStatus(char.status, char.flags) || <span className="text-zinc-400">[None]</span>}</td>
                  </tr>
                )
              })}
              </tbody>
              </table>

              <h4 className="text-center mt-2 mb-1 font-medium">Enemies</h4>
              <table>
                <thead className="bg-zinc-800 text-xs text-left">
                  <tr>
                    <th className="p-1">Name</th>
                    <th className="p-1 px-2">HP</th>
                    <th className="p-1 px-2">MP</th>
                    <th className="p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
              {ff7.gameState.battleEnemies.map((char, index) => {
                if (!char.name.trim()) return null;
                return (
                  <tr key={index} className="bg-zinc-800 text-xs">
                    <td className="p-1 text-nowrap w-14 font-bold cursor-pointer hover:text-blue-300" onClick={() => {showEnemyInfoModal(char.scene_id, char.name)}}>
                      {parseEnemyName(char)}
                    </td>
                    <td className="p-1 cursor-pointer px-2 text-nowrap" onClick={() => {setCurrentAllyEditing(index + 4); openEditInfoModal("HP", char.hp + "")}}>{char.hp} / {char.max_hp}</td>
                    <td className="p-1 cursor-pointer px-2 text-nowrap" onClick={() => {setCurrentAllyEditing(index + 4); openEditInfoModal("MP", char.mp + "")}}>{char.mp} / {char.max_mp}</td>
                    <td className="p-1 cursor-pointer" onClick={() => {setCurrentAllyEditing(index + 4); openEditStatusModal(); }}>{formatStatus(char.status, char.flags) || <span className="text-zinc-400">[None]</span>}</td>
                  </tr>
                )
              })}
              </tbody>
              </table>
            </div>
          </div>
        )}

        <h2 className="uppercase border-b mt-4">Hacks</h2>
        <div>
          <Row label="Speed">
            <div className="join">
              <GroupButton
                active={ff7.gameState.speed === "0.25"}
                onClick={() => setSpeed(0.25)}
              >
                0.25x
              </GroupButton>
              <GroupButton
                active={ff7.gameState.speed === "0.5"}
                onClick={() => setSpeed(0.5)}
              >
                0.5x
              </GroupButton>
              <GroupButton
                active={ff7.gameState.speed === "1"}
                onClick={() => setSpeed(1)}
              >
                1x
              </GroupButton>
              <GroupButton
                active={ff7.gameState.speed === "2"}
                onClick={() => setSpeed(2)}
              >
                2x
              </GroupButton>
              <GroupButton
                active={ff7.gameState.speed === "4"}
                onClick={() => setSpeed(4)}
              >
                4x
              </GroupButton>
            </div>
          </Row>
          <Row label="Battles">
            <div className="join">
              <GroupButton
                active={ff7.gameState.battlesDisabled}
                onClick={() => ff7.disableBattles()}
              >
                None
              </GroupButton>
              <GroupButton
                active={
                  !ff7.gameState.battlesDisabled &&
                  !ff7.gameState.maxBattlesEnabled
                }
                onClick={() => ff7.enableBattles()}
              >
                Normal
              </GroupButton>
              <GroupButton
                active={ff7.gameState.maxBattlesEnabled}
                onClick={() => ff7.maxBattles()}
              >
                Max
              </GroupButton>
            </div>
          </Row>
          <Row label="Swirl Skip">
            <div className="join">
              <GroupButton
                active={!ff7.gameState.battleSwirlDisabled}
                onClick={() => ff7.enableBattleSwirl()}
              >
                Disable
              </GroupButton>
              <GroupButton
                active={ff7.gameState.battleSwirlDisabled}
                onClick={() => ff7.disableBattleSwirl()}
              >
                Enable
              </GroupButton>
            </div>
          </Row>
          <Row label="Instant ATB">
            <div className="join">
              <GroupButton
                active={!ff7.gameState.instantATBEnabled}
                onClick={() => ff7.disableInstantATB()}
              >
                Disable
              </GroupButton>
              <GroupButton
                active={ff7.gameState.instantATBEnabled}
                onClick={() => ff7.enableInstantATB()}
              >
                Enable
              </GroupButton>
            </div>
          </Row>
          <Row label="Invincibility">
            <div className="join">
              <GroupButton
                active={!ff7.gameState.invincibilityEnabled}
                onClick={() => ff7.disableInvincibility()}
              >
                Disable
              </GroupButton>
              <GroupButton
                active={ff7.gameState.invincibilityEnabled}
                onClick={() => ff7.enableInvincibility()}
              >
                Enable
              </GroupButton>
            </div>
          </Row>
          <Row label="Skip Intro">
            <div className="join">
              <GroupButton
                active={!ff7.introDisabled}
                onClick={() => ff7.disableSkipIntro()}
              >
                Disable
              </GroupButton>
              <GroupButton
                active={ff7.introDisabled}
                onClick={() => ff7.enableSkipIntro()}
              >
                Enable
              </GroupButton>
            </div>
          </Row>
          <Row label="Unfocus patch">
            <div className="join">
              <div
                className="tooltip tooltip-left"
                data-tip={
                  ff7.gameState.isFFnx
                    ? "FFNx has this patch applied by default"
                    : ""
                }
              >
                <GroupButton
                  active={!ff7.gameState.unfocusPatchEnabled}
                  disabled={ff7.gameState.isFFnx}
                  onClick={() => ff7.unpatchWindowUnfocus()}
                >
                  Disable
                </GroupButton>
                <GroupButton
                  active={ff7.gameState.unfocusPatchEnabled}
                  disabled={ff7.gameState.isFFnx}
                  onClick={() => ff7.patchWindowUnfocus()}
                >
                  Enable
                </GroupButton>
              </div>
            </div>
          </Row>
          <Row label="Movement enabled">
            <div className="join">
              <GroupButton
                active={!!ff7.gameState.fieldMovementDisabled}
                onClick={() => ff7.toggleMovement()}
              >
                Disable
              </GroupButton>
              <GroupButton
                active={!ff7.gameState.fieldMovementDisabled}
                onClick={() => ff7.toggleMovement()}
              >
                Enable
              </GroupButton>
            </div>
          </Row>
          <Row label="PHS" onLabelClick={() => ff7.togglePHS(-1)}>
            <div className="join">
              <GroupButton
                active={ff7.partyMemberEnabled(0)}
                onClick={() => ff7.togglePHS(0)}
              >
                Cloud
              </GroupButton>
              <GroupButton
                active={ff7.partyMemberEnabled(1)}
                onClick={() => ff7.togglePHS(1)}
              >
                Barret
              </GroupButton>
              <GroupButton
                active={ff7.partyMemberEnabled(2)}
                onClick={() => ff7.togglePHS(2)}
              >
                Tifa
              </GroupButton>
              <GroupButton
                active={ff7.partyMemberEnabled(3)}
                onClick={() => ff7.togglePHS(3)}
              >
                Aeris
              </GroupButton>
              <GroupButton
                active={ff7.partyMemberEnabled(4)}
                onClick={() => ff7.togglePHS(4)}
              >
                Red
              </GroupButton>
            </div>
            <div className="join">
              <GroupButton
                active={ff7.partyMemberEnabled(5)}
                onClick={() => ff7.togglePHS(5)}
              >
                Yuffie
              </GroupButton>
              <GroupButton
                active={ff7.partyMemberEnabled(6)}
                onClick={() => ff7.togglePHS(6)}
              >
                Cait Sith
              </GroupButton>
              <GroupButton
                active={ff7.partyMemberEnabled(7)}
                onClick={() => ff7.togglePHS(7)}
              >
                Vincent
              </GroupButton>
              <GroupButton
                active={ff7.partyMemberEnabled(8)}
                onClick={() => ff7.togglePHS(8)}
              >
                Cid
              </GroupButton>
            </div>
          </Row>
          <Row
            label="Menu Visibility"
            onLabelClick={() => ff7.toggleMenuVisibility(-1)}
          >
            <div className="join">
              <GroupButton
                active={ff7.menuVisibilityEnabled(0)}
                onClick={() => ff7.toggleMenuVisibility(0)}
              >
                Item
              </GroupButton>
              <GroupButton
                active={ff7.menuVisibilityEnabled(1)}
                onClick={() => ff7.toggleMenuVisibility(1)}
              >
                Magic
              </GroupButton>
              <GroupButton
                active={ff7.menuVisibilityEnabled(2)}
                onClick={() => ff7.toggleMenuVisibility(2)}
              >
                Materia
              </GroupButton>
              <GroupButton
                active={ff7.menuVisibilityEnabled(3)}
                onClick={() => ff7.toggleMenuVisibility(3)}
              >
                Equip
              </GroupButton>
              <GroupButton
                active={ff7.menuVisibilityEnabled(4)}
                onClick={() => ff7.toggleMenuVisibility(4)}
              >
                Status
              </GroupButton>
            </div>
            <div className="join">
              <GroupButton
                active={ff7.menuVisibilityEnabled(5)}
                onClick={() => ff7.toggleMenuVisibility(5)}
              >
                Order
              </GroupButton>
              <GroupButton
                active={ff7.menuVisibilityEnabled(6)}
                onClick={() => ff7.toggleMenuVisibility(6)}
              >
                Limit
              </GroupButton>
              <GroupButton
                active={ff7.menuVisibilityEnabled(7)}
                onClick={() => ff7.toggleMenuVisibility(7)}
              >
                Config
              </GroupButton>
              <GroupButton
                active={ff7.menuVisibilityEnabled(8)}
                onClick={() => ff7.toggleMenuVisibility(8)}
              >
                PHS
              </GroupButton>
              <GroupButton
                active={ff7.menuVisibilityEnabled(9)}
                onClick={() => ff7.toggleMenuVisibility(9)}
              >
                Save
              </GroupButton>
            </div>
          </Row>
          <Row label="Menu Locks" onLabelClick={() => ff7.toggleMenuLock(-1)}>
            <div className="join">
              <GroupButton
                active={ff7.menuLockEnabled(0)}
                onClick={() => ff7.toggleMenuLock(0)}
              >
                Item
              </GroupButton>
              <GroupButton
                active={ff7.menuLockEnabled(1)}
                onClick={() => ff7.toggleMenuLock(1)}
              >
                Magic
              </GroupButton>
              <GroupButton
                active={ff7.menuLockEnabled(2)}
                onClick={() => ff7.toggleMenuLock(2)}
              >
                Materia
              </GroupButton>
              <GroupButton
                active={ff7.menuLockEnabled(3)}
                onClick={() => ff7.toggleMenuLock(3)}
              >
                Equip
              </GroupButton>
              <GroupButton
                active={ff7.menuLockEnabled(4)}
                onClick={() => ff7.toggleMenuLock(4)}
              >
                Status
              </GroupButton>
            </div>
            <div className="join">
              <GroupButton
                active={ff7.menuLockEnabled(5)}
                onClick={() => ff7.toggleMenuLock(5)}
              >
                Order
              </GroupButton>
              <GroupButton
                active={ff7.menuLockEnabled(6)}
                onClick={() => ff7.toggleMenuLock(6)}
              >
                Limit
              </GroupButton>
              <GroupButton
                active={ff7.menuLockEnabled(7)}
                onClick={() => ff7.toggleMenuLock(7)}
              >
                Config
              </GroupButton>
              <GroupButton
                active={ff7.menuLockEnabled(8)}
                onClick={() => ff7.toggleMenuLock(8)}
              >
                PHS
              </GroupButton>
              <GroupButton
                active={ff7.menuLockEnabled(9)}
                onClick={() => ff7.toggleMenuLock(9)}
              >
                Save
              </GroupButton>
            </div>
          </Row>
        </div>

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

        <dialog id="alert_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg mb-2 mt-0">
              {alertTitle}
            </h3>
            <div className="w-full mb-4">
              <p className="text-sm">{alertText}</p>
            </div>
            <div className="flex gap-2 w-full">
              <form method="dialog">
                <button
                  className="btn btn-primary btn-sm w-full"
                >
                  OK
                </button>
              </form>
            </div>
          </div>
        </dialog>

        <dialog id="edit_info_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg mb-2 mt-0">
              {editInfoModalTitle}
            </h3>
            <input
              id="edit-input-id"
              className="p-2 w-full mb-2"
              placeholder="Enter a value"
              value={editInfoModalValue}
              onChange={(e) => setEditInfoModalValue(e.target.value)}
              onKeyUp={onEditInfoModalKeyDown}
            />
            <div className="flex gap-2 w-full">
              <button
                className="btn btn-primary btn-sm w-full"
                onClick={() => {
                  submitValue();
                }}
              >
                Save
              </button>
            </div>
          </div>
        </dialog>

        <dialog id="edit_status_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg mb-2 mt-0">
              Edit status effects
            </h3>
            <div className="grid grid-cols-3 gap-1">
              {Object.keys(statuses).map((status) => {
                if (currentAllyEditing === null) {
                  return null;
                }

                const statusId = statuses[status as keyof typeof statuses];
                const currentStatus = actorIdx !== null && currentAllyEditing !== null ? actors[actorIdx].status : 0;
                const currentStatusState = currentStatus & statusId;

                if ([statuses.DualDrain, statuses.Imprisoned].includes(statusId)) {
                  return null;
                }

                return (
                <div
                  key={status}
                  className="h-8 flex items-center justify-center"
                >
                  <button
                    className={"btn btn-sm w-full " + (currentStatusState ? "btn-primary" : "btn-outline")}
                    onClick={() => {
                      ff7.toggleStatus(statusId, currentAllyEditing || 0);
                    }}
                  >
                    {status}
                  </button>
                </div>
              )})}
            </div>
            <h3 className="font-bold text-lg mb-2 mt-3">
              Flags
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {['Physical Immunity', 'Magical Immunity'].map((flag, flagIdx) => {
                if (currentAllyEditing === null) {
                  return null;
                }

                const currentStatus = actorIdx !== null && currentAllyEditing !== null ? actors[actorIdx].flags : 0;
                const currentStatusState = currentStatus & (flagIdx + 1);

                return (
                <div
                  key={status}
                  className="h-8 flex items-center justify-center"
                >
                  <button
                    className={"btn btn-sm w-full " + (currentStatusState ? "btn-primary" : "btn-outline")}
                    onClick={() => {
                      ff7.toggleFlags(flagIdx + 1, currentAllyEditing || 0);
                    }}
                  >
                    {flag}
                  </button>
                </div>
              )})}
            </div>
          </div>
        </dialog>

        <dialog id="enemy_info_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
                ✕
              </button>
            </form>
            {enemyData && (
            <>
              <h3 className="text-lg font-bold mb-4">Enemy info: {enemyName}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Level:</span>
                  <span className="float-right">{enemyData.level}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Speed:</span>
                  <span className="float-right">{enemyData.speed}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Strength:</span>
                  <span className="float-right">{enemyData.strength}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Defense:</span>
                  <span className="float-right">{enemyData.defense}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Magic:</span>
                  <span className="float-right">{enemyData.magic}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">M.Defense:</span>
                  <span className="float-right">{enemyData.magic_defense}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Luck:</span>
                  <span className="float-right">{enemyData.luck}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Evade:</span>
                  <span className="float-right">{enemyData.evade}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Exp:</span>
                  <span className="float-right">{enemyData.exp}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">AP:</span>
                  <span className="float-right">{enemyData.ap}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Gil:</span>
                  <span className="float-right">{enemyData.gil}</span>
                </div>
                <div className="bg-zinc-800 p-2 rounded">
                  <span className="text-zinc-400">Back atk multiplier:</span>
                  <span className="float-right">{enemyData.back_damage_multiplier}</span>
                </div>
              </div>
              <div className="bg-zinc-800 p-3 rounded mt-4">
                <h4 className="text-zinc-400 font-semibold mb-2">Elemental Effects</h4>
                <div className="grid grid-cols-1 gap-1">
                  {enemyData.elements.map((elem, index) => {
                    const elementType = getElementName(elem.element);
                    const effectType = ElementalEffect[elem.effect] || "None";
                    if (effectType === "Nothing" || elementType === "Nothing") return null;
                    return (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-zinc-300">{elementType}:</span>
                        <span className={`${
                          effectType === "Absorb" ? "text-green-400" :
                          effectType === "Nullify" ? "text-blue-400" :
                          effectType === "HalfDamage" ? "text-yellow-400" :
                          effectType === "DoubleDamage" ? "text-red-400" :
                          effectType === "Death" ? "text-purple-400" :
                          effectType === "FullCure" ? "text-emerald-400" :
                          "text-zinc-400"
                        }`}>{effectType}</span>
                      </div>
                    );
                  })}
                  {!enemyData.elements.find(elem => elem.element !== 0xFF) && <span className="text-zinc-400">None</span>}
                </div>
              </div>
              <div className="bg-zinc-800 p-3 rounded mt-4">
                <h4 className="text-zinc-400 font-semibold mb-2">Status Immunities</h4>
                <div className="text-sm">
                  {formatStatus(enemyData.status_immunities ^ 0xFFFFFFFF, 0) || <span className="text-zinc-400">None</span>}
                </div>
              </div>
              <div className="bg-zinc-800 p-3 rounded mt-4">
                <h4 className="text-zinc-400 font-semibold mb-2">Items</h4>
                <div className="grid grid-cols-1 gap-1">
                  {enemyData.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-zinc-300">{item.name}</span>
                      <span className={`${item.item_type === 0 ? "text-yellow-400" : "text-blue-400"}`}>{item.item_type} ({item.rate + 1} / 64 = {Math.round((item.rate + 1) / 64 * 100)}%)
                      </span>
                    </div>
                  ))}
                  {enemyData.morph && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-300">{enemyData.morph}</span>
                      <span className="text-yellow-400">Morph</span>
                    </div>
                  )}
                  {(!enemyData.items || enemyData.items.length === 0) && <span className="text-zinc-400">None</span>}
                </div>
              </div>
            </>
            )}
          </div>
        </dialog>
      </div>
    </div>
  );
}

export default Home;