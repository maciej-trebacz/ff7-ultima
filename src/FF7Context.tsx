import React, { useEffect, useState, useContext, createContext, ReactNode, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFF7Addresses, FF7Addresses } from './ff7Addresses';
import { GameModule, FieldModel, BattleCharObj, WorldModel, RandomEncounters, PartyMember, FieldLine, ElementalType, BattleScene, ChocoboData } from "./types";
import { DataType, readMemory } from "./memory";
import { StatusChange, BattleLogItem } from '@/hooks/useBattleLog';
import { statuses as statusEnum } from '@/ff7Statuses';
import { useSetAtom } from 'jotai';
import { battleLogAtom } from '@/hooks/useBattleLog';
import { readFile } from "@tauri-apps/plugin-fs"

export enum SpecialAttackFlags {
  DamageMP = 1,
  Unknown_2 = 2,
  AffectedByDarkness = 4,
  DrainsSomeHP = 0x10,
  DrainsSomeHPMP = 0x20,
}

export interface ItemData {
  camera_move_id: number
  restriction_mask: number
  target_flags: number
  attack_effect_id: number
  damage_func: number
  power: number
  condition: number
  status_effect_change: number
  attack_additional_effect: number
  additional_effect_modifier: number
  status_effects: number
  attack_element: number
  special_attack_flags: number
}

interface GameDataType {
  commandNames: string[];
  magicNames: string[];
  summonNames: string[];
  enemySkillNames: string[];
  enemyAttackNames: string[];
  itemData: ItemData[];
  itemNames: string[];
  materiaNames: string[];
  battleScenes: BattleScene[];
}

// Default state for game data
const defaultGameData: GameDataType = {
  commandNames: [],
  magicNames: [],
  summonNames: [],
  enemySkillNames: [],
  enemyAttackNames: [],
  itemData: [],
  itemNames: [],
  materiaNames: [],
  battleScenes: [],
};

// Default state for game state
const defaultGameState = {
  currentModule: 0,
  gameMoment: 0,
  fieldId: 0,
  fieldName: '',
  fieldFps: 0,
  battleFps: 0,
  worldFps: 0,
  inGameTime: 0,
  discId: 0,
  menuVisibility: 0,
  menuLocks: 0,
  fieldMovementDisabled: 0,
  fieldMenuAccessEnabled: 0,
  fieldSkipDialoguesEnabled: false,
  partyLockingBitmask: 0,
  partyVisibilityBitmask: 0,
  gil: 0,
  gp: 0,
  battleCount: 0,
  battleEscapeCount: 0,
  battlesDisabled: false,
  maxBattlesEnabled: false,
  gameObjPtr: 0,
  battleSwirlDisabled: false,
  instantATBEnabled: false,
  manualSlotsEnabled: false,
  slotsActive: 0,
  fieldCurrentModelId: 0,
  fieldModels: [] as FieldModel[],
  battleAllies: [] as BattleCharObj[],
  battleEnemies: [] as BattleCharObj[],
  speed: '',
  unfocusPatchEnabled: false,
  isFFnx: false,
  stepId: 0,
  stepOffset: 0,
  stepFraction: 0,
  dangerValue: 0,
  formationIndex: 0,
  battleId: 0,
  invincibilityEnabled: false,
  worldCurrentModel: {} as WorldModel,
  expMultiplier: 1,
  apMultiplier: 1,
  gilMultiplier: 1,
  randomEncounters: RandomEncounters.Normal,
  worldModels: [] as WorldModel[],
  battleChocoboRating: 0,
  menuAlwaysEnabled: false,
  worldZoomTiltEnabled: false,
  worldZoom: 0,
  worldTilt: 0,
  worldSpeedMultiplier: 2,
  partyMemberIds: [] as number[],
  keyItems: [] as number[],
  partyMembers: [] as PartyMember[],
  zolomCoords: null as [number, number] | null,
  worldMapType: 0,
  fieldTmpVars: [] as number[],
  fieldLines: [] as FieldLine[],
  battleQueue: [] as number[],
  walkAnywhereEnabled: false,
  lovePoints: [] as number[],
  battlePoints: 0,
  chocoboData: null as ChocoboData | null,
};

