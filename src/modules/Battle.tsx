import Row from "@/components/Row";
import { BattleLogRow } from "@/components/BattleLogRow";
import { statuses } from "@/ff7Statuses";
import { BattleCharObj, ChocoboRating, ElementalEffect, EnemyData, GameModule } from "@/types";
import { FF7 } from "@/useFF7";
import { formatStatus, getElementName } from "@/util";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { EditPopover } from "@/components/EditPopover";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { EnemyInfoModal } from "@/components/modals/EnemyInfoModal";
import { BattleLogModal } from "@/components/modals/BattleLogModal";
import { useSettings } from "@/useSettings";
import { useBattleLog } from "@/hooks/useBattleLog";

export function Battle(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;
  const { logs, formatCommand } = useBattleLog();
  const { generalSettings, hackSettings, updateHackSettings } = useSettings();

  const [editValue, setEditValue] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentAllyEditing, setCurrentAllyEditing] = useState<number | null>(null);
  const [editStatusModalOpen, setEditStatusModalOpen] = useState(false);
  const [isEnemyInfoModalOpen, setIsEnemyInfoModalOpen] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<number | null>(null);
  const [enemyData, setEnemyData] = useState<EnemyData | null>(null);
  const [enemyName, setEnemyName] = useState<string>("");
  const [isBattleLogModalOpen, setIsBattleLogModalOpen] = useState(false);

  const toggleInvincibility = () => {
    const newValue = !ff7.gameState.invincibilityEnabled;
    newValue ? ff7.enableInvincibility() : ff7.disableInvincibility();
    if (generalSettings?.rememberedHacks.invincibility) {
      updateHackSettings({
        ...(hackSettings || {}),
        invincibility: newValue,
      });
    }
  };

  const toggleInstantATB = () => {
    const newValue = !ff7.gameState.instantATBEnabled;
    newValue ? ff7.enableInstantATB() : ff7.disableInstantATB();
    if (generalSettings?.rememberedHacks.instantATB) {
      updateHackSettings({
        ...(hackSettings || {}),
        instantATB: newValue,
      });
    }
  };

  const toggleManualSlots = () => {
    const newValue = !ff7.gameState.manualSlotsEnabled;
    newValue ? ff7.enableManualSlots() : ff7.disableManualSlots();
    if (generalSettings?.rememberedHacks.manualSlots) {
      updateHackSettings({
        ...(hackSettings || {}),
        manualSlots: newValue,
      });
    }
  };

  const setExpMultiplier = (multiplier: number) => {
    ff7.setExpMultiplier(multiplier);
    if (generalSettings?.rememberedHacks.expMultiplier) {
      updateHackSettings({ ...hackSettings, expMultiplier: multiplier });
    }
  };

  const setGilMultiplier = (multiplier: number) => {
    ff7.setGilMultiplier(multiplier);
    if (generalSettings?.rememberedHacks.gilMultiplier) {
      updateHackSettings({ ...hackSettings, gilMultiplier: multiplier });
    }
  };

  const setApMultiplier = (multiplier: number) => {
    ff7.setApMultiplier(multiplier);
    if (generalSettings?.rememberedHacks.apMultiplier) {
      updateHackSettings({ ...hackSettings, apMultiplier: multiplier });
    }
  };
  
  const parseEnemyName = (enemy: BattleCharObj) => {
    const enemies = ff7.gameState.battleEnemies.filter(e => e.name === enemy.name);
    if (enemies.length === 1) {
      return enemy.name;
    } else {

      // Return name with a letter suffix at the end, eg. "Enemy A", "Enemy B", etc.
      return enemy.name + " " + String.fromCharCode(65 + enemies.indexOf(enemy));
    }
  }

  const openEditPopover = (title: string, value: string, allyIndex: number) => {
    setEditValue(value);
    setEditTitle(title);
    setCurrentAllyEditing(allyIndex);
    setPopoverOpen(true);
  }

  const submitValue = () => {
    if (currentAllyEditing !== null) {
      if (editTitle === "HP") {
        ff7.setHP(parseInt(editValue), currentAllyEditing);
      } else if (editTitle === "MP") {
        ff7.setMP(parseInt(editValue), currentAllyEditing);
      } else if (editTitle === "Max HP") {
        ff7.setMaxHP(parseInt(editValue), currentAllyEditing);
      } else if (editTitle === "Max MP") {
        ff7.setMaxMP(parseInt(editValue), currentAllyEditing);
      }
    }
    setPopoverOpen(false);
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

  const killCharacter = (index: number) => {
    ff7.setStatus(statuses.Dead, index);
    ff7.setHP(0, index);
  }

  const enemies = ff7.gameState.battleEnemies.sort((a, b) => a.scene_id - b.scene_id) || [];
  const actors = currentAllyEditing !== null && currentAllyEditing > 3 ? ff7.gameState.battleEnemies : ff7.gameState.battleAllies;
  const actorIdx = currentAllyEditing !== null && currentAllyEditing > 3 ? currentAllyEditing - 4 : currentAllyEditing;

  const allies: (BattleCharObj | null)[] = ff7.gameState.battleAllies
  if (allies.length < 3) {
    for (let i = 0; i < 3 - allies.length; i++) {
      allies.push(null);
    }
  }


  return (
    <div>
      <div className="flex-1">
        <Row label="Scene ID">
          {state.battleId > 0 && state.battleId < 0xffff
            ? state.battleId
            : "-"}

        </Row>
      </div>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="Invincibility">
            <Switch checked={ff7.gameState.invincibilityEnabled} onClick={toggleInvincibility} />
          </Row>
        </div>
        <div className="flex-1">
          <Row label="Instant ATB">
            <Switch checked={ff7.gameState.instantATBEnabled} onClick={toggleInstantATB} />
          </Row>
        </div>
        <div className="flex-1">
          <Row label={
            <div className="flex items-center gap-1">
              <span>Manual Slots</span>
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <Info size={14} className="cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Stops the slot reels and allows adjusting them with arrow keys (gamepad not supported)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          } className="flex items-center">
            <Switch checked={ff7.gameState.manualSlotsEnabled} onClick={toggleManualSlots} />
          </Row>
        </div>
      </div>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="EXP Multiplier">
            <Select value={'' + ff7.gameState.expMultiplier} onValueChange={(value) => setExpMultiplier(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </div>
        <div className="flex-1">
          <Row label="AP Multiplier">
            <Select value={'' + ff7.gameState.apMultiplier} onValueChange={(value) => setApMultiplier(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </div>
        <div className="flex-1">
          <Row label="Gil Multiplier">
            <Select value={'' + ff7.gameState.gilMultiplier} onValueChange={(value) => setGilMultiplier(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </div>        
      </div>

      <h4 className="text-center mt-2 mb-1 font-medium">Allies</h4>
      <table className="w-full">
        <thead className="bg-zinc-800 text-xs text-left">
          <tr>
            <th className="p-2 pb-1 w-[130px]">Name</th>
            <th className="p-1 px-2 w-[100px]">HP</th>
            <th className="p-1 px-2 w-[66px]">MP</th>
            <th className="p-1">Status</th>
            <th className="px-1 w-7">&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {allies.map((char, index) => {
            if (!char?.name.trim()) return (
              <tr key={index} className="bg-zinc-800 text-xs group">
                <td className="p-1 pl-2 text-nowrap w-[130px] text-zinc-500 group-last:pb-2">
                  [Empty]
                </td>
                <td className="p-1 px-2">-</td>
                <td className="p-1 px-2">-</td>
                <td className="p-1 px-2">-</td>
                <td></td>
              </tr>
            )
            return (
              <tr key={index} className="bg-zinc-800 text-xs group">
                <td className="p-1 pl-2 text-nowrap w-[130px] font-bold group-last:pb-2">
                  {char.name}
                  <div className="w-full h-0 relative top-[-10px]">
                    <progress
                      className="progress w-full h-[2px] [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-gray-700 [&::-webkit-progress-value]:bg-gray-200"
                      value={(char.atb / 0xFFFF) * 100}
                      max="100"
                    ></progress>
                  </div>
                </td>
                <td className="p-1 px-2 text-nowrap w-[100px]">
                  <div className="flex gap-1">
                    <EditPopover
                      open={popoverOpen && currentAllyEditing === index && editTitle === "HP"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer hover:bg-zinc-700 px-1" onClick={() => openEditPopover("HP", char.hp.toString(), index)}>
                              {char.hp}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit current HP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                    <span>/</span>
                    <EditPopover
                      open={popoverOpen && currentAllyEditing === index && editTitle === "Max HP"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer hover:bg-zinc-700 px-1" onClick={() => openEditPopover("Max HP", char.max_hp.toString(), index)}>
                              {char.max_hp}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit max HP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                  </div>
                </td>
                <td className="p-1 px-2 text-nowrap w-[66px]">
                  <div className="flex gap-1">
                    <EditPopover
                      open={popoverOpen && currentAllyEditing === index && editTitle === "MP"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer hover:bg-zinc-700 px-1" onClick={() => openEditPopover("MP", char.mp.toString(), index)}>
                              {char.mp}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit current MP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                    <span>/</span>
                    <EditPopover
                      open={popoverOpen && currentAllyEditing === index && editTitle === "Max MP"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer hover:bg-zinc-700 px-1" onClick={() => openEditPopover("Max MP", char.max_mp.toString(), index)}>
                              {char.max_mp}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit max MP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                  </div>
                </td>
                <td className="p-1 cursor-pointer whitespace-pre hover:bg-zinc-700" onClick={() => { setCurrentAllyEditing(index); openEditStatusModal(); }}>{formatStatus(char.status, char.flags, state.invincibilityEnabled) || <span className="text-zinc-400">[None]</span>}</td>
                <td className="cursor-pointer">
                  <TooltipProvider>
                    <Tooltip delayDuration={250}>
                      <TooltipTrigger asChild>
                        <span className="ml-1 cursor-pointer" onClick={(e) => { killCharacter(index); e.stopPropagation() }}>💀</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Kill ally</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h4 className="text-center mt-2 mb-1 font-medium">Enemies</h4>
      <table className="w-full">
        <thead className="bg-zinc-800 text-xs text-left">
          <tr>
            <th className="p-2 pb-1 w-[130px]">Name</th>
            <th className="p-1 px-2 w-[100px]">HP</th>
            <th className="p-1 px-2 w-[66px]">MP</th>
            <th className="p-1">Status</th>
            <th className="px-1 w-7">&nbsp;</th>
          </tr>
        </thead>
        <tbody className={ff7.gameState.currentModule === GameModule.Battle ? "" : "!text-zinc-400"}>
          {enemies.map((char, index) => {
            if (!char.name.trim()) return null;
            return (
              <tr key={index} className="bg-zinc-800 text-xs group">
                <td className="p-1 pl-2 text-nowrap w-[130px] font-bold cursor-pointer group-last:pb-2 hover:bg-zinc-700" onClick={() => { showEnemyInfoModal(char.scene_id, char.name) }}>
                  <TooltipProvider>
                    <Tooltip delayDuration={250}>
                      <TooltipTrigger asChild><div>
                        {parseEnemyName(char)}
                        {parseEnemyName(char) === "Chocobo" && <span className="font-light"> ({ChocoboRating[ff7.gameState.battleChocoboRating]})</span>}
                      </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Click to show info & stats</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="w-full h-0 relative top-[-10px]">
                    <progress
                      className="progress w-full h-[2px] [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-gray-700 [&::-webkit-progress-value]:bg-gray-200"
                      value={(char.atb / 0xFFFF) * 100}
                      max="100"
                    ></progress>
                  </div>
                </td>
                <td className="p-1 px-2 text-nowrap w-[100px]">
                  <div className="flex gap-1">
                    <EditPopover
                      open={popoverOpen && currentAllyEditing === char.index && editTitle === "HP"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer hover:bg-zinc-700 px-1" onClick={() => openEditPopover("HP", char.hp.toString(), char.index)}>
                              {char.hp}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit current HP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                    <span>/</span>
                    <EditPopover
                      open={popoverOpen && currentAllyEditing === char.index && editTitle === "Max HP"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer hover:bg-zinc-700 px-1" onClick={() => openEditPopover("Max HP", char.max_hp.toString(), char.index)}>
                              {char.max_hp}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit max HP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                  </div>
                </td>
                <td className="p-1 px-2 text-nowrap w-[66px]">
                  <div className="flex gap-1">
                    <EditPopover
                      open={popoverOpen && currentAllyEditing === char.index && editTitle === "MP"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer hover:bg-zinc-700 px-1" onClick={() => openEditPopover("MP", char.mp.toString(), char.index)}>
                              {char.mp}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit current MP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                    <span>/</span>
                    <EditPopover
                      open={popoverOpen && currentAllyEditing === char.index && editTitle === "Max MP"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer hover:bg-zinc-700 px-1" onClick={() => openEditPopover("Max MP", char.max_mp.toString(), char.index)}>
                              {char.max_mp}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit max MP</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                  </div>
                </td>
                <td className="p-1 cursor-pointer whitespace-pre hover:bg-zinc-700" onClick={() => { setCurrentAllyEditing(index + 4); openEditStatusModal(); }}>{formatStatus(char.status, char.flags) || <span className="text-zinc-400">[None]</span>}</td>
                <td className="cursor-pointer">
                  <TooltipProvider>
                    <Tooltip delayDuration={250}>
                      <TooltipTrigger asChild>
                        <span className="ml-1 cursor-pointer" onClick={(e) => { killCharacter(char.index); e.stopPropagation() }}>💀</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Kill enemy</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <Modal
        open={editStatusModalOpen}
        setIsOpen={setEditStatusModalOpen}
        title="Edit status effects"
        callback={() => setEditStatusModalOpen(false)}
      >
        <div className="grid grid-cols-4 gap-1">
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
                <Button
                  size="sm"
                  variant={currentStatusState ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    ff7.toggleStatus(statusId, currentAllyEditing || 0);
                  }}
                >
                  {status}
                </Button>
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
                <Button
                  size="sm"
                  variant={currentStatusState ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    ff7.toggleFlags(flagIdx + 1, currentAllyEditing || 0);
                  }}
                >
                  {flag}
                </Button>
              </div>
            )
          })}
        </div>
      </Modal>

      <EnemyInfoModal
        open={isEnemyInfoModalOpen}
        setIsOpen={setIsEnemyInfoModalOpen}
        enemyData={enemyData}
        enemyName={enemyName}
      />

      <BattleLogModal
        isOpen={isBattleLogModalOpen}
        setIsOpen={setIsBattleLogModalOpen}
        logs={logs}
      />

      <h4 className="text-center mt-4 mb-1 font-medium">Battle Log</h4>
      <div className="text-xs">
        {logs.slice(-3).reverse().map((log, index: number) => (
          <BattleLogRow 
            key={`${log.timestamp}-${log.queuePosition}-${log.priority}-${index}-preview`}
            log={log}
          />
        ))}
        {logs.length === 0 && (
          <div className="text-zinc-500 text-center py-1">No battle actions recorded yet</div>
        )}
        <div className="text-center mt-2">
          <Button
            variant="link"
            size="sm"
            className="text-xs h-6"
            onClick={() => setIsBattleLogModalOpen(true)}
            disabled={logs.length === 0}
          >
            Show full log
          </Button>
        </div>
      </div>
    </div>
  );
}
