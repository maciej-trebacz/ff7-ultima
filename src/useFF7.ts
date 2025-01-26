"use strict";

import { invoke } from "@tauri-apps/api/core";
import { DataType, readMemory, writeMemory, setMemoryProtection, readMemoryBuffer } from "./memory";
import { waitFor } from "./util";
import { useFF7State } from "./state";
import { EnemyData, GameModule, RandomEncounters, WorldFieldTblItem } from "./types";
import { FF7Addresses } from "./ff7Addresses";
import { PositiveStatuses, statuses } from "./ff7Statuses";
import { battles } from "./ff7Battles";
import { useEffect } from "react";
import { OpcodeWriter } from "./opcodewriter";
import { loadHackSettings } from "./settings";

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

const hex = (str: string) => str.split(" ").map((s) => parseInt(s, 16));

export function useFF7(addresses: FF7Addresses) {
  const { connected, gameState, hacks, setHacks } = useFF7State();

  // Add the proxy function where we can inject our own code that runs every frame
  const fnCallerBaseAddr = addresses.code_cave_fn_caller;
  const fnCallerMainAddr = fnCallerBaseAddr + 18;
  const fnCallerAfterFlipAddr = fnCallerBaseAddr + 33;

  useEffect(() => {
    async function initializeGfxFlip() {
      // Call GfxFlip and return
      let code = hex("55 8B EC 8B 45 08 50 E8 7E 45 24 00 83 C4 04 5D C3");
      await writeMemory(fnCallerMainAddr, code, DataType.Buffer);

      // Replace the call to GfxFlip in WinMain
      code = hex("E8 4F E2 D9 FF");
      await writeMemory(addresses.main_gfx_flip_call, code, DataType.Buffer);

      // Add a function for overwriting code once it runs
      code = hex("5E 58 83 C0 07 8B DE 29 C3 C6 03 5D C6 43 01 C3 56 C3");
      await writeMemory(fnCallerBaseAddr, code, DataType.Buffer);

      setMemoryProtection(fnCallerBaseAddr, 0x50);
    }

    async function applyHackSettings() {
      const settings = await loadHackSettings();
      if (settings) {
        if (settings.speed) await ff7.setSpeed(parseFloat(settings.speed));
        if (settings.skipIntros !== undefined) settings.skipIntros ? ff7.enableSkipIntro() : ff7.disableSkipIntro();
        if (settings.unfocusPatch !== undefined) settings.unfocusPatch ? ff7.patchWindowUnfocus() : ff7.unpatchWindowUnfocus();
        if (settings.swirlSkip !== undefined) settings.swirlSkip ? ff7.disableBattleSwirl() : ff7.enableBattleSwirl();
        if (settings.randomBattles !== undefined) {
          if (settings.randomBattles === RandomEncounters.Off) {
            ff7.disableBattles();
          } else if (settings.randomBattles === RandomEncounters.Normal) {
            ff7.enableBattles();
          } else if (settings.randomBattles === RandomEncounters.Max) {
            ff7.maxBattles();
          }
        }
      }
    }

    if (connected) {
      initializeGfxFlip();
      applyHackSettings();
    }
  }, [connected]);

  type FnCall = { address: number; params?: number[] };

  const callGameFns = async (fns: FnCall[]) => {
    const startOffset = fnCallerAfterFlipAddr;
    const writer = new OpcodeWriter(startOffset);

    // Call the requested functions
    fns.forEach((fn) => {
      writer.writeCall(fn.address, fn.params);
    });

    // Call the overwrite function to make sure we call only once
    const length = writer.offset - startOffset;
    writer.writeCall(fnCallerBaseAddr, [length], true);

    writer.writeReturn();
    await writeMemory(startOffset, writer.opcodes, DataType.Buffer);
  };

  const callGameFn = async (address: number, params?: number[]) => {
    await callGameFns([{ address, params }]);
  };

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
    callGameFn,
    callGameFns,
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
      await writeMemory(0x60e434, hex("90 90 90 90 90 90"), DataType.Buffer);
      await writeMemory(0x74bd02, hex("90 90 90 90 90 90"), DataType.Buffer);
      await writeMemory(0x41b6d8, hex("90 90 90 90 90 90"), DataType.Buffer);

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
      await writeMemory(addresses.field_battle_disable, hex("e9 e0 02 00 00 90"), DataType.Buffer);

      // World
      await writeMemory(addresses.world_battle_disable, 0, DataType.Byte);
    },
    enableBattles: async () => {
      // Field
      await writeMemory(addresses.field_battle_disable, hex("0f 83 df 02 00 00"), DataType.Buffer);

      // World
      await writeMemory(addresses.world_battle_enable, 0x0a, DataType.Byte);
      await writeMemory(addresses.world_battle_disable, 0x01, DataType.Byte);
    },
    maxBattles: async () => {
      await writeMemory(addresses.field_battle_disable, hex("90 90 90 90 90 90"), DataType.Buffer);

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

        // TODO: Play opening bombing mission music
      }
    },
    startBattle: async (battleId: number, musicId: number) => {
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

          if (musicId) {
            await writeMemory(fieldObjPtr + 68, musicId - 1, DataType.Byte);
          }

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
      await writeMemory(addresses.instant_atb_set, hex("c7 45 fc ff ff 00 00 90 90 90"), DataType.Buffer); // mov [ebp-04],0000FFFF and 3 nops
      const charObjLength = 68;
      for (let i = 0; i < 3; i++) {
        await writeMemory(addresses.battle_atb_base + i * charObjLength, 0xffff, DataType.Short);
      }
    },
    disableInstantATB: async () => {
      await writeMemory(addresses.instant_atb_set, hex("66 8b 0d 00 ad 9a 00 99 f7 f9"), DataType.Buffer);
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
      const code = hex("c7 05 30 11 dc 00 00 00 00 00 c7 05 1c 11 dc 00 ff ff 00 00 eb 5f");
      await writeMemory(addresses.menu_always_enabled, code, DataType.Buffer);
    },
    disableMenuAlwaysEnabled: async () => {
      const code = hex("66 0f b6 05 f8 08 dc 00 66 a3 1c 11 dc 00 33 c9 8a 0d f9 08 dc 00");
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
    // TODO: Make it work outside battle too, check current module
    setHP: async (hp: number, index: number) => {
      if (gameState.currentModule !== GameModule.Battle) {
        await writeMemory(addresses.character_records + index * 0x84 + 0x2c, hp, DataType.Short);
      } else {
        await writeMemory(addresses.battle_char_base + index * 104 + 0x2c, hp, DataType.Int);
      }
    },
    setMP: async (mp: number, index: number) => {
      if (gameState.currentModule !== GameModule.Battle) {
        await writeMemory(addresses.character_records + index * 0x84 + 0x28, mp, DataType.Short);
      } else {
        await writeMemory(addresses.battle_char_base + index * 104 + 0x28, mp, DataType.Short);
      }
    },
    setStatus: async (status: number, index: number) => {
      if (gameState.currentModule !== GameModule.Battle) {
        await writeMemory(addresses.character_records + index * 0x84, status, DataType.Byte);
      } else {
        await writeMemory(addresses.battle_char_base + index * 104, status, DataType.Int);
      }
    },
    enableInvincibility: async () => {
      // Function to write state flags for all allies
      const code = hex("E8 C4 37 1B 00 53 BB DC B0 9A 00 C6 43 05 07 C6 43 6D 07 C6 83 D5 00 00 00 07 5B C3");
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
      const value = multiplier.toString(16);
      await writeMemory(addresses.battle_exp_calc, hex(`8b 88 38 B1 9A 00 6B C9 ${value} 01 0D C0 E2 99 00 90 90 90`), DataType.Buffer);
    },
    setApMultiplier: async (multiplier: number) => {
      const value = multiplier.toString(16);
      await writeMemory(addresses.battle_ap_calc, hex(`6B D2 ${value} 01 15 C4 E2 99 00 90 90 90`), DataType.Buffer);
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
    setFieldModelCoordinates: async (index: number, x: number, y: number, z: number, direction: number) => {
      const base = addresses.field_models_coords;
      const length = 0x88;

      await writeMemory(base + index * length, x << 12, DataType.SignedInt);
      await writeMemory(base + index * length + 4, y << 12, DataType.SignedInt);
      await writeMemory(base + index * length + 8, z << 12, DataType.SignedInt);
      await writeMemory(base + index * length + 44, direction, DataType.Byte);
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
        await writeMemory(addresses.world_battle_flag3, 0, DataType.Byte);
        await writeMemory(addresses.world_mode, 2, DataType.Byte);
        await writeMemory(addresses.world_mode + 0xC, 1, DataType.Byte);
      }

      // Reset all sound channel volumes to cancel looping sounds
      setTimeout(async () => {
        const fns = Array(4).fill(0).map((_, i) => ({
          address: addresses.sound_command_fn, 
          params: [40 + i, 0, 0, 0, 0, 0]
        }));
        await callGameFns(fns);
      }, 100);

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
    async setPartyMemberSlot(slot: number, id: number) {
      await writeMemory(addresses.party_member_ids + slot, id, DataType.Byte);
      await callGameFns([
        {address: 0x6cd13a, params: []},
        {address: 0x6c545b, params: [slot]},
        {address: 0x5cb2cc, params: [slot]},
        {address: 0x5cb127, params: []},
      ]);

    },
    async getItemNames() {
      return invoke("read_item_names");
    },
    async getMateriaNames() {
      return invoke("read_materia_names");
    },
    async getKeyItemNames() {
      return invoke("read_key_item_names");
    },
    async addItem(id: number, quantity: number) {
      const itemId = id | quantity << 9;
      await callGameFn(addresses.party_add_item_fn, [itemId]);
    },
    async addMateria(id: number, ap: number) {
      const materiaId = (id | ap << 8) >>> 0; // Convert to unsigned
      await callGameFn(addresses.party_add_materia_fn, [materiaId]);
    },
    async setKeyItems(keyItemIds: number[]) {
      const bytes = new Array(8).fill(0);
      
      // Set bits for each key item
      for (const id of keyItemIds) {
        const byteIndex = Math.floor(id / 8);
        const bitIndex = id % 8;
        bytes[byteIndex] |= (1 << bitIndex);
      }
      
      await writeMemory(addresses.key_items, bytes, DataType.Buffer);

      // Reload the key items in memory if the menu is currently open
      await callGameFn(addresses.menu_load_key_items_fn, []);
    },
    async fullHeal() {
      if (gameState.currentModule === GameModule.Battle) {
        for (let charIdx = 0; charIdx < 3; charIdx++) {
          const maxHp = ff7.gameState.battleAllies[charIdx].max_hp;
          const maxMp = ff7.gameState.battleAllies[charIdx].max_mp;
          const status = ff7.gameState.battleAllies[charIdx].status;
          await ff7.setHP(maxHp, charIdx);
          await ff7.setMP(maxMp, charIdx);
          await ff7.setStatus(status & PositiveStatuses, charIdx);
        }
        await ff7.callGameFn(0x745606, [64, 263, 0, 0, 0]);
      } else {
        // Call PartyFullHealClearStatus() and then play the cure sound
        await ff7.callGameFns([{
          address: 0x61f6b0,
          params: [],
        }, {
          address: 0x745606,
          params: [64, 263, 0, 0, 0],
        }]);
      }
    },
    async toggleLimitBar() {
      if (ff7.gameState.currentModule !== GameModule.Battle) {
        const slot1Id = ff7.gameState.partyMemberIds[0];
        let limit = ff7.gameState.partyMembers[slot1Id].limit;
        if (limit !== 0xFF) limit = 0xFF; else limit = 0;
        for (let i = 0; i < 3; i++) {
          const idx = gameState.partyMemberIds[i];
          if (idx === 0xFF) continue;
          await writeMemory(addresses.character_records + idx * 0x84 + 0xf, limit, DataType.Byte);
        }
      } else {
        let limit = gameState.battleAllies[0].limit;
        if (limit !== 0xFF) {
          for (let i = 0; i < 3; i++) {
            await writeMemory(addresses.battle_char_array + i * 0x34 + 0x8, 0xFF, DataType.Short);
          }
        } else {
          await ff7.callGameFns([0, 1, 2].map(i => ({
            address: 0x434df3,
            params: [i]
          })));
        }
      }
    },
    async getWorldFieldTblData() {
      await callGameFn(addresses.world_load_data_fn, [addresses.str_field_tbl, 0x600, addresses.world_field_tbl_data, 0])
      await waitFor(async () => {
        const data = await readMemory(addresses.world_field_tbl_data, DataType.Int);
        return data !== 0;
      });
      return await invoke("read_world_field_tbl_data") as WorldFieldTblItem[];
    },
    async getVariables(bank: number) {
      return await invoke("read_variables_bank", { bank }) as number[];
    },
    async setVariable(bank: number, address: number, value: number) {
      return await invoke("write_variable_8bit", { bank, address, value });
    },
    async setVariable16(bank: number, address: number, value: number) {
      return await invoke("write_variable_16bit", { bank, address, value });
    }
  };

  return ff7;
}

export type FF7 = ReturnType<typeof useFF7>;