import React from 'react';
import { useBattleLog, BattleLogItem } from '@/hooks/useBattleLog';
import { useFF7Context, ItemData } from '@/FF7Context';
import { cn } from '@/lib/utils';
import { BattleCharObj } from '@/types';

interface BattleLogItemProps {
  log: BattleLogItem;
}

const getCommandVerb = (commandId: number): string => {
  switch (commandId) {
    case 0x02: return 'cast';
    case 0x03: return 'summoned';
    case 0x04: return 'used a';
    case 0x23: return 'was damaged by';
    default: return 'used';
  }
};

const commandHasTargets = (commandId: number): boolean => {
  return ![0x12, 0x13].includes(commandId);
};

const commandDealsDamage = (commandId: number, parameter: number, itemData: ItemData[] | undefined): boolean => {
  if ([0x12, 0x13, 0x05, 0x06, 0x0B].includes(commandId)) {
    return false;
  }
  if (commandId === 0x04) { // Item
    if (!itemData) return false;
    const data = itemData[parameter];
    if (!data) {
      console.warn(`Item data for ID ${parameter} not found.`);
      return false;
    }
    return data.power > 0 && data.damage_func !== 0;
  }
  return true;
};

// Helper function to get suffixed enemy name
const getSuffixedEnemyName = (index: number, enemies: (BattleCharObj | undefined)[]): string | undefined => {
  const enemy = enemies[index];
  if (!enemy?.name) return undefined;

  const baseName = enemy.name;
  const sameNameIndices: number[] = [];
  enemies.forEach((e, i) => {
    if (e?.name === baseName) {
      sameNameIndices.push(i);
    }
  });

  if (sameNameIndices.length > 1) {
    const position = sameNameIndices.indexOf(index);
    if (position !== -1) {
      return `${baseName} ${String.fromCharCode(65 + position)}`; // 65 is ASCII for 'A'
    }
  }
  
  return baseName; // Return base name if only one or position not found (shouldn't happen)
};

// Format timestamp to HH:mm:ss
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toTimeString().split(' ')[0];
};

