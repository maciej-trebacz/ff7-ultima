"use strict";

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { GameModule, FieldModel, BattleCharObj, WorldModel } from "./types";
import { DataType, readMemory } from "./memory";
import { useFF7Addresses, FF7Addresses } from "./ff7Addresses";

export const useFF7State = function() {
  const { addresses, isLoading, error } = useFF7Addresses();
  const [connected, setConnected] = useState(false);
  const [hacks, setHacks] = useState({
    skipIntro: false,
  });
  const [gameState, setGameState] = useState({
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
    partyBitmask: 0,
    gil: 0,
    gp: 0,
    battleCount: 0,
    battleEscapeCount: 0,
    battlesDisabled: false,
    maxBattlesEnabled: false,
    gameObjPtr: 0,
    battleSwirlDisabled: false,
    instantATBEnabled: false,
    fieldModels: [] as FieldModel[],
    battlePartyChars: [] as BattleCharObj[],
    battleAllies: [] as BattleCharObj[],
    battleEnemies: [] as BattleCharObj[],
    speed: '',
    unfocusPatchEnabled: false,
    isFFnx: false,
    stepId: 0,
    stepFraction: 0,
    dangerValue: 0,
    battleId: 0,
    invincibilityEnabled: false,
    worldCurrentModel: {} as WorldModel,
  });

  useEffect(() => {
    if (isLoading || error || !addresses) {
      return;
    }

    const updateGameState = async () => {
      try {
        const ff7Data: any = await invoke("read_ff7_data");
        const basic: any = ff7Data.basic;
        const battlePartyChars: any = ff7Data.battle_chars;
        const battleAllies: any = ff7Data.battle_allies;
        const battleEnemies: any = ff7Data.battle_enemies;
        const fieldData: any = ff7Data.field_data;
        const isFFnx: any = basic.ffnx_check === 0xE9;
        let speed = Math.floor((10000000 / basic.field_fps) as number / 30 * 100) / 100;
        if (isFFnx) {
          const baseAddress = await readMemory(addresses.ffnx_check + 1, DataType.Int) + addresses.ffnx_check + 5;
          const addrFieldFps = await readMemory(baseAddress + 0xa, DataType.Int);
          const fieldFps = await readMemory(addrFieldFps, DataType.Float);
          speed = Math.floor(fieldFps / 30 * 100) / 100;
        }

        let fieldName = fieldData.field_name.map((char: number) => String.fromCharCode(char)).join('');
        fieldName = fieldName.split('\\')[0];
        if (fieldData.field_name[0] === 0x00) {
          fieldName = 'N/A';
        }

        const fieldModels: any = ff7Data.field_data.field_model_names.map((name: any, idx: number) => {
          if (ff7Data.field_models.length === 0) {
            return null;
          }

          const nameTrimmed = name.indexOf(fieldName) !== -1 ? name.substring(fieldName.length) : name;
          return {
            name: nameTrimmed.split('.')[0],
            x: ff7Data.field_models[idx].x,
            y: ff7Data.field_models[idx].y,
            z: ff7Data.field_models[idx].z,
            direction: ff7Data.field_models[idx].direction,
          }
        });

        const worldCurrentModel = ff7Data.world_current_model as WorldModel;
        worldCurrentModel.script = worldCurrentModel.walkmesh_type >> 5;
        worldCurrentModel.walkmesh_type = worldCurrentModel.walkmesh_type & 0x1f;
        
        setGameState({
          currentModule: basic.current_module as number,
          gameMoment: basic.game_moment as number,
          fieldId: basic.field_id as number,
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
          partyBitmask: basic.party_bitmask as number,
          gil: basic.gil as number,
          gp: basic.gp as number,
          battleCount: basic.battle_count as number,
          battleEscapeCount: basic.battle_escape_count as number,
          battlesDisabled: basic.field_battle_check === 0x2E0E9,
          maxBattlesEnabled: basic.field_battle_check === 0x90909090,
          gameObjPtr: basic.game_obj_ptr as number,
          battleSwirlDisabled: basic.battle_swirl_check === 0x00,
          instantATBEnabled: basic.instant_atb_check === 0x45C7,
          speed: '' + speed,
          unfocusPatchEnabled: basic.unfocus_patch_check === 0x80,
          isFFnx,
          stepId: basic.step_id as number,
          stepFraction: basic.step_fraction as number,
          dangerValue: basic.danger_value as number,
          battleId: basic.battle_id as number,
          fieldModels,
          battlePartyChars,
          battleAllies,
          battleEnemies,
          invincibilityEnabled: !(basic.invincibility_check === 0x774e),
          worldCurrentModel,
        });
        setConnected(basic.current_module !== GameModule.None);
      } catch (e) {
        console.warn("Could not read FF7 data: ", e);
        setConnected(false);
      }
    };

    const intervalId = setInterval(updateGameState, 125);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [addresses, isLoading, error]);

  return {
    connected,
    gameState,
    hacks,
    setHacks,
    addresses,
  };
};