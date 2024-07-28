"use strict";

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { GameModule, FieldModel, BattleCharObj } from "./types";

export const useFF7State = function() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState({
    currentModule: 0,
    gameMoment: 0,
    fieldId: 0,
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
    battleCount: 0,
    battleEscapeCount: 0,
    battlesDisabled: false,
    maxBattlesEnabled: false,
    gameObjPtr: 0,
    battleSwirlDisabled: false,
    instantATBEnabled: false,
    fieldModels: [] as FieldModel[],
    battlePartyChars: [] as BattleCharObj[],
  });

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const ff7Data: any = await invoke("read_ff7_data");
        const basic: any = ff7Data.basic;
        const fieldModels: any = ff7Data.field_models;
        const battlePartyChars: any = ff7Data.battle_chars;
        setGameState({
          currentModule: basic.current_module as number,
          gameMoment: basic.game_moment as number,
          fieldId: basic.field_id as number,
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
          battleCount: basic.battle_count as number,
          battleEscapeCount: basic.battle_escape_count as number,
          battlesDisabled: basic.field_battle_check === 0x2E0E9,
          maxBattlesEnabled: basic.field_battle_check === 0x90909090,
          gameObjPtr: basic.game_obj_ptr as number,
          battleSwirlDisabled: basic.battle_swirl_check === 0x00,
          instantATBEnabled: basic.instant_atb_check === 0x45C7,
          fieldModels,
          battlePartyChars,
        });
        setConnected(basic.current_module !== GameModule.None);
      } catch (e) {
        console.warn("Could not read FF7 data: ", e);
        setConnected(false);
      }
    }, 125);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return {
    connected,
    gameState,
  }
}