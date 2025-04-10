import { DataType, readMemory, readMemoryBuffer } from '@/memory'
import { atom, useAtom } from 'jotai'
import { useFF7Context, ItemData, SpecialAttackFlags } from '@/FF7Context';
import { ElementalType } from '@/types';
import { statuses as statusEnum } from '@/ff7Statuses';

export interface StatusChange {
  statusId: keyof typeof statusEnum; 
  inflicted: boolean;
}

export interface BattleLogItem {
  attacker?: number
  targetMask?: number
  commandId?: number
  parameter?: number
  damage?: number
  queuePosition?: number
  priority?: number
  timestamp?: number
  miss?: boolean
  crit?: boolean
  targetCharacterIndex?: number
  changedStatuses?: StatusChange[]
}

export const battleLogAtom = atom<BattleLogItem[]>([])

export function useBattleLog() {
  const { addresses, gameState, gameData, isLoadingGameData } = useFF7Context();
  const [logs, setLogs] = useAtom(battleLogAtom)

  const formatCommand = (commandId: number | undefined, parameter: number | undefined): string => {
    if (commandId === undefined || parameter === undefined) {
      return "Unknown Event";
    }
    if (isLoadingGameData) {
      return "Loading names..."
    }

    const commandNames = gameData.commandNames;
    const magicNames = gameData.magicNames;
    const summonNames = gameData.summonNames;
    const itemNames = gameData.itemNames;
    const enemySkillNames = gameData.enemySkillNames;
    const enemyAttackNames = gameData.enemyAttackNames;

    const baseName = commandNames[commandId] || `Unknown Cmd ${commandId.toString(16).toUpperCase()}`;

    switch (commandId) {
      case 0x02:
        return `${magicNames[parameter] || `Unknown Magic ${parameter}`}`
      case 0x03:
        return `${summonNames[parameter] || `Unknown Summon ${parameter}`}`
      case 0x04:
        return `${itemNames[parameter] || `Unknown Item ${parameter}`}`
      case 0x0D:
        return `${baseName}: ${enemySkillNames[parameter] || `Unknown E.Skill ${parameter}`}`
      case 0x20:
        return enemyAttackNames[parameter] || `Unknown Enemy Attack ${parameter.toString(16).toUpperCase()}`;
      case 0x23:
        return "Poison"
      default:
        return baseName
    }
  }

  const addLogItem = async (item: Omit<BattleLogItem, 'timestamp' | 'damage'>) => {
    if (!addresses || (item.commandId !== undefined && item.commandId == 0xFF)) return;

    const battleObjPtr = await readMemory(addresses.battle_obj_ptr, DataType.Int);
    const battleObj: number[] = await readMemoryBuffer(battleObjPtr, 0x264);
    const battleObjDataview = new DataView(new Uint8Array(battleObj).buffer);
    const damage = battleObjDataview.getInt32(0x214, true);
    const missed = battleObjDataview.getUint8(0x218) & 1;
    const crit = battleObjDataview.getUint8(0x220) & 2;

    const newItem: BattleLogItem = {
      ...item,
      timestamp: Date.now(),
      damage,
      miss: Boolean(missed),
      crit: Boolean(crit),
    }

    setLogs(prevLogs => {
      const alreadyExists = prevLogs.some(log =>
        log.queuePosition !== undefined &&
        log.priority !== undefined &&
        newItem.queuePosition !== undefined &&
        newItem.priority !== undefined &&
        log.queuePosition === newItem.queuePosition &&
        log.priority === newItem.priority
      );

      if (alreadyExists) {
        return prevLogs;
      } else {
        console.debug(`Adding new battle log item`, newItem);
        return [...prevLogs, newItem];
      }
    });
  }

  const hasLogItem = (queuePosition: number, priority: number): boolean => {
    return logs.some(item =>
        item.queuePosition !== undefined &&
        item.priority !== undefined &&
        item.queuePosition === queuePosition &&
        item.priority === priority
    )
  }

  const getDamageType = (commandId: number | undefined, parameter: number | undefined): 'HP' | 'MP' => {
    if (commandId === undefined || parameter === undefined || isLoadingGameData || !gameData?.itemData) {
        return 'HP'; // Default if data is missing or loading
    }
    if (commandId === 0x04) {
      const data = gameData.itemData[parameter];
      if (data && (data.special_attack_flags & SpecialAttackFlags.DamageMP)) {
        return 'MP';
      }
    }
    return 'HP';
  };

  const isRestorative = (commandId: number | undefined, parameter: number | undefined): boolean => {
    if (commandId === undefined || parameter === undefined || isLoadingGameData || !gameData?.itemData) {
        return false; // Default if data is missing or loading
    }
    if (commandId === 0x04) {
      const data = gameData.itemData[parameter];
      return data ? (data.attack_element & (1 << ElementalType.Restorative)) !== 0 : false;
    }
    return false;
  };

  const addStatusChangeItem = (targetCharacterIndex: number, changes: StatusChange[]) => {
    if (changes.length === 0) return; // Don't add log if no changes

    const newItem: BattleLogItem = {
      targetCharacterIndex,
      changedStatuses: changes,
      timestamp: Date.now(),
    };

    console.debug(`Adding status change log item`, newItem);
    setLogs(prevLogs => [...prevLogs, newItem]);
  };

  const clearLogs = () => {
    setLogs([])
  }

  return {
    logs,
    addLogItem,
    hasLogItem,
    formatCommand,
    getDamageType,
    isRestorative,
    addStatusChangeItem,
    isLoadingNames: isLoadingGameData,
    clearLogs
  }
} 