import Row from "@/components/Row";
import { WorldModelType, WorldWalkmeshType } from "@/types";
import { FF7 } from "@/useFF7";
import Worldmap from "@/assets/worldmap.png";
import { useEffect, useRef, useState } from "react";

export const WorldBounds = {
  x: { min: 0, max: 0x48000 },
  z: { min: 0, max: 0x38000 },
};

export function World(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;
  const [coords, setCoords] = useState({ x: 0, z: 0 });
  const worldmapRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!worldmapRef.current) return;
    const imageDimensions = worldmapRef.current.getBoundingClientRect();
    setCoords({ x: state.worldCurrentModel.x / WorldBounds.x.max * imageDimensions.width, z: state.worldCurrentModel.z / WorldBounds.z.max * imageDimensions.height });
  }, [state.worldCurrentModel]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!worldmapRef.current) return;
    const imageDimensions = worldmapRef.current.getBoundingClientRect();
    const x = e.clientX - imageDimensions.left;
    const z = e.clientY - imageDimensions.top;
    const xCoord = Math.round(x / imageDimensions.width * WorldBounds.x.max);
    const zCoord = Math.round(z / imageDimensions.height * WorldBounds.z.max);
    console.log({ x, z, xCoord, zCoord });
    ff7.setWorldmapCoordinates(xCoord, zCoord);
  };

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
          <Row label="Model">{WorldModelType[ff7.gameState.worldCurrentModel.model_id]}</Row>
        </div>
        <div className="flex-1">
          <Row label="Terrain">
            {WorldWalkmeshType[ff7.gameState.worldCurrentModel.walkmesh_type] || ff7.gameState.worldCurrentModel.walkmesh_type}
          </Row>
          <Row label="Script ID">{ff7.gameState.worldCurrentModel.script}</Row>
        </div>
      </div>
      <h4 className="text-center mt-2 mb-1 font-medium">Map</h4>
      <div className="relative select-none" onClick={handleMapClick}>
        <img src={Worldmap} ref={worldmapRef} />
        <div className="absolute w-2 h-2 bg-orange-600 border-2 border-white rounded-full animate-pulse" style={{ top: `${coords.z - 4}px`, left: `${coords.x - 4}px` }}></div>
      </div>
    </div>
  );
}