export const BattleLogRow: React.FC<BattleLogItemProps> = ({ log }) => {
  const { formatCommand, isLoadingNames, getDamageType, isRestorative } = useBattleLog();
  const { gameState, gameData } = useFF7Context();
  
  // Check for essential log data
  if (log.timestamp === undefined) {
    console.warn("BattleLogItem missing timestamp:", log);
    return null; // Don't render logs without a timestamp
  }
  const formattedTime = formatTimestamp(log.timestamp);

  // 1. Status Change Event
  if (log.changedStatuses && log.targetCharacterIndex !== undefined) {
    const targetIndex = log.targetCharacterIndex;
    const targetName = targetIndex < 4
      ? gameState.battleAllies[targetIndex]?.name
      : getSuffixedEnemyName(targetIndex - 4, gameState.battleEnemies);

    if (!targetName) {
      console.warn("Could not find target name for status change log:", log);
      return null;
    }

    // Separate inflicted and cleared statuses
    const inflictedStatuses = log.changedStatuses
      .filter(change => change.inflicted)
      .map(change => change.statusId);
    const clearedStatuses = log.changedStatuses
      .filter(change => !change.inflicted)
      .map(change => change.statusId);

    return (
      <div className="flex flex-col">
        <div className={cn("bg-zinc-800 p-1 px-2 my-1 text-sm font-normal text-slate-300")}>
          <div className="text-[9px] text-slate-500">{formattedTime}</div>
          <span className="text-blue-400 font-medium">{targetName.trim()}</span>

          {/* Render Inflicted Statuses */}
          {inflictedStatuses.length > 0 && (
            <span className="ml-1">
              {inflictedStatuses.length === 1 && inflictedStatuses[0] === "Dead" ? (
                <span className="text-red-500 font-medium">died</span>
              ) : (
                <>
                  <span className="text-slate-400">inflicted with </span>
                  <span className="text-orange-400 font-medium">
                    {inflictedStatuses.join(', ')}
                  </span>
                </>
              )}
            </span>
          )}

          {/* Add separator if both inflicted and cleared exist */}
          {inflictedStatuses.length > 0 && clearedStatuses.length > 0 && (
            <span className="text-slate-400">,</span>
          )}

          {/* Render Cleared Statuses */}
          {clearedStatuses.length > 0 && (
            <span className="ml-1">
              <span className="text-slate-400">cleared of </span>
              <span className="text-green-400 font-medium">
                {clearedStatuses.join(', ')}
              </span>
            </span>
          )}
        </div>
      </div>
    );
  }

  // 2. Command Event
  else if (log.commandId !== undefined && log.parameter !== undefined && log.attacker !== undefined && log.targetMask !== undefined) {
    // Determine attacker name
    const attackerName = log.attacker < 4 
      ? gameState.battleAllies[log.attacker]?.name 
      : getSuffixedEnemyName(log.attacker - 4, gameState.battleEnemies);

    // Determine target names with suffix logic for enemies
    const targetNames: string[] = [];
    if (commandHasTargets(log.commandId)) {
      for (let i = 0; i < 10; i++) {
        if ((log.targetMask & (1 << i)) !== 0) {
          const name = i < 4 
            ? gameState.battleAllies[i]?.name 
            : getSuffixedEnemyName(i - 4, gameState.battleEnemies);
          if (name) targetNames.push(name);
        }
      }
    }

    const verb = getCommandVerb(log.commandId);
    const command = formatCommand(log.commandId, log.parameter);

    let displayTargets = '';
    if (commandHasTargets(log.commandId)) {
      if (targetNames.length === 1) {
        displayTargets = targetNames[0];
      } else if (targetNames.length > 1) {
        let allAllies = true;
        let allEnemies = true;
        let hasTargets = false;

        for (let i = 0; i < 8; i++) {
          if ((log.targetMask & (1 << i)) !== 0) {
            hasTargets = true;
            if (i < 4) {
              allEnemies = false; // Found an ally target
            } else {
              allAllies = false; // Found an enemy target
            }
          }
        }

        if (hasTargets && allAllies) {
          displayTargets = "All Allies";
        } else if (hasTargets && allEnemies) {
          displayTargets = "All Enemies";
        } else {
          // Fallback for unexpected cases (e.g., mixed targets or empty mask despite targetNames > 1)
          displayTargets = targetNames.join(' and '); 
        }
      }
    }

    const damageAbs = log.damage !== undefined ? Math.abs(log.damage) : 0;

    const showTargets = commandHasTargets(log.commandId) && displayTargets.length > 0;
    // Ensure commandId, parameter are defined before calling damage/restorative checks
    const canCheckDamage = log.commandId !== undefined && log.parameter !== undefined;
    const showDamage = !isLoadingNames && canCheckDamage && commandDealsDamage(log.commandId, log.parameter, gameData?.itemData);
    const damageType = showDamage ? getDamageType(log.commandId, log.parameter) : 'HP';
    const isActuallyRestorative = showDamage && isRestorative(log.commandId, log.parameter);

    const displayedCommand = isLoadingNames ? "Loading..." : command;

    return (
      <div className="flex flex-col">
        <div className={cn(
          "bg-zinc-800 p-1 px-2 my-1 text-sm font-normal",
          isActuallyRestorative && showDamage ? "text-emerald-400" : "text-slate-200"
        )}>
          <div className="text-[9px] text-slate-500">{formattedTime}</div>
          {attackerName && (
            <span className="text-blue-400 font-medium">{attackerName}</span>
          )}
          {attackerName && <span className="text-slate-400"> {verb} </span>}
          <span className="text-purple-400 font-medium">{displayedCommand}</span>
          {showTargets && (
            <>
              <span className="text-slate-400"> on </span>
              <span className="text-blue-400 font-medium">{displayTargets.trim()}</span>
            </>
          )}
          {showDamage && (
            log.miss ? (
              <span className="text-slate-400">, but missed</span>
            ) : (
              <>
                <span className="text-slate-400">, </span>
                <span className="text-slate-300">
                  {isActuallyRestorative ? 'restoring' : 'dealing'}
                </span>
                <span className={cn(
                  "font-bold",
                  isActuallyRestorative ? "text-emerald-400" : "text-red-400"
                )}> {damageAbs}</span>
                <span className="text-slate-300"> {damageType}</span>
                {log.crit && <span className="text-yellow-400 font-semibold"> [critical hit]</span>}
              </>
            )
          )}
        </div>
      </div>
    );
  }

  // 3. Other/Unknown Event Type
  else {
    return (
      <div className="flex flex-col">
        <div className="bg-zinc-800 p-1 px-2 my-1 text-sm font-normal text-slate-300">
          <div className="text-[9px] text-slate-500">{formattedTime}</div>
          <span>Unknown Event: {JSON.stringify(log)}</span> {/* Placeholder */}
        </div>
      </div>
    );
  }
};
