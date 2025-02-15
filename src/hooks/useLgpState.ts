import { atom, useAtom } from 'jotai'
import { LGP } from '@/ff7/lgp'
import { readFile, writeFile } from "@tauri-apps/plugin-fs"

interface LgpState {
  lgp: LGP | null
  path: string | null
  data: ArrayBuffer | null
  openedTime: number | null
}

const lgpStateAtom = atom<LgpState>({
  lgp: null,
  path: null,
  data: null,
  openedTime: null
})

export function useLgpState() {
  const [state, setState] = useAtom(lgpStateAtom)

  const loadLgp = async (gamePath: string) => {
    try {
      console.debug("[LGP] Loading LGP file from:", gamePath)
      const path = `${gamePath}/data/wm/world_us.lgp`
      const fileData = await readFile(path)
      const lgp = new LGP(fileData.buffer)
      setState({ lgp, path, data: fileData.buffer, openedTime: Date.now() })
      return lgp
    } catch (error) {
      console.error("Failed to load LGP file:", error)
      setState({ lgp: null, path: null, data: null, openedTime: null })
      throw error
    }
  }

  const getFile = async (filename: string): Promise<Uint8Array | null> => {
    try {
      if (!state.lgp) {
        throw new Error("LGP not loaded. Call loadLgp first.")
      }
      return state.lgp.getFile(filename)
    } catch (error) {
      console.error("Failed to read file:", error)
      return null
    }
  }

  const setFile = async (filename: string, data: Uint8Array): Promise<void> => {
    if (!state.lgp || !state.path) {
      throw new Error("LGP not loaded. Call loadLgp first.")
    }

    try {
      console.debug("[LGP] Setting file:", filename)
      state.lgp.setFile(filename, data)
      
      // Write the updated LGP archive back to disk
      const buffer = state.lgp.writeArchive()
      // Update the state with the new data
      setState({ ...state, data: buffer })
      await writeFile(state.path, new Uint8Array(buffer))
    } catch (error) {
      console.error("[LGP] Failed to write file:", error)
      throw error
    }
  }

  return {
    opened: !!state.lgp,
    openedTime: state.openedTime,
    loadLgp,
    getFile,
    setFile
  }
} 