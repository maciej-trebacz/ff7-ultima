"use strict";

import { DataType, readMemory, writeMemory, setMemoryProtection } from "./memory";
import { waitFor } from "./util";
import { useFF7State } from "./state";
import { GameModule } from "./types";

export function useFF7() {
  const { connected, gameState, hacks, setHacks } = useFF7State();

  const getFieldObjPtr = async () => {
    const fieldObjPtr = await readMemory(0xCBF9D8, DataType.Int);
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
      await writeMemory(0xf4f448, 0x01, DataType.Byte);
    }, 0);
  }

  const ff7 = {
    connected,
    gameState,
    setSpeed: async (speed: number) => {
      const ffnxCheck = await readMemory(0x41b965, DataType.Byte);
      if (ffnxCheck === 0xE9) {
        const baseAddress = await readMemory(0x41b966, DataType.Int) + 0x41B96A;
        const addrFps30 = await readMemory(baseAddress + 0xa, DataType.Int);
        const addrFps15 = await readMemory(baseAddress + 0xa6, DataType.Int);

        // FFnx replaces FF7's built-in FPS limiter with a custom one
        // so we have to use a different method to set the speed
        await setMemoryProtection(addrFps15, 16);

        // Field & World
        await writeMemory(addrFps30, 30 * speed, DataType.Float);

        // Battle
        await writeMemory(addrFps15, 15 * speed, DataType.Float);
        return;
      }

      const setFps = async (address: number, defaultFps: number) => {
        await writeMemory(address, 10000000 / (defaultFps * speed), DataType.Float);
      };

      // Set FPS for each module
      // Field
      await setFps(0xcff890, 30);
      // Battle
      await setFps(0x9ab090, 15);
      // World
      await setFps(0xde6938, 30);

      // Remove FPS init code for each module so it doesn't get reset on module init
      // Field
      await writeMemory(0x60e434, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90], DataType.Buffer);
      // World
      await writeMemory(0x74bd02, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90], DataType.Buffer);
      // Battle
      await writeMemory(0x41b6d8, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90], DataType.Buffer);
    },
    toggleMenuAccess: async () => {
      await writeMemory(0xcc0dbc, gameState.fieldMenuAccessEnabled ? 0 : 1, DataType.Byte);
    },
    toggleMovement: async () => {
      await writeMemory(0xcc0dba, gameState.fieldMovementDisabled ? 0 : 1, DataType.Byte);
    },
    enableAllMenus: async () => {
      await writeMemory(0xdc08f8, 0xffff, DataType.Short);
      await writeMemory(0xdc08fa, 0, DataType.Short);
    },
    enableAllPartyMembers: async () => {
      await writeMemory(0xdc0dde, 0x7ff, DataType.Short);
    },
    disableBattles: async () => {
      // Field
      await writeMemory(0x60b40a, [0xe9, 0xe0, 0x02, 0x00, 0x00, 0x90], DataType.Buffer);

      // World
      await writeMemory(0x7675f6, 0, DataType.Byte);
    },
    enableBattles: async () => {
      // Field
      await writeMemory(0x60b40a, [0x0f, 0x83, 0xdf, 0x02, 0x00, 0x00], DataType.Buffer);

      // World
      await writeMemory(0x767758, 0x0a, DataType.Byte);
      await writeMemory(0x7675f6, 0x01, DataType.Byte);
    },
    maxBattles: async () => {
      await writeMemory(0x60b40a, [0x90, 0x90, 0x90, 0x90, 0x90, 0x90], DataType.Buffer);

      // World
      await writeMemory(0x767758, 0x0f, DataType.Byte);
      await writeMemory(0x7675f6, 0x10, DataType.Byte);
    },
    endBattle: async () => {
      if (gameState.currentModule === GameModule.Battle) {
        const checkForBattleEnd = async () => {
          try {
            const battleMode = await readMemory(0x9aad64, DataType.Byte);
            if (battleMode > 5) {
              await writeMemory(0x9ab0c2, 0x08, DataType.Byte);
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
      await writeMemory(0x74a561, 0x80, DataType.Byte);

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
      await writeMemory(0x74a561, 0, DataType.Byte);
    },
    skipFMV: async () => {
      const isMoviePlaying = await readMemory(0x9a1010, DataType.Byte);
      if (isMoviePlaying === 0) {
        return;
      }
      await writeMemory(0x9a1014, 0x01, DataType.Byte);

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
          await writeMemory(0xcbf6b8, 1, DataType.Byte);

          // Wait for the battle to start
          await waitFor(async () => {
            return (await readMemory(0xcbf9dc, DataType.Byte)) === GameModule.Battle;
          });

          // Reset the game module variable
          await writeMemory(fieldObjPtr + 1, 0, DataType.Byte);
          break;
        case GameModule.World:
          await writeMemory(0xe3a88c, battleId, DataType.Int);
          await writeMemory(0xe2bbc8, 0, DataType.Int);
          await writeMemory(0x969950, 0, DataType.Int);
          await writeMemory(0xe3a884, 1, DataType.Int);
          await writeMemory(0xe045e4, 3, DataType.Int);
          
          break;
        default:
          return;
      }
    },
    disableBattleSwirl: async () => {
      await writeMemory(0x402712, 0x00, DataType.Byte);
      await writeMemory(0x4027e5, 0x00, DataType.Byte);
    },
    enableBattleSwirl: async () => {
      await writeMemory(0x402712, 0x2e, DataType.Byte);
      await writeMemory(0x4027e5, 0x4e, DataType.Byte);
    },
    enableInstantATB: async () => {
      await writeMemory(0x433abd, [0xc7, 0x45, 0xfc, 0xff, 0xff, 0x00, 0x00, 0x90, 0x90, 0x90], DataType.Buffer); // mov [ebp-04],0000FFFF and 3 nops
      const atbIncreasePtrBase = 0x9a8b12;
      const charObjLength = 68;
      for (let i = 0; i < 3; i++) {
        await writeMemory(atbIncreasePtrBase + i * charObjLength, 0xffff, DataType.Short);
      }
    },
    disableInstantATB: async () => {
      await writeMemory(0x433abd, [0x66, 0x8b, 0x0d, 0x00, 0xad, 0x9a, 0x00, 0x99, 0xf7, 0xf9], DataType.Buffer);
    },
    enableSkipIntro: async () => {
      setHacks({ ...hacks, skipIntro: true });
    },
    disableSkipIntro: async () => {
      setHacks({ ...hacks, skipIntro: false });
    },
    introDisabled: hacks.skipIntro,
    togglePHS: async (index: number) => {
      let bitmask = gameState.partyBitmask;
      if (index === -1) {
        bitmask = bitmask & 1 ? 0 : 0xffff;
      } else if (bitmask & (1 << index)) {
        bitmask &= ~(1 << index);
      } else {
        bitmask |= 1 << index;
      }
      await writeMemory(0xdc0dde, bitmask, DataType.Short);
    },
    partyMemberEnabled: (index: number) => {
      let bitmask = gameState.partyBitmask;
      return Boolean(bitmask & (1 << index));
    },
    toggleMenuVisibility: async (index: number) => {
      let menuVisibility = gameState.menuVisibility;
      if (index === -1) {
        menuVisibility = menuVisibility & 1 ? 0 : 0xffff;
      } else if (menuVisibility & (1 << index)) {
        menuVisibility &= ~(1 << index);
      } else {
        menuVisibility |= 1 << index;
      }
      await writeMemory(0xdc08f8, menuVisibility, DataType.Short);
    },
    menuVisibilityEnabled: (index: number) => {
      let menuVisibility = gameState.menuVisibility;
      return Boolean(menuVisibility & (1 << index));
    },
    toggleMenuLock: async (index: number) => {
      let menuLocks = gameState.menuLocks;
      if (index === -1) {
        menuLocks = menuLocks & 1 ? 0 : 0xffff;
      } else if (menuLocks & (1 << index)) {
        menuLocks &= ~(1 << index);
      } else {
        menuLocks |= 1 << index;
      }
      await writeMemory(0xdc08fa, menuLocks, DataType.Short);
    },
    menuLockEnabled: (index: number) => {
      let menuLocks = gameState.menuLocks;
      return Boolean(menuLocks & (1 << index));
    },
  };

  return ff7;
}