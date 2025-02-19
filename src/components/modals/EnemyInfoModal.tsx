import { Modal } from "@/components/Modal";
import { EnemyData, ElementalEffect } from "@/types";
import { formatStatus, getElementName } from "@/util";

interface EnemyInfoModalProps {
  open: boolean;
  setIsOpen: (open: boolean) => void;
  enemyData: EnemyData | null;
  enemyName: string;
}

export function EnemyInfoModal({ open, setIsOpen, enemyData, enemyName }: EnemyInfoModalProps) {
  return (
    <Modal
      open={open}
      setIsOpen={setIsOpen}
      title={`Enemy info: ${enemyName}`}
      size="lg"
      callback={() => setIsOpen(false)}
    >
      {enemyData && (
        <div className="max-h-[450px] overflow-y-auto">
          <div className="grid grid-cols-4 gap-2 text-sm mb-2">
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
              <span className="text-zinc-400">Back atk:</span>
              <span className="float-right">{enemyData.back_damage_multiplier}x</span>
            </div>
          </div>
          <div className="bg-zinc-800 p-3 rounded mb-2">
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
          <div className="bg-zinc-800 p-3 rounded mb-2">
            <h4 className="text-zinc-400 font-semibold mb-2">Status Immunities</h4>
            <div className="text-sm">
              {formatStatus(enemyData.status_immunities ^ 0xFFFFFFFF, 0, false, true) || <span className="text-zinc-400">None</span>}
            </div>
          </div>
          <div className="bg-zinc-800 p-3 rounded">
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
        </div>
      )}
    </Modal>
  );
} 