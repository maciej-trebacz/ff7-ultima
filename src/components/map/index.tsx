import { FF7Provider } from "@/FF7Context";
import { ThemeProvider } from "@/components/theme-provider"
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useEffect, useState } from "react";
import { MapId, useMapState } from "@/hooks/useMapState";
import { useLgpState } from "@/hooks/useLgpState";
import MapViewer from "./MapViewer";
import { MapType } from "./types";

const MapTypes = [
  { id: 0, name: "overworld" },
  { id: 2, name: "underwater" },
  { id: 3, name: "glacier" },
] as const;

function App() {
  const { setDataPath, dataPath, loadMap, loadTextures, textures } = useMapState();
  const { loadLgp, opened } = useLgpState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worldMapType, setWorldMapType] = useState<number>(0);

  useEffect(() => {
    const window = getCurrentWebviewWindow();
    if (window) {
      const unlisten = window.listen("ff7-data", (event) => {
        const mapType = (event?.payload as any)?.worldMapType;
        if (mapType !== undefined && mapType !== worldMapType) {
          console.log("Updating worldMapType from", worldMapType, "to", mapType);
          setWorldMapType(mapType);
        }
      });

      return () => {
        unlisten.then(fn => fn());
      };
    }
  }, [worldMapType]);

  const mapType = MapTypes.find(type => type.id === worldMapType)?.name as MapType;
  const mapId = "WM" + worldMapType as MapId;

  useEffect(() => {
    const fetchDataPath = async () => {
      try {
        const path = await invoke<string>("get_current_game_directory");
        setDataPath(path);
        console.debug("Data path fetched", path);
      } catch (err) {
        setError(err as string);
      }
    }
    fetchDataPath();

  }, []);

  useEffect(() => {
    const load = async () => {
      if (dataPath) {
        await loadLgp(dataPath);
      }
    }
    load();
  }, [dataPath]);

  useEffect(() => {
    setIsLoading(true);
    const load = async () => {
      if (opened) {
        await loadTextures(mapType);
      }
    }
    load();
  }, [opened, mapType]);

  useEffect(() => {
    const load = async () => {
      if (textures.length) {
        await loadMap(mapId, mapType);
        setIsLoading(false);
      }
    }
    load();
  }, [textures, mapId, mapType]);

  return (
    <FF7Provider>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <MapViewer
        isLoading={isLoading}
      />
    </ThemeProvider>
    </FF7Provider>
  );
}

export default App;