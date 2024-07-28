"use strict";

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

enum GameModule {
  None = 0,
  Field = 1,
  Battle = 2,
  World = 3,
  Menu = 5,
}

enum DataType {
  Byte = 0,
  Short = 1,
  Int = 2,
  Float = 3,
}

interface FieldModel {
  x: number,
  y: number,
  z: number,
  direction: number,
}

interface BattleCharObj {
  hp: number,
  max_hp: number,
  mp: number,
  max_mp: number,
  atb: number,
  limit: number,
}

export function callWithTimeout<T>(func: () => T, timeout: number): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => {
        resolve(func());
    }, timeout);
  });
}

export function useFF7() {
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

  const [endingBattle, setEndingBattle] = useState(false);

  const [connected, setConnected] = useState(false);

  const setSpeed = async (speed: number) => {
    const fieldFps = 10000000 / (30 * speed);
    await invoke("write_memory_float", {
      address: 0xcff890,
      newValue: fieldFps,
    });
    const battleFps = 10000000 / (15 * speed);
    await invoke("write_memory_float", {
      address: 0x9ab090,
      newValue: battleFps,
    });
    const worldFps = 10000000 / (30 * speed);
    await invoke("write_memory_float", {
      address: 0xde6938,
      newValue: worldFps,
    });

    // Remove FPS init code for each module
    // Field
    await invoke("write_memory_buffer", {
      address: 0x60e434,
      buffer: [0x90, 0x90, 0x90, 0x90, 0x90, 0x90],
    });
    // World
    await invoke("write_memory_buffer", {
      address: 0x74bd02,
      buffer: [0x90, 0x90, 0x90, 0x90, 0x90, 0x90],
    });
    // Battle
    await invoke("write_memory_buffer", {
      address: 0x41b6d8,
      buffer: [0x90, 0x90, 0x90, 0x90, 0x90, 0x90],
    });
  }

  const toggleMenuAccess = async () => {
    await invoke("write_memory_byte", {
      address: 0xcc0dbc,
      newValue: gameState.fieldMenuAccessEnabled ? 0 : 1,
    });
  }

  const toggleMovement = async () => {
    await invoke("write_memory_byte", {
      address: 0xcc0dba,
      newValue: gameState.fieldMovementDisabled ? 0 : 1,
    });
  }

  const enableAllMenus = async () => {
    await invoke("write_memory_short", {
      address: 0xdc08f8,
      newValue: 0xffff,
    });
    await invoke("write_memory_short", {
      address: 0xdc08fa,
      newValue: 0,
    });
  }

  const enableAllPartyMembers = async () => {
    await invoke("write_memory_short", {
      address: 0xdc0dde,
      newValue: 0x7ff,
    });
  }

  // Patch out the battle check by writing an unconditional jump
  const disableBattles = async () => {
    // Field 
    await invoke('write_memory_buffer', { 
      address: 0x60b40a, 
      buffer: [0xE9, 0xE0, 0x02, 0x00, 0x00, 0x90],
    });

    // World
    await invoke('write_memory_byte', { 
      address: 0x7675f6, 
      newValue: 0,
    });
  }

  const enableBattles = async () => {
    // Field
    await invoke('write_memory_buffer', { 
      address: 0x60b40a, 
      buffer: [0x0F, 0x83, 0xDF, 0x02, 0x00, 0x00],
    });

    // World
    await invoke('write_memory_byte', { 
      address: 0x767758, 
      newValue: 0x0A,
    });
    await invoke('write_memory_byte', { 
      address: 0x7675f6, 
      newValue: 0x01,
    });
  }

  const maxBattles = async () => {
    await invoke('write_memory_buffer', { 
      address: 0x60b40a, 
      buffer: [0x90, 0x90, 0x90, 0x90, 0x90, 0x90],
    });

    // World
    await invoke('write_memory_byte', { 
      address: 0x767758, 
      newValue: 0x0F,
    });
    await invoke('write_memory_byte', { 
      address: 0x7675f6, 
      newValue: 0x10,
    });
  }

  const getGfxFlipPtr = async () => {
    if (!gameState.gameObjPtr) {
      return 0;
    }

    const gfxFunctionPtrs = await invoke('read_memory_int', {address: gameState.gameObjPtr + 0x934}) as number;
    return await invoke('read_memory_int', {address: gfxFunctionPtrs + 0x4}) as number;
  }


  const patchWindowUnfocus = async () => {
    if (!gameState.gameObjPtr) {
      return;
    }

    // Check if window already was unfocused (tick function pointer is out of program memory)
    const tickFunctionPtr = await invoke('read_memory_int', {address: gameState.gameObjPtr + 0xa00}) as number;
    if (tickFunctionPtr > 0xFFFFFF) {
      // If it is unfocused, delay patching until it's focused
      await callWithTimeout(() => patchWindowUnfocus(), 250);
      return;
    }
    
    // Find the function responsible for halting the game when unfocused
    const gfxFlipPtr = await getGfxFlipPtr();

    // Add a RET instruction at the beginning of this function
    await invoke('write_memory_byte', {address: gfxFlipPtr + 0x260, newValue: 0xC3});

    // Add Global Focus flag to sound buffer initialization so we don't lose sound while unfocued
    await invoke('write_memory_byte', {address: 0x74a561, newValue: 0x80});
  }

  const unpatchWindowUnfocus = async () => {
    if (!gameState.gameObjPtr) {
      return;
    }

    // Find the function responsible for halting the game when unfocused
    const gfxFlipPtr = await getGfxFlipPtr();

    // Remove the RET instruction at the beginning of this function
    await invoke('write_memory_byte', {address: gfxFlipPtr + 0x260, newValue: 0x51});
  }

  const checkForBattleEnd = async () => {
    const battleMode: number = await invoke("read_memory_byte", {
      address: 0x9aad64,
    });
    if (battleMode > 5) {
      await invoke('write_memory_byte', { 
        address: 0x9ab0c2, 
        newValue: 0x08,
      });
    } else if (!connected || gameState.currentModule !== GameModule.Battle) {
      return;
    } else {
      setTimeout(checkForBattleEnd, 100);
    }
  }

  const endBattle = async () => {
    if (gameState.currentModule === GameModule.Battle) {
      setTimeout(checkForBattleEnd, 100);
    }
  }
  
  const getFieldObjPtr = async () => {
    const fieldObjPtr: number = await invoke("read_memory_int", {
      address: 0xCBF9D8,
    });
    if (fieldObjPtr === 0) {
      return 0;
    }
    return fieldObjPtr;
  }

  const skipFMV = async () => {
    const isMoviePlaying: number = await invoke("read_memory_byte", {
      address: 0x9a1010,
    });
    if (isMoviePlaying === 0) {
      return;
    }
    await invoke("write_memory_byte", {
      address: 0x9a1014,
      newValue: 0x01,
    });

    // Check if we're skipping the intro FMV
    if (gameState.fieldId === 116) {
      const fieldObjPtr: number = await getFieldObjPtr();
      // Fade
      await invoke("write_memory_byte", {
        address: fieldObjPtr + 0x4C,
        newValue: 0x01,
      });
      await invoke("write_memory_byte", {
        address: fieldObjPtr + 0x4E,
        newValue: 0xFF,
      });
      await invoke("write_memory_byte", {
        address: fieldObjPtr + 0x50,
        newValue: 0xFF,
      });

      // Scroll
      await invoke("write_memory_byte", {
        address: fieldObjPtr + 0x0A,
        newValue: 0x0A,
      });
      await invoke("write_memory_byte", {
        address: fieldObjPtr + 0x0C,
        newValue: 0x23,
      });
      await invoke("write_memory_byte", {
        address: fieldObjPtr + 0x1D,
        newValue: 0x4,
      });
      await invoke("write_memory_byte", {
        address: fieldObjPtr + 0x1F,
        newValue: 0x0,
      });
    }
  }

  // Wait for a specific state in the gameState object to be equal to a value
  const waitForStateValue = async (address: number, value: number, type: DataType) => {
    return new Promise(resolve => {
      const intervalId = setInterval(async () => {
        try {
          const fns = ["read_memory_byte", "read_memory_short", "read_memory_int", "read_memory_float"];
          const fn = fns[type];
          const state = await invoke(fn, {
            address,
          }) as number;
          if (state === value) {
            clearInterval(intervalId);
            resolve(true);
          }
        } catch (e) {
          console.log("Error: ", e);
        }
      }, 250);
    });
  }
  const startBattle = async (battleId: number) => {
    if (isNaN(battleId)) {
      return;
    }
    if (gameState.currentModule === GameModule.Battle) {
      return;
    }

    const fieldObjPtr: number = await getFieldObjPtr();

    await invoke("write_memory_byte", {
      address: fieldObjPtr + 1,
      newValue: 2, // Battle game module
    });
    await invoke("write_memory_short", {
      address: fieldObjPtr + 2,
      newValue: battleId,
    });
    await invoke("write_memory_short", {
      address: fieldObjPtr + 38,
      newValue: 0,
    });
    await invoke("write_memory_byte", {
      address: 0xcbf6b8,
      newValue: 1,
    });

    // Wait for the battle to start
    await waitForStateValue(0xcbf9dc, GameModule.Battle, DataType.Byte);

    // Reset the game module variable
    await invoke("write_memory_byte", {
      address: fieldObjPtr + 1,
      newValue: 0, 
    });
  }

  const disableBattleSwirl = async () => {
    await invoke("write_memory_byte", {
      address: 0x402712,
      newValue: 0x00,
    });
    await invoke("write_memory_byte", {
      address: 0x4027e5,
      newValue: 0x00,
    });
  }

  const enableBattleSwirl = async () => {
    await invoke("write_memory_byte", {
      address: 0x402712,
      newValue: 0x2e,
    });
    await invoke("write_memory_byte", {
      address: 0x4027e5,
      newValue: 0x4e,
    });
  }

  const enableInstantATB = async () => {
    await invoke("write_memory_buffer", {
      address: 0x433abd,
      buffer: [0xC7, 0x45, 0xFC, 0xFF, 0xFF, 0x00, 0x00, 0x90, 0x90, 0x90], // mov [ebp-04],0000FFFF and 3 nops
    });
    const atbIncreasePtrBase = 0x9a8b12;
    const charObjLength = 68;
    for (let i = 0; i < 3; i++) {
      await invoke("write_memory_short", {
        address: atbIncreasePtrBase + i * charObjLength,
        newValue: 0xffff,
      });
    }
  }

  const disableInstantATB = async () => {
    await invoke("write_memory_buffer", {
      address: 0x433abd,
      buffer: [0x66, 0x8B, 0x0D, 0x00, 0xAD, 0x9A, 0x00, 0x99, 0xF7, 0xF9],
    });
  }

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
        console.log("Error: ", e);
        setConnected(false);
      }
    }, 125);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return {
    connected,
    gameState,
    setSpeed,
    toggleMenuAccess,
    toggleMovement,
    enableAllMenus,
    enableAllPartyMembers,
    disableBattles,
    enableBattles,
    maxBattles,
    endBattle,
    patchWindowUnfocus,
    unpatchWindowUnfocus,
    skipFMV,
    startBattle,
    disableBattleSwirl,
    enableBattleSwirl,
    enableInstantATB,
    disableInstantATB,
  }
}