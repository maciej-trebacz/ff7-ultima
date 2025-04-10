import Row from "@/components/Row";
import { LocationName, WorldModelIds, WorldWalkmeshType } from "@/types";
import { FF7 } from "@/useFF7";
import Worldmap from "@/assets/worldmap.png";
import Chocobo from "@/assets/chocobo.png";
import { useEffect, useRef, useState } from "react";
import { EditPopover } from "@/components/EditPopover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Window } from "@tauri-apps/api/window"
import { Webview } from "@tauri-apps/api/webview"

export const WorldBounds = {
  x: { min: 0, max: 0x48000 },
  z: { min: 0, max: 0x38000 },
};

export function World(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;
  const [coords, setCoords] = useState({ x: 0, z: 0 });
  const [zoom, setZoom] = useState(0);
  const [tilt, setTilt] = useState(0);
  const worldmapRef = useRef<HTMLImageElement>(null);
  const [editValue, setEditValue] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCoord, setEditCoord] = useState<"x" | "y" | "z" | "direction" | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentModelEditing, setCurrentModelEditing] = useState<number | null>(null);
  const [mapWindow, setMapWindow] = useState<Window | null>(null);
  const [mapWebview, setMapWebview] = useState<Webview | null>(null);

  const convertCoordinates = (x: number, z: number) => {
    const imageDimensions = worldmapRef.current!.getBoundingClientRect();
    return {
      x: x / WorldBounds.x.max * imageDimensions.width,
      z: z / WorldBounds.z.max * imageDimensions.height,
    };
  };

  useEffect(() => {
    if (!worldmapRef.current) return;
    setCoords(convertCoordinates(state.worldCurrentModel.x, state.worldCurrentModel.z));
  }, [state.worldCurrentModel]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!worldmapRef.current) return;
    const imageDimensions = worldmapRef.current.getBoundingClientRect();
    const x = e.clientX - imageDimensions.left;
    const z = e.clientY - imageDimensions.top;
    const xCoord = Math.round(x / imageDimensions.width * WorldBounds.x.max);
    const zCoord = Math.round(z / imageDimensions.height * WorldBounds.z.max);
    ff7.setCurrentEntityWorldmapCoordinates(xCoord, zCoord);
  };

  const isUnderwater = state.worldCurrentModel.y < -1000;

  const openEditPopover = (title: string, value: string, modelIndex: number, coord: "x" | "y" | "z" | "direction") => {
    setEditValue(value);
    setEditTitle(title);
    setCurrentModelEditing(modelIndex);
    setEditCoord(coord);
    setPopoverOpen(true);
  }

  const submitValue = () => {
    if (currentModelEditing !== null && editCoord) {
      const model = state.worldModels[currentModelEditing];
      ff7.setWorldmapModelCoordinates(
        model.index,
        editCoord === "x" ? parseInt(editValue) : model.x,
        editCoord === "y" ? parseInt(editValue) : model.y,
        editCoord === "z" ? parseInt(editValue) : model.z,
        editCoord === "direction" ? parseInt(editValue) : model.direction
      );
    }
    setPopoverOpen(false);
  }

  const modelsToRender = [WorldModelIds.Buggy, WorldModelIds.Highwind, WorldModelIds.Submarine, WorldModelIds.Chocobo, WorldModelIds.WildChocobo, WorldModelIds.TinyBronco, WorldModelIds.UltimateWeapon, WorldModelIds.DiamondWeapon, WorldModelIds.RubyWeapon, WorldModelIds.EmeraldWeapon];
  const icons = modelsToRender.map((model, index) => {
    const modelIndex = state.worldModels.findIndex((m) => m.model_id === model);
    if (modelIndex === -1) return null;
    if (model === state.worldCurrentModel.model_id) return null;

    return (
      <div key={model} style={{
        left: `${state.worldModels[modelIndex].x / WorldBounds.x.max * 100}%`,
        top: `${state.worldModels[modelIndex].z / WorldBounds.z.max * 100}%`,
        transform: `translate(-50%, -50%)`,
        position: "absolute",
        zIndex: 40
      }}>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div className="h-2.5 w-2.5 text-center rounded-full text-[8px] leading-[10px] text-white bg-slate-800 border border-white box-content">
              {WorldModelIds[model][0]}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{WorldModelIds[model]}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  });

  const handleOpenMapViewer = async () => {
    if (mapWindow) {
      await mapWindow.setFocus();
      return;
    }

    const appWindow = new Window('mapviewer', {
      parent: Window.getCurrent(),
      title: 'Ultima - Map Viewer',
      theme: 'dark',
      resizable: true,
      visible: false,
      center: true,
      width: 800,
      height: 600,
      backgroundColor: '#111212',
    });

    appWindow.once('tauri://created', (e) => {
      const webview = new Webview(appWindow, 'mapviewer', {
        url: 'map.html',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        focus: true,
        backgroundColor: '#111212',
      });
      
      const resize = async () => {
        const size = await appWindow.innerSize();
        await webview.setSize(size);
      }

      webview.once('tauri://created', () => {
        resize();
        appWindow.show();
      });

      // Listen for window resize events
      appWindow.listen("tauri://resize", resize);
      resize();

      setMapWindow(appWindow);
      setMapWebview(webview);

      appWindow.onCloseRequested(() => {
        setMapWindow(null);
        setMapWebview(null);
      });
    });
  }

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      if (mapWindow) {
        mapWindow.close();
      }
    };
  }, [mapWindow]);

  useEffect(() => {
    if (mapWebview) {
      mapWebview.emit("ff7-data", state);
    }
  }, [mapWebview, state]);

  return (
    <div>
      <h4 className="text-center mt-2 mb-1 font-medium">Current Position</h4>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="X">{ff7.gameState.worldCurrentModel.x}</Row>
        </div>
        <div className="flex-1">
          <Row label="Y">{ff7.gameState.worldCurrentModel.y}</Row>
        </div>
        <div className="flex-1">
          <Row label="Z">{ff7.gameState.worldCurrentModel.z}</Row>
        </div>
      </div>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="Direction">{ff7.gameState.worldCurrentModel.direction}</Row>
        </div>
        <div className="flex-1">
          <Row label="Model">{WorldModelIds[ff7.gameState.worldCurrentModel.model_id]}</Row>
        </div>
        <div className="flex-1">
          <Row label="Script ID">{ff7.gameState.worldCurrentModel.script}</Row>
        </div>
      </div>
      <div className="flex gap-1">
        <Row label="Location & Terrain">
          {ff7.gameState.worldCurrentModel.location_id !== undefined && ff7.gameState.worldCurrentModel.location_id !== 255 && LocationName[ff7.gameState.worldCurrentModel.location_id]}
          {" - "}
          {WorldWalkmeshType[ff7.gameState.worldCurrentModel.walkmesh_type] || ff7.gameState.worldCurrentModel.walkmesh_type}
          {ff7.gameState.worldCurrentModel.chocobo_tracks && <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <img src={Chocobo} className="inline ml-1.5 h-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">On Chocobo tracks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>}
        </Row>
      </div>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="Zoom & Tilt">
            <Switch checked={ff7.gameState.worldZoomTiltEnabled} onCheckedChange={(checked) => ff7.setWorldZoomTiltEnabled(checked)} />
          </Row>
        </div>
        <div className="flex-1">
          <Row label="Super Speed">
            <Switch 
              checked={ff7.gameState.worldSpeedMultiplier === 12} 
              onCheckedChange={(checked) => ff7.setWorldSpeedMultiplier(checked ? 12 : 2)} 
            />
          </Row>
        </div>
        <div className="flex-1">
          <Row label="Walk Anywhere">
            <Switch 
              checked={ff7.gameState.walkAnywhereEnabled}
              onCheckedChange={() => !ff7.gameState.walkAnywhereEnabled ? ff7.enableWalkAnywhere() : ff7.disableWalkAnywhere()} 
            />
          </Row>
        </div>
      </div>
      {ff7.gameState.worldZoomTiltEnabled && (
        <>
          <div className="flex gap-2 p-2 bg-zinc-800 rounded-md text-xs">
            <div className="flex-1 flex items-center gap-2">
              <div>Zoom</div>
                <Slider 
                  value={[zoom]} 
                  onValueChange={async (value) => {
                    setZoom(value[0]);
                    await ff7.setWorldZoom(value[0]);
                  }}
                  min={1000}
                  max={15000}
                  step={100}
                  className="w-full"
                />
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div>Tilt</div>
                <Slider 
                  value={[tilt]} 
                  onValueChange={async (value) => {
                    setTilt(value[0]);
                    await ff7.setWorldTilt(value[0]);
                  }}
                  min={1160}
                  max={1920}
                  step={20}
                  className="w-full"
                />
            </div>
          </div>
        </>
      )}
      
      <div className="relative mb-2 mt-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="uppercase font-medium text-sm tracking-wide text-zinc-900 dark:text-zinc-100">
            Map
          </h2>
          <div className="flex space-x-2">
            <Button variant="default" size="xs" onClick={handleOpenMapViewer}>
              Open Map Viewer
            </Button>
          </div>
        </div>
        <div className="border-b border-zinc-600 -mt-1" />
      </div>

      <div className="relative select-none" onClick={handleMapClick}>
        <img src={Worldmap} ref={worldmapRef} />
        {icons}
        <div className="absolute z-50 w-2 h-2 bg-orange-600 border-2 border-white rounded-full animate-pulse" style={{ top: `${coords.z - 4}px`, left: `${coords.x - 4}px` }}></div>
      </div>

      {state.worldModels && state.worldModels.length > 0 && <>
        <h4 className="text-center mt-2 mb-1 font-medium">World Models</h4>
        <table className="w-full">
          <thead className="bg-zinc-800 text-xs text-left">
            <tr>
              <th className="p-1">Model</th>
              <th className="p-1 px-2">X</th>
              <th className="p-1 px-2">Y</th>
              <th className="p-1 px-2">Z</th>
              <th className="p-1">Direction</th>
            </tr>
          </thead>
          <tbody>
            {state.worldModels.map((model, index) => {
              return (
                <tr
                  key={index}
                  className={`bg-zinc-800 text-xs ${model.model_id === state.worldCurrentModel.model_id && (!isUnderwater || model.y < -2500)
                    ? 'bg-slate-700 font-bold'
                    : ''
                    }`}
                >
                  <td className="p-1 text-nowrap w-14 font-bold">{WorldModelIds[model.model_id]}</td>
                  <td className="text-nowrap">
                    <EditPopover
                      open={popoverOpen && currentModelEditing === index && editCoord === "x"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <div className="p-1 px-2 cursor-pointer hover:bg-zinc-700 w-full" onClick={() => openEditPopover("X", model.x.toString(), index, "x")}>
                              {model.x}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                  </td>
                  <td className="text-nowrap">
                    <EditPopover
                      open={popoverOpen && currentModelEditing === index && editCoord === "y"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <div className="p-1 px-2 cursor-pointer hover:bg-zinc-700 w-full" onClick={() => openEditPopover("Y", model.y.toString(), index, "y")}>
                              {model.y}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                  </td>
                  <td className="text-nowrap">
                    <EditPopover
                      open={popoverOpen && currentModelEditing === index && editCoord === "z"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <div className="p-1 px-2 cursor-pointer hover:bg-zinc-700 w-full" onClick={() => openEditPopover("Z", model.z.toString(), index, "z")}>
                              {model.z}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                  </td>
                  <td className="text-nowrap">
                    <EditPopover
                      open={popoverOpen && currentModelEditing === index && editCoord === "direction"}
                      onOpenChange={setPopoverOpen}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={submitValue}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={250}>
                          <TooltipTrigger asChild>
                            <div className="p-1 px-2 cursor-pointer hover:bg-zinc-700 w-full" onClick={() => openEditPopover("Direction", model.direction.toString(), index, "direction")}>
                              {model.direction}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Click to edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </EditPopover>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </>}
    </div>
  );
}