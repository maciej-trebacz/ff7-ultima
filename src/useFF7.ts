"use strict";

import { invoke } from "@tauri-apps/api/core";
import { DataType, readMemory, writeMemory, setMemoryProtection, readMemoryBuffer } from "./memory";
import { waitFor } from "./util";
import { useFF7State } from "./state";
import { EnemyData, GameModule } from "./types";
import { FF7Addresses } from "./ff7Addresses";
import { statuses } from "./ff7Statuses";
import { battles } from "./ff7Battles";

type ModelObj = {
  data: number[];
  ptrData: number[];
}

type SaveState = {
  savemap: number[];
  fieldData: number[];
  models: Array<ModelObj>;
}

const SaveStates: SaveState[] = [];

export function useFF7(addresses: FF7Addresses) {
  const { connected, gameState, hacks, setHacks } = useFF7State();

  const getFieldObjPtr = async () => {
    const fieldObjPtr = await readMemory(addresses.field_obj_ptr, DataType.Int);
    if (fieldObjPtr === 0) {
      return 0;
    }
    return fieldObjPtr;
  };

  const getGfxFlipPtr = async () => {
    if (!gameState.gameObjPtr) {
      return 0;
    }

    const gfxFunctionPtrs = await readMemory(gameState.gameObjPtr + 0x934, DataType.Int);
    return readMemory(gfxFunctionPtrs + 0x4, DataType.Int);
  };

  if (hacks.skipIntro && gameState.currentModule === GameModule.Intro) {
    setTimeout(async () => {
      await writeMemory(addresses.intro_skip, 0x01, DataType.Byte);
    }, 0);
  }

  const toggleBitmaskValue = (bitmask: number, index: number) => {
    if (index === -1) {
      bitmask = bitmask & 1 ? 0 : 0xffff;
    } else if (bitmask & (1 << index)) {
      bitmask &= ~(1 << index);
    } else {
      bitmask |= 1 << index;
    }    
    return bitmask;
  }

  const ff7 = {
    connected,
    gameState,
    setSpeed: async (speed: number) => {
      const ffnxCheck = await readMemory(addresses.ffnx_check, DataType.Byte);
      if (ffnxCheck === 0xE9) {
        const baseAddress = await readMemory(addresses.ffnx_check + 1, DataType.Int) + addresses.ffnx_check + 5;
        const code = await readMemoryBuffer(baseAddress, 256);
        const opcodes = [0xF2, 0x0F, 0x10, 0x05];

        const fps30index = code.findIndex((byte, i) =>
          opcodes.every((opcode, j) => code[i + j] === opcode)
        );
        if (fps30index === -1) {
          return false;
        }
        
        const fps15index = code.slice(fps30index + 1).findIndex((byte, i) =>
          opcodes.every((opcode, j) => code.slice(fps30index + 1)[i + j] === opcode)
        ) + fps30index + 1;
        if (fps15index - fps30index - 1 === -1) {
          return false;
        }

        const addrFps30 = await readMemory(baseAddress + fps30index + 4, DataType.Int);
        const addrFps15 = await readMemory(baseAddress + fps15index + 4, DataType.Int);

        await setMemoryProtection(addrFps15, 16);

        // Field & World
        await writeMemory(addrFps30, 30 * speed, DataType.Float);

        // Battle
        await writeMemory(addrFps15, 15 * speed, DataType.Float);
        return true;
      }

      const setFps = async (address: number, defaultFps: number) => {
        await writeMemory(address, 10000000 / (defaultFps * speed), DataType.Float);
      };

      // Set FPS for each module
      await setFps(addresses.field_fps, 30);
      await setFps(addresses.battle_fps, 15);
      await setFps(addresses.world_fps, 30);

      // Remove FPS init code for each module so it doesn't get reset on module init
      await writeMemory(0x60e434, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90], DataType.Buffer);
      await writeMemory(0x74bd02, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90], DataType.Buffer);
      await writeMemory(0x41b6d8, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90], DataType.Buffer);

      return true;
    },
    toggleMenuAccess: async () => {
      await writeMemory(addresses.field_menu_access_enabled, gameState.fieldMenuAccessEnabled ? 0 : 1, DataType.Byte);
    },
    toggleMovement: async () => {
      await writeMemory(addresses.field_movement_disabled, gameState.fieldMovementDisabled ? 0 : 1, DataType.Byte);
    },
    enableAllMenus: async () => {
      await writeMemory(addresses.menu_visibility, 0xffff, DataType.Short);
      await writeMemory(addresses.menu_locks, 0, DataType.Short);
    },
    enableAllPartyMembers: async () => {
      await writeMemory(addresses.party_visibility_mask, 0x7ff, DataType.Short);
      await writeMemory(addresses.party_locking_mask, 0, DataType.Short);
    },
    disableBattles: async () => {
      // Field
      await writeMemory(addresses.field_battle_disable, [0xe9, 0xe0, 0x02, 0x00, 0x00, 0x90], DataType.Buffer);

      // World
      await writeMemory(addresses.world_battle_disable, 0, DataType.Byte);
    },
    enableBattles: async () => {
      // Field
      await writeMemory(addresses.field_battle_disable, [0x0f, 0x83, 0xdf, 0x02, 0x00, 0x00], DataType.Buffer);

      // World
      await writeMemory(addresses.world_battle_enable, 0x0a, DataType.Byte);
      await writeMemory(addresses.world_battle_disable, 0x01, DataType.Byte);
    },
    maxBattles: async () => {
      await writeMemory(addresses.field_battle_disable, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90], DataType.Buffer);

      // World
      await writeMemory(addresses.world_battle_enable, 0x0f, DataType.Byte);
      await writeMemory(addresses.world_battle_disable, 0x10, DataType.Byte);
    },
    endBattle: async (win: boolean) => {
      if (gameState.currentModule === GameModule.Battle) {
        const checkForBattleEnd = async () => {
          try {
            const battleMode = await readMemory(addresses.battle_mode, DataType.Byte);
            if (battleMode > 5) {
              if (!win) {
                await writeMemory(addresses.battle_end_check, 0x08, DataType.Byte);
              } else {
                for (let i = 4; i < 10; i++) {
                  await writeMemory(addresses.battle_char_base + i * 104, statuses.Dead, DataType.Int);
                }
                await writeMemory(addresses.battle_mode, 0x10, DataType.Byte);
                await writeMemory(addresses.battle_end_check, 0x20, DataType.Byte);
              }
            } else if (!connected || gameState.currentModule !== GameModule.Battle) {
              return;
            } else {
              setTimeout(checkForBattleEnd, 100);
            }
          } catch (e) {
            console.warn("Could not end battle", e);
          }
        };
        setTimeout(checkForBattleEnd, 100);
      }
    },
    patchWindowUnfocus: async () => {
      if (!gameState.gameObjPtr) {
        return;
      }

      // Add Global Focus flag to sound buffer initialization so we don't lose sound while unfocused
      await writeMemory(addresses.sound_buffer_focus, 0x80, DataType.Byte);

      // Check if window already was unfocused (tick function pointer is out of program memory)
      await waitFor(async () => {
        const tickFunctionPtr = await readMemory(gameState.gameObjPtr + 0xa00, DataType.Int);
        return tickFunctionPtr <= 0xffffff;
      });

      debugger; 
      // Find the function responsible for halting the game when unfocused
      const gfxFlipPtr = await getGfxFlipPtr();

      // Add a RET instruction at the beginning of this function
      await writeMemory(gfxFlipPtr + 0x260, 0xc3, DataType.Byte);
    },
    unpatchWindowUnfocus: async () => {
      if (!gameState.gameObjPtr) {
        return;
      }

      // Find the function responsible for halting the game when unfocused
      const gfxFlipPtr = await getGfxFlipPtr();

      // Remove the RET instruction at the beginning of this function
      await writeMemory(gfxFlipPtr + 0x260, 0x51, DataType.Byte);

      // Remove the global focus flag
      await writeMemory(addresses.sound_buffer_focus, 0, DataType.Byte);
    },
    skipFMV: async () => {
      const isMoviePlaying = await readMemory(addresses.movie_is_playing, DataType.Byte);
      if (isMoviePlaying === 0) {
        return;
      }
      await writeMemory(addresses.movie_skip, 0x01, DataType.Byte);

      // Check if we're skipping the intro FMV
      if (gameState.fieldId === 116) {
        const fieldObjPtr = await getFieldObjPtr();
        // Fade
        await writeMemory(fieldObjPtr + 0x4c, 0x01, DataType.Byte);
        await writeMemory(fieldObjPtr + 0x4e, 0xff, DataType.Byte);
        await writeMemory(fieldObjPtr + 0x50, 0xff, DataType.Byte);

        // Scroll
        await writeMemory(fieldObjPtr + 0x0a, 0x0a, DataType.Byte);
        await writeMemory(fieldObjPtr + 0x0c, 0x23, DataType.Byte);
        await writeMemory(fieldObjPtr + 0x1d, 0x4, DataType.Byte);
        await writeMemory(fieldObjPtr + 0x1f, 0x0, DataType.Byte);
      }
    },
    startBattle: async (battleId: number) => {
      if (isNaN(battleId)) {
        return;
      }

      switch (gameState.currentModule) {
        case GameModule.Field:
          const fieldObjPtr = await getFieldObjPtr();

          await writeMemory(fieldObjPtr + 1, 2, DataType.Byte); // Battle game module
          await writeMemory(fieldObjPtr + 2, battleId, DataType.Short);
          await writeMemory(fieldObjPtr + 38, 0, DataType.Short);
          await writeMemory(addresses.battle_module_field, 1, DataType.Byte);

          // Wait for the battle to start
          await waitFor(async () => {
            return (await readMemory(addresses.current_module, DataType.Byte)) === GameModule.Battle;
          });

          // Reset the game module variable
          await writeMemory(fieldObjPtr + 1, 0, DataType.Byte);
          break;
        case GameModule.World:
          await writeMemory(addresses.battle_id_world, battleId, DataType.Int);
          await writeMemory(addresses.world_battle_flag1, 0, DataType.Int);
          await writeMemory(addresses.world_battle_flag2, 0, DataType.Int);
          await writeMemory(addresses.world_battle_flag3, 1, DataType.Int);
          await writeMemory(addresses.world_battle_flag4, 3, DataType.Int);

          if (battles[battleId].indexOf("Chocobo") > -1) {
            const chocoboRating = await invoke("get_chocobo_rating_for_scene", { sceneId: battleId }) as number;
            await writeMemory(addresses.battle_chocobo_rating, chocoboRating, DataType.Byte);
          }

          break;
        default:
          return;
      }
    },
    disableBattleSwirl: async () => {
      await writeMemory(addresses.battle_swirl_disable1, 0x00, DataType.Byte);
      await writeMemory(addresses.battle_swirl_disable2, 0x00, DataType.Byte);
    },
    enableBattleSwirl: async () => {
      await writeMemory(addresses.battle_swirl_disable1, 0x2e, DataType.Byte);
      await writeMemory(addresses.battle_swirl_disable2, 0x4e, DataType.Byte);
    },
    enableInstantATB: async () => {
      await writeMemory(addresses.instant_atb_set, [0xc7, 0x45, 0xfc, 0xff, 0xff, 0x00, 0x00, 0x90, 0x90, 0x90], DataType.Buffer); // mov [ebp-04],0000FFFF and 3 nops
      const charObjLength = 68;
      for (let i = 0; i < 3; i++) {
        await writeMemory(addresses.battle_atb_base + i * charObjLength, 0xffff, DataType.Short);
      }
    },
    disableInstantATB: async () => {
      await writeMemory(addresses.instant_atb_set, [0x66, 0x8b, 0x0d, 0x00, 0xad, 0x9a, 0x00, 0x99, 0xf7, 0xf9], DataType.Buffer);
    },
    enableSkipIntro: async () => {
      setHacks({ ...hacks, skipIntro: true });
    },
    disableSkipIntro: async () => {
      setHacks({ ...hacks, skipIntro: false });
    },
    introDisabled: hacks.skipIntro,
    togglePartyMemberLocking: async (index: number) => {
      let bitmask = gameState.partyLockingBitmask;
      bitmask = toggleBitmaskValue(bitmask, index);
      await writeMemory(addresses.party_locking_mask, bitmask, DataType.Short);
    },
    partyMemberLocked: (index: number) => {
      let bitmask = gameState.partyLockingBitmask;
      return Boolean(bitmask & (1 << index));
    },
    togglePartyMemberVisibility: async (index: number) => {
      let bitmask = gameState.partyVisibilityBitmask;
      bitmask = toggleBitmaskValue(bitmask, index);
      await writeMemory(addresses.party_visibility_mask, bitmask, DataType.Short);
    },
    partyMemberVisible: (index: number) => {
      let bitmask = gameState.partyVisibilityBitmask;
      return Boolean(bitmask & (1 << index));
    },
    toggleMenuVisibility: async (index: number) => {
      let menuVisibility = gameState.menuVisibility;
      menuVisibility = toggleBitmaskValue(menuVisibility, index);
      await writeMemory(addresses.menu_visibility, menuVisibility, DataType.Short);
    },
    menuVisibilityEnabled: (index: number) => {
      let menuVisibility = gameState.menuVisibility;
      return Boolean(menuVisibility & (1 << index));
    },
    toggleMenuLock: async (index: number) => {
      let menuLocks = gameState.menuLocks;
      menuLocks = toggleBitmaskValue(menuLocks, index);
      await writeMemory(addresses.menu_locks, menuLocks, DataType.Short);
    },
    menuLockEnabled: (index: number) => {
      let menuLocks = gameState.menuLocks;
      return Boolean(menuLocks & (1 << index));
    },
    enableMenuAlwaysEnabled: async () => {
      const code = [0xc7, 0x05, 0x30, 0x11, 0xdc, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc7, 0x05, 0x1c, 0x11, 0xdc, 0x00, 0xff, 0xff, 0x00, 0x00, 0xeb, 0x5f];
      await writeMemory(addresses.menu_always_enabled, code, DataType.Buffer);
    },
    disableMenuAlwaysEnabled: async () => {
      const code = [0x66, 0x0f, 0xb6, 0x05, 0xf8, 0x08, 0xdc, 0x00, 0x66, 0xa3, 0x1c, 0x11, 0xdc, 0x00, 0x33, 0xc9, 0x8a, 0x0d, 0xf9, 0x08, 0xdc, 0x00];
      await writeMemory(addresses.menu_always_enabled, code, DataType.Buffer);
    },
    setGameMoment: async (gameMoment: number) => {
      await writeMemory(addresses.game_moment, gameMoment, DataType.Short);
    },
    setGP: async (gp: number) => {
      await writeMemory(addresses.gp, gp, DataType.Short);
    },
    setDisc: async (disc: number) => {
      await writeMemory(addresses.disc_id, disc, DataType.Byte);
    },
    setGil: async (gil: number) => {
      await writeMemory(addresses.gil, gil, DataType.Int);
    },
    setBattleCount: async (battleCount: number) => {
      await writeMemory(addresses.battle_count, battleCount, DataType.Short);
    },
    setBattleEscapeCount: async (battleEscapeCount: number) => {
      await writeMemory(addresses.battle_escape_count, battleEscapeCount, DataType.Short);
    },
    setInGameTime: async (inGameTime: number) => {
      await writeMemory(addresses.in_game_time, inGameTime, DataType.Int);
    },
    setHP: async (hp: number, index: number) => {
      await writeMemory(addresses.battle_char_base + index * 104 + 0x2c, hp, DataType.Int);
    },
    setMP: async (mp: number, index: number) => {
      await writeMemory(addresses.battle_char_base + index * 104 + 0x28, mp, DataType.Short);
    },
    setStatus: async (status: number, index: number) => {
      await writeMemory(addresses.battle_char_base + index * 104, status, DataType.Int);
    },
    enableInvincibility: async () => {
      // Function to write state flags for all allies
      const code = [0xE8, 0xC4, 0x37, 0x1B, 0x00, 0x53, 0xBB, 0xDC, 0xB0, 0x9A, 0x00, 0xC6, 0x43, 0x05, 0x07, 
                    0xC6, 0x43, 0x6D, 0x07, 0xC6, 0x83, 0xD5, 0x00, 0x00, 0x00, 0x07, 0x5B, 0xC3];
      await writeMemory(addresses.code_cave, code, DataType.Buffer);
      await writeMemory(addresses.battle_init_chars_call, 0xfffe3f85, DataType.Int);

      // Set state flags for all allies immediately
      let flags = 0;
      for (let i = 0; i < 3; i++) {
        flags = await readMemory(addresses.battle_char_base + i * 104 + 5, DataType.Byte);
        flags |= 0x07;
        await writeMemory(addresses.battle_char_base + i * 104 + 5, flags, DataType.Byte);
      }
    },
    disableInvincibility: async () => {
      await writeMemory(addresses.battle_init_chars_call, 0x19774e, DataType.Int);

      // Set state flags for all allies immediately
      let flags = 0;
      for (let i = 0; i < 3; i++) {
        flags = await readMemory(addresses.battle_char_base + i * 104 + 5, DataType.Byte);
        flags &= 0xf8;
        await writeMemory(addresses.battle_char_base + i * 104 + 5, flags, DataType.Byte);
      }
    },
    toggleStatus: async (status: number, index: number) => {
      // Add Dual Drain because these two should be used together
      if (status === statuses.Dual) {
        status |= 0x8000000;
      }

      let statusFlags = await readMemory(addresses.battle_char_base + index * 104, DataType.Int);
      statusFlags ^= status;
      await writeMemory(addresses.battle_char_base + index * 104, statusFlags, DataType.Int);
    },
    toggleFlags: async (flags: number, index: number) => {
      let statusFlags = await readMemory(addresses.battle_char_base + index * 104 + 5, DataType.Byte);
      statusFlags ^= flags;
      await writeMemory(addresses.battle_char_base + index * 104 + 5, statusFlags, DataType.Byte);
    },
    readEnemyData: async (enemyId: number) => {
      return await invoke("read_enemy_data", { id: enemyId }) as EnemyData;
    },
    setExpMultiplier: async (multiplier: number) => {
      await writeMemory(addresses.battle_exp_calc, [0x8b, 0x88, 0x38, 0xB1, 0x9A, 0x00, 0x6B, 0xC9, multiplier, 0x01, 0x0D, 0xC0, 0xE2, 0x99, 0, 0x90, 0x90, 0x90], DataType.Buffer);
    },
    setApMultiplier: async (multiplier: number) => {
      await writeMemory(addresses.battle_ap_calc, [0x6B, 0xD2, multiplier, 0x01, 0x15, 0xC4, 0xE2, 0x99, 0, 0x90, 0x90, 0x90], DataType.Buffer);
    },
    gameOver: async () => {
      if (gameState.currentModule === GameModule.Battle) {
        for (let i = 0; i < 3; i++) {
          await writeMemory(addresses.battle_char_base + i * 104, statuses.Dead, DataType.Int);
        }
      } else if (gameState.currentModule === GameModule.Field) {
        await writeMemory(0xcc0d89, 26, DataType.Byte);
      } else if (gameState.currentModule === GameModule.World) {
        // Enter field module first and then issue a game over
        await writeMemory(0xCBF9DC, 1, DataType.Byte);
        await writeMemory(0xE045E4, 2, DataType.Byte);
        await writeMemory(0xE3A884, 0, DataType.Byte);
        await writeMemory(0xE3A894, 0x1700, DataType.Short);
        await writeMemory(0xCC0D8A, 0x64, DataType.Short);
        await writeMemory(0xE2A120, 0x10, DataType.Byte);
        await writeMemory(0xE045F0, 1, DataType.Byte);
        await writeMemory(0x969950, 0, DataType.Byte);
        await writeMemory(0xCC0D89, 26, DataType.Byte);
      }
    },
    setCurrentEntityWorldmapCoordinates: async (x: number, z: number) => {
      const currentObjPtr = await readMemory(addresses.world_current_obj_ptr, DataType.Int);
      await writeMemory(currentObjPtr + 0xC, x, DataType.Int);
      await writeMemory(currentObjPtr + 0x14, z, DataType.Int);
    },
    setWorldmapModelCoordinates: async (index: number, x: number, y: number, z: number, direction: number) => {
      const base = addresses.world_models;
      const length = 192;

      await writeMemory(base + index * length + 0xC, x, DataType.Int);
      await writeMemory(base + index * length + 0x10, y, DataType.Int);
      await writeMemory(base + index * length + 0x14, z, DataType.Int);
      await writeMemory(base + index * length + 0x40, direction, DataType.Int);
    },
    async saveState() {
      const memory = await readMemoryBuffer(0x99d000, 0x563000)
      const models = [];
      const fieldModelsBase = await readMemory(0xCFF738, DataType.Int);
      const fieldModelNum = await readMemory(0xcff73e, DataType.Byte);

      for (let i = 0; i < fieldModelNum; i++) {
        const model = await readMemoryBuffer(fieldModelsBase + i * 400, 400);
        const ptr = await readMemory(fieldModelsBase + i * 400 + 0x178, DataType.Int);
        const ptrData = await readMemoryBuffer(ptr, 144);
        models.push({
          data: model,
          ptrData
        });
      }

      const fieldDataPtr = await readMemory(0xCFF594, DataType.Int);
      const section9Offset = await readMemory(fieldDataPtr + 38, DataType.Int);
      const section9Length = await readMemory(fieldDataPtr + section9Offset, DataType.Int);
      const totalLength = section9Offset + section9Length + 17;
      const fieldData = await readMemoryBuffer(fieldDataPtr, totalLength);

      SaveStates.push({
        savemap: memory,
        models: models,
        fieldData
      });
    },
    async loadState() {
      if (SaveStates.length === 0) return;
      const state = SaveStates[SaveStates.length - 1];
      if (state) {
        await writeMemory(0x99d000, state.savemap, DataType.Buffer);
        const fieldModelsBase = await readMemory(0xCFF738, DataType.Int);
        for (let i = 0; i < state.models.length; i++) {
          const model = state.models[i];
          await writeMemory(fieldModelsBase + i * 400, model.data, DataType.Buffer);
          const ptr = await readMemory(fieldModelsBase + i * 400 + 0x178, DataType.Int);
          await writeMemory(ptr, model.ptrData, DataType.Buffer);
        }

        const fieldDataPtr = await readMemory(0xCFF594, DataType.Int);
        await writeMemory(fieldDataPtr, state.fieldData, DataType.Buffer);

        const scrollX = await readMemory(0xCC15F0, DataType.Short);
        const scrollY = await readMemory(0xCC15F4, DataType.Short);
        await writeMemory(0xCC0D92, scrollX + 1, DataType.Short);
        await writeMemory(0xCC0D94, scrollY, DataType.Short);
        await writeMemory(0xCC0DA5, 4, DataType.Byte);
        await writeMemory(0xCC0DA7, 0, DataType.Byte);
        setTimeout(async () => {
          await writeMemory(0xCC0DA5, 0, DataType.Byte);
          await writeMemory(0xCC0DA7, 0, DataType.Byte);
        }, 25);
      }
    },
    async warpToFieldId(id: number, destination?: {x: number, y: number, triangleId: number, direction?: number}) {
      await writeMemory(addresses.field_global_obj + 2, id, DataType.Short);

      if (destination) {
        await writeMemory(addresses.field_global_obj + 4, destination.x, DataType.SignedShort);
        await writeMemory(addresses.field_global_obj + 6, destination.y, DataType.SignedShort);
        await writeMemory(addresses.field_global_obj + 0x22, destination.triangleId, DataType.Short);
        if (destination.direction) {
          await writeMemory(addresses.field_global_obj + 0x24, destination.direction, DataType.Short);
        }
      }

      if (gameState.currentModule === GameModule.Field) {
        await writeMemory(addresses.field_global_obj + 1, 1, DataType.Byte);
      } else if (gameState.currentModule === GameModule.World) {
        await writeMemory(addresses.world_mode, 2, DataType.Byte);
        await writeMemory(addresses.world_mode + 0xC, 1, DataType.Byte);
      }
    },
    async setWorldZoomTiltEnabled(enabled: boolean) {
      await writeMemory(addresses.world_zoom_tilt_enabled, enabled ? 0x01 : 0x00, DataType.Byte);
    },
    async setWorldZoom(zoom: number) {
      await writeMemory(addresses.world_zoom, zoom, DataType.Short);
    },
    async setWorldTilt(tilt: number) {
      await writeMemory(addresses.world_tilt, tilt, DataType.Short);
    },
    async setWorldSpeedMultiplier(multiplier: number) {
      await writeMemory(addresses.world_speed_multiplier, multiplier, DataType.Byte);
    },
  };

  return ff7;
}

export type FF7 = ReturnType<typeof useFF7>;