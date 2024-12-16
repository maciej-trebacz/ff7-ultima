import Row from "@/components/Row";
import { statuses } from "@/ff7Statuses";
import { BattleCharObj, ElementalEffect, EnemyData } from "@/types";
import { FF7 } from "@/useFF7";
import { formatStatus, getElementName } from "@/util";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { EditModal } from "@/components/EditModal";

export function Battle(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;

  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [editInfoModalValue, setEditInfoModalValue] = useState("");
  const [editInfoModalTitle, setEditInfoModalTitle] = useState("");
  const [currentAllyEditing, setCurrentAllyEditing] = useState<number | null>(null);
  const [editStatusModalOpen, setEditStatusModalOpen] = useState(false);
  const [isEnemyInfoModalOpen, setIsEnemyInfoModalOpen] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<number | null>(null);
  const [enemyData, setEnemyData] = useState<EnemyData | null>(null);
  const [enemyName, setEnemyName] = useState<string>("");

  const parseEnemyName = (enemy: BattleCharObj) => {
    const enemies = ff7.gameState.battleEnemies.filter(e => e.name === enemy.name);
    if (enemies.length === 1) {
      return enemy.name;
    } else {

      // Return name with a letter suffix at the end, eg. "Enemy A", "Enemy B", etc.
      return enemy.name + " " + String.fromCharCode(65 + enemies.indexOf(enemy));
    }
  }

  const openEditInfoModal = (title: string, value: string) => {
    setEditInfoModalValue(value);
    setEditInfoModalTitle(title);
    setEditInfoModalOpen(true);
  }

  const submitInfoValue = () => {
    if (currentAllyEditing !== null) {
      if (editInfoModalTitle === "HP") {
        ff7.setHP(parseInt(editInfoModalValue), currentAllyEditing);
      } else if (editInfoModalTitle === "MP") {
        ff7.setMP(parseInt(editInfoModalValue), currentAllyEditing);
      }
    }
    setEditInfoModalOpen(false);
  }

  const openEditStatusModal = () => {
    setEditStatusModalOpen(true);
  };

  const showEnemyInfoModal = async (sceneId: number, name: string) => {
    const data = await ff7.readEnemyData(sceneId);
    setEnemyData(data);
    setEnemyName(name);
    setSelectedEnemy(sceneId);
    setIsEnemyInfoModalOpen(true);
  }

  const actors = currentAllyEditing !== null && currentAllyEditing > 3 ? ff7.gameState.battleEnemies : ff7.gameState.battleAllies;
  const actorIdx = currentAllyEditing !== null && currentAllyEditing > 3 ? currentAllyEditing - 4 : currentAllyEditing;

  return (
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
                  <td className="p-1 text-nowrap w-14 font-bold">
                    {char.name}
                    <div className="w-full h-0">
                      <progress
                        className="progress w-full h-[2px] top-[-10px]"
                        value={(char.atb / 0xFFFF) * 100}
                        max="100"
                      ></progress>
                    </div>
                  </td>
                  <td className="p-1 cursor-pointer px-2 text-nowrap" onClick={() => { setCurrentAllyEditing(index); openEditInfoModal("HP", char.hp + "") }}>{char.hp} / {char.max_hp}</td>
                  <td className="p-1 cursor-pointer px-2 text-nowrap" onClick={() => { setCurrentAllyEditing(index); openEditInfoModal("MP", char.mp + "") }}>{char.mp} / {char.max_mp}</td>
                  <td className="p-1 cursor-pointer" onClick={() => { setCurrentAllyEditing(index); openEditStatusModal(); }}>{formatStatus(char.status, char.flags) || <span className="text-zinc-400">[None]</span>}</td>
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
                  <td className="p-1 text-nowrap w-14 font-bold cursor-pointer hover:text-blue-300" onClick={() => { showEnemyInfoModal(char.scene_id, char.name) }}>
                    {parseEnemyName(char)}
                    <div className="w-full h-0">
                      <progress
                        className="progress w-full h-[2px] top-[-10px]"
                        value={(char.atb / 0xFFFF) * 100}
                        max="100"
                      ></progress>
                    </div>
                  </td>
                  <td className="p-1 cursor-pointer px-2 text-nowrap" onClick={() => { setCurrentAllyEditing(index + 4); openEditInfoModal("HP", char.hp + "") }}>{char.hp} / {char.max_hp}</td>
                  <td className="p-1 cursor-pointer px-2 text-nowrap" onClick={() => { setCurrentAllyEditing(index + 4); openEditInfoModal("MP", char.mp + "") }}>{char.mp} / {char.max_mp}</td>
                  <td className="p-1 cursor-pointer" onClick={() => { setCurrentAllyEditing(index + 4); openEditStatusModal(); }}>{formatStatus(char.status, char.flags) || <span className="text-zinc-400">[None]</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <EditModal
        open={editInfoModalOpen}
        setIsOpen={setEditInfoModalOpen}
        value={editInfoModalValue}
        setValue={setEditInfoModalValue}
        title={editInfoModalTitle}
        buttonText="Save"
        onSubmit={submitInfoValue}
      />

      <Modal
        open={editStatusModalOpen}
        setIsOpen={setEditStatusModalOpen}
        title="Edit status effects"
        buttonText="Close"
        callback={() => setEditStatusModalOpen(false)}
      >
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
            )
          })}
        </div>
        <h3 className="font-bold text-lg mb-2 mt-3">
          Flags
        </h3>
        <div className="grid grid-cols-2 gap-1 mb-2">
            {['Physical Immunity', 'Magical Immunity'].map((flag, flagIdx) => {
              if (currentAllyEditing === null) {
                return null;
              }
        
              const currentStatus = actorIdx !== null && currentAllyEditing !== null ? actors[actorIdx].flags : 0;
              const currentStatusState = currentStatus & (flagIdx + 1);            

            return (
              <div
                key={flag}
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
            )
          })}
        </div>
      </Modal>

      <Modal
        open={isEnemyInfoModalOpen}
        setIsOpen={setIsEnemyInfoModalOpen}
        title={`Enemy info: ${enemyName}`}
        buttonText="Close"
        callback={() => setIsEnemyInfoModalOpen(false)}
      >
        {enemyData && (
          <>
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
                      <span className={`${effectType === "Absorb" ? "text-green-400" :
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
      </Modal>
    </div>
  );
}