export type FF7State = typeof defaultGameState;

interface FF7ContextType {
  connected: boolean;
  gameState: FF7State;
  gameData: GameDataType;
  isLoadingGameData: boolean;
  hacks: { skipIntro: boolean };
  setHacks: React.Dispatch<React.SetStateAction<{ skipIntro: boolean }>>;
  addresses: FF7Addresses | null;
  isLoadingAddresses: boolean;
  errorAddresses: any;
}

export const FF7Context = createContext<FF7ContextType | undefined>(undefined);

export const FF7Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addresses, isLoading: isLoadingAddresses, error: errorAddresses } = useFF7Addresses();
  const setLogs = useSetAtom(battleLogAtom);

  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(defaultGameState);
  const [gameData, setGameData] = useState(defaultGameData);
  const [isLoadingGameData, setIsLoadingGameData] = useState(true);
  const [hacks, setHacks] = useState({ skipIntro: false });
  const previousStatusesRef = useRef<Record<number, number>>({});
  const previousModuleRef = useRef<GameModule | null>(null);

  const [gameDataError, setGameDataError] = useState<any>(null);
  const [gameDataRetryCount, setGameDataRetryCount] = useState(0);

  const addStatusChangeItem = (targetCharacterIndex: number, changes: StatusChange[]) => {
    if (changes.length === 0) return; // Don't add log if no changes

    const newItem: BattleLogItem = {
      targetCharacterIndex,
      changedStatuses: changes,
      timestamp: Date.now(),
    };

    console.debug(`Adding status change log item (from context)`, newItem);
    setLogs((prevLogs: BattleLogItem[]) => [...prevLogs, newItem]);
  };

  const checkStatusChanges = (currentChar: BattleCharObj | undefined, charIndex: number) => {
    const prevStatus = previousStatusesRef.current[charIndex];

    // Exit if no character data OR if status is unchanged from the previous known status
    if (!currentChar || (prevStatus !== undefined && currentChar.status === prevStatus)) {
      return;
    }

    // Ensure currentStatus is a number (should be, but safeguard)
    // Treat undefined previous status as 0 for comparison purposes
    const currentStatus = currentChar.status ?? 0;
    const previousStatusValue = prevStatus ?? 0;

    // Status is different or it's the first time seeing this char, find changes
    const changes: StatusChange[] = [];
    for (const statusKey in statusEnum) {
      const statusBit = statusEnum[statusKey as keyof typeof statusEnum];
      const hadStatus = (previousStatusValue & statusBit) !== 0;
      const hasStatus = (currentStatus & statusBit) !== 0;

      if (hadStatus !== hasStatus) {
        changes.push({
          statusId: statusKey as keyof typeof statusEnum,
          inflicted: hasStatus,
        });
      }
    }

    if (changes.length > 0) {
      console.log(`Status change detected for index ${charIndex}:`, changes);
      addStatusChangeItem(charIndex, changes);
    }
  };

  // Function to load core game data (commands, items, magic, summon, e.skill)
  const loadCoreGameData = async () => {
    if (!connected || gameState.currentModule === GameModule.None) return; // Don't load if not connected
    try {
      console.debug("Loading core game data...", gameState.currentModule);
      setIsLoadingGameData(true);
      setGameDataError(null);
      const fetchedCommandNames: string[] = await invoke("read_command_names");
      const fetchedAttackNames: string[] = await invoke("read_attack_names");
      const fetchedItemData: ItemData[] = await invoke("read_item_data");
      const fetchedItemNames: string[] = await invoke("read_item_names");
      const fetchedMateriaNames: string[] = await invoke("read_materia_names");
      const fetchedBattleScenes: BattleScene[] = await invoke("read_battle_scenes");

      const fetchedMagicNames = fetchedAttackNames.slice(0, 56);
      const fetchedSummonNames = fetchedAttackNames.slice(56, 72);
      const fetchedEnemySkillNames = fetchedAttackNames.slice(72, 96);

      setGameData(prevData => ({
        ...prevData,
        commandNames: fetchedCommandNames,
        magicNames: fetchedMagicNames,
        summonNames: fetchedSummonNames,
        enemySkillNames: fetchedEnemySkillNames,
        itemData: fetchedItemData,
        itemNames: fetchedItemNames,
        materiaNames: fetchedMateriaNames,
        battleScenes: fetchedBattleScenes,
      }));
      setGameDataError(null);
      console.debug("Core game data loaded.");
    } catch (error) {
      setGameDataError(error);
      console.error("Failed to load core game data:", error);
    } finally {
      setIsLoadingGameData(false);
    }
  };

  // Effect to load core game data and retry every 5s if it fails (and only when connected)
  useEffect(() => {
    if (!connected) return;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tryLoad = async () => {
      await loadCoreGameData();
      if (!cancelled && connected && gameDataError) {
        retryTimeout = setTimeout(() => {
          setGameDataRetryCount(c => c + 1);
        }, 5000);
      }
    };

    tryLoad();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, gameDataRetryCount]);

  // Reset retry count and error when disconnected
  useEffect(() => {
    if (!connected) {
      setGameDataRetryCount(0);
      setGameDataError(null);
    }
  }, [connected]);

  // Effect for polling game state
  useEffect(() => {
    if (isLoadingAddresses || errorAddresses || !addresses) {
      setConnected(false);
      previousStatusesRef.current = {};
      return;
    }

    const parseKeyItemsBitmask = (bytes: number[]) => {
      const keyItems: number[] = [];
      for (let i = 0; i < 64; i++) {
        if (bytes[Math.floor(i / 8)] & (1 << (i % 8))) {
          keyItems.push(i);
        }
      }
      return keyItems;
    };

    const updateGameState = async () => {
      if (!addresses) {
        setConnected(false);
        previousStatusesRef.current = {};
        return;
      }
      try {
        const ff7Data: any = await invoke("read_ff7_data");
        const basic: any = ff7Data.basic;
        const currentModule = basic.current_module as GameModule;

        if (currentModule === GameModule.Battle && previousModuleRef.current !== GameModule.Battle) {
          console.debug("Transitioned into Battle module. Clearing previous statuses ref.");
          previousStatusesRef.current = {};
        }

        const fieldData: any = ff7Data.field_data;
        const isFFnx: any = basic.ffnx_check === 0xE9;

        const fps = basic.current_module === GameModule.Field ? basic.field_fps : basic.current_module === GameModule.Battle ? basic.battle_fps : basic.world_fps;
        const normalFps = basic.current_module === GameModule.Field ? 30 : basic.current_module === GameModule.Battle ? 15 : 30;

        let speed = Math.floor((10000000 / fps) as number / normalFps * 100) / 100;
        if (Math.round(speed * 10) === 10) {
          speed = 1;
        }

        if (isFFnx) {
           if (!addresses) {
              setConnected(false);
              return;
           }
           try {
             const baseAddress = await readMemory(addresses.ffnx_check + 1, DataType.Int) + addresses.ffnx_check + 5;
             const addrFieldFps = await readMemory(baseAddress + 0xa, DataType.Int);
             const fieldFps = await readMemory(addrFieldFps, DataType.Float);
             speed = Math.floor(fieldFps / 30 * 100) / 100;
           } catch (memReadError) {
             console.warn("Failed to read FFnx speed:", memReadError);
           }
        }

        let fieldName = fieldData.field_name.map((char: number) => String.fromCharCode(char)).join('');
        fieldName = fieldName.split('\\')[0];
        if (!fieldName || fieldName.length === 0) {
          fieldName = 'N/A';
        }

        const fieldModels: FieldModel[] = ff7Data.field_data.field_model_names.map((name: any, idx: number) => {
          if (!ff7Data.field_models || ff7Data.field_models.length === 0 || idx >= ff7Data.field_models.length) {
            return null;
          }
          const modelData = ff7Data.field_models[idx];
          const nameStr = typeof name === 'string' ? name : (Array.isArray(name) ? String.fromCharCode(...name.filter((c: number) => c !== 0)) : '');
          const nameTrimmed = nameStr.startsWith(fieldName + '_') ? nameStr.substring(fieldName.length + 1) : nameStr;
          return {
            name: nameTrimmed.split('.')[0],
            x: modelData.x,
            y: modelData.y,
            z: modelData.z,
            direction: modelData.direction,
            triangle: modelData.triangle,
            collision: modelData.collision ? 0 : 1,
            interaction: modelData.interaction ? 0 : 1,
            visible: modelData.visible,
            lights: modelData.lights,
          } as FieldModel;
        }).filter((model: FieldModel | null): model is FieldModel => model !== null);

        const worldCurrentModel = ff7Data.world_current_model as WorldModel;
        worldCurrentModel.script = worldCurrentModel.walkmesh_type >> 5;
        worldCurrentModel.walkmesh_type = worldCurrentModel.walkmesh_type & 0x1f;
        const battlesDisabled = basic.field_battle_check === 0x2E0E9;
        const maxBattlesEnabled = basic.field_battle_check === 0x90909090;
        let randomEncounters: RandomEncounters = RandomEncounters.Normal;
        if (battlesDisabled) {
          randomEncounters = RandomEncounters.Off;
        } else if (maxBattlesEnabled) {
          randomEncounters = RandomEncounters.Max;
        }
        const worldModels = ff7Data.world_models as WorldModel[];

        // Load chocobo data
        let chocoboData: ChocoboData | null = null;
        try {
          chocoboData = await invoke("read_chocobo_data");
        } catch (error) {
          console.warn("Failed to load chocobo data:", error);
        }

        setGameState(prevState => ({
          ...prevState,
          currentModule: basic.current_module as number,
          gameMoment: basic.game_moment as number,
          fieldId: basic.field_id as number,
          fieldCurrentModelId: basic.field_current_model_id as number,
          fieldName,
          fieldFps: basic.field_fps as number,
          battleFps: basic.battle_fps as number,
          worldFps: basic.world_fps as number,
          inGameTime: basic.in_game_time as number,
          discId: basic.disc_id as number,
          menuVisibility: basic.menu_visibility as number,
          menuLocks: basic.menu_locks as number,
          fieldMovementDisabled: basic.field_movement_disabled as number,
          fieldMenuAccessEnabled: basic.field_menu_access_enabled as number,
          fieldSkipDialoguesEnabled: basic.field_skip_dialogues_check !== 0x8b,
          partyLockingBitmask: basic.party_locking_mask as number,
          partyVisibilityBitmask: basic.party_visibility_mask as number,
          gil: basic.gil as number,
          gp: basic.gp as number,
          battleCount: basic.battle_count as number,
          battleEscapeCount: basic.battle_escape_count as number,
          battlesDisabled: basic.field_battle_check === 0x2E0E9,
          maxBattlesEnabled: basic.field_battle_check === 0x90909090,
          randomEncounters,
          gameObjPtr: basic.game_obj_ptr as number,
          battleSwirlDisabled: basic.battle_swirl_check === 0x00,
          instantATBEnabled: basic.instant_atb_check === 0x45C7,
          manualSlotsEnabled: basic.manual_slots_check === 0,
          slotsActive: basic.slots_active as number,
          speed: '' + speed,
          unfocusPatchEnabled: basic.unfocus_patch_check === 0x80,
          isFFnx,
          stepId: basic.step_id as number,
          stepOffset: basic.step_offset as number,
          stepFraction: basic.step_fraction as number,
          dangerValue: basic.danger_value as number,
          formationIndex: basic.formation_idx as number,
          battleId: basic.battle_id as number,
          fieldModels,
          battleAllies: ff7Data.battle_allies as BattleCharObj[],
          battleEnemies: ff7Data.battle_enemies as BattleCharObj[],
          invincibilityEnabled: !(basic.invincibility_check === 0x4ee8),
          worldCurrentModel,
          expMultiplier: !(basic.exp_multiplier === 0x38) ? basic.exp_multiplier as number : 1,
          gilMultiplier: !(basic.gil_multiplier === 0xB1) ? basic.gil_multiplier as number : 1,
          apMultiplier: !(basic.ap_multiplier === 0xe2) ? basic.ap_multiplier as number : 1,
          worldModels,
          battleChocoboRating: basic.battle_chocobo_rating as number,
          menuAlwaysEnabled: basic.menu_always_enabled === 0xc7,
          worldZoomTiltEnabled: basic.world_zoom_tilt_enabled === 1,
          worldZoom: basic.world_zoom as number,
          worldTilt: basic.world_tilt as number,
          worldSpeedMultiplier: basic.world_speed_multiplier as number,
          partyMemberIds: basic.party_member_ids as number[],
          keyItems: parseKeyItemsBitmask(basic.key_items),
          partyMembers: ff7Data.party_members as PartyMember[],
          zolomCoords: basic.zolom_coords ? [basic.zolom_coords >> 16, basic.zolom_coords & 0xffff] : null,
          worldMapType: basic.world_map_type as number,
          fieldTmpVars: basic.field_tmp_vars as number[],
          fieldLines: ff7Data.field_lines as FieldLine[],
          battleQueue: basic.battle_queue as number[],
          walkAnywhereEnabled: basic.walk_anywhere_check === 0xe9,
          lovePoints: basic.love_points as number[],
          battlePoints: basic.battle_points as number,
          chocoboData,
        }));

        // Status Change Detection Logic - wait 50ms to ensure battle log was updated before
        setTimeout(() => {
          const newStatuses: Record<number, number> = {};
          if (basic.current_module === GameModule.Battle) {
            // Allies (index 0-3)
            for (let i = 0; i < 4; i++) {
              const ally = ff7Data.battle_allies[i] as BattleCharObj | undefined;
              checkStatusChanges(ally, i);
              if (ally) {
                newStatuses[i] = ally.status;
              }
            }
            // Enemies (index 4-7)
            for (let i = 0; i < 6; i++) {
              const enemy = ff7Data.battle_enemies[i] as BattleCharObj | undefined;
              checkStatusChanges(enemy, i + 4);
              if (enemy) {
                newStatuses[i + 4] = enemy.status;
              }
            }
            previousStatusesRef.current = newStatuses;
          } else {
            // If not in battle, clear previous statuses ref
            if (Object.keys(previousStatusesRef.current).length > 0) {
              previousStatusesRef.current = {};
            }
          }
        }, 50);

        previousModuleRef.current = currentModule;

        setConnected(currentModule !== GameModule.None);
      } catch (e) {
        console.warn("Could not read FF7 data: ", e);
        setConnected(false);
      }
    };

    updateGameState(); // Initial call
    const intervalId = setInterval(updateGameState, 125);

    return () => clearInterval(intervalId);
  }, [addresses, isLoadingAddresses, errorAddresses, connected, gameState.currentModule]); // Added connected and gameState.currentModule dependencies

  const loadEnemyAttackNames = async () => {
    if (!connected) return;
    try {
        setIsLoadingGameData(true);
        const fetchedEnemyAttackNames: string[] = await invoke("read_enemy_attack_names");
        setGameData(prevData => ({
            ...prevData,
            enemyAttackNames: fetchedEnemyAttackNames,
        }));
    } catch (error) {
        console.error("Failed to load enemy attack names:", error);
    } finally {
        setIsLoadingGameData(false);
    }
  };

  useEffect(() => {
    if (connected && gameState.currentModule === GameModule.Battle && ![0, 0xFFFF].includes(gameState.battleId)) {
      loadEnemyAttackNames();
    }
  }, [connected, gameState.currentModule, gameState.battleId]);

  // Render loading/error states based on address loading
  if (isLoadingAddresses) {
    return <div className="flex items-center justify-center h-screen">Loading addresses...</div>; // Or a spinner
  }

  if (errorAddresses) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error loading FF7 addresses: {errorAddresses.toString()}</div>;
  }

  if (!addresses) {
    // This case might be brief or represent a more permanent failure after the initial load attempt
    return <div className="flex items-center justify-center h-screen">FF7 addresses not available. Is the game running?</div>;
  }

  const value = {
    connected,
    gameState,
    gameData,
    isLoadingGameData,
    hacks,
    setHacks,
    addresses,
    isLoadingAddresses: false,
    errorAddresses: null,
  };

  return <FF7Context.Provider value={value}>{children}</FF7Context.Provider>;
};

export const useFF7Context = () => {
  const context = useContext(FF7Context);
  if (context === undefined) {
    throw new Error('useFF7Context must be used within a FF7Provider');
  }
  return context;
};
