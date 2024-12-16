import Row from "@/components/Row";
import { WorldModelType, WorldWalkmeshType } from "@/types";
import { FF7 } from "@/useFF7";

export function World(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;

  return (
    <div>
      <h4 className="text-center mt-2 mb-1 font-medium">Current Position</h4>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="X">{ff7.gameState.worldCurrentModel.x}</Row>
          <Row label="Y">{ff7.gameState.worldCurrentModel.y}</Row>
          <Row label="Z">{ff7.gameState.worldCurrentModel.z}</Row>
          <Row label="Direction">{ff7.gameState.worldCurrentModel.direction}</Row>
        </div>
        <div className="flex-1">
          <Row label="Model">{WorldModelType[ff7.gameState.worldCurrentModel.model_id]}</Row>
          <Row label="Terrain">
            {WorldWalkmeshType[ff7.gameState.worldCurrentModel.walkmesh_type] || ff7.gameState.worldCurrentModel.walkmesh_type}
          </Row>
          <Row label="Script ID">{ff7.gameState.worldCurrentModel.script}</Row>
        </div>
      </div>
    </div>
  );
}