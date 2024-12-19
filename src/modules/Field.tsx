import Row from "@/components/Row";
import { Switch } from "@/components/ui/switch";
import { FF7 } from "@/useFF7";

export function Field(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-1">
        <div className="flex-1">
          <Row label="Field ID">
            {state.fieldId}
            {state.fieldId > 0 && (
              <span className="text-zinc-400 ml-1">({state.fieldName})</span>
            )}
          </Row>
          <Row label="Step Fraction">{state.stepFraction}</Row>
        </div>
        <div className="flex-1">
          <Row label="Step ID">{state.stepId}</Row>
          <Row label="Danger Value">{state.dangerValue}</Row>
        </div>
        <div className="flex-1">
          <Row label="Movement enabled">
            <Switch checked={!state.fieldMovementDisabled} onCheckedChange={(enabled) => ff7.toggleMovement()} />
          </Row>
        </div>
      </div>

      {state.fieldModels.length > 0 && state.fieldModels[0] && <>
        <h4 className="text-center mt-2 mb-1 font-medium">Field Models</h4>
        <table className="w-full">
          <thead className="bg-zinc-800 text-xs text-left">
            <tr>
              <th className="p-1">Name</th>
              <th className="p-1 px-2">X</th>
              <th className="p-1 px-2">Y</th>
              <th className="p-1 px-2">Z</th>
              <th className="p-1">Direction</th>
            </tr>
          </thead>
          <tbody>
            {state.fieldModels.map((model, index) => {
              return model && (Math.abs(model.x) < 10000 && Math.abs(model.y) < 10000 && Math.abs(model.z) < 10000) ? (
                <tr key={index} className="bg-zinc-800 text-xs">
                  <td className="p-1 text-nowrap w-14 font-bold">{model.name}</td>
                  <td className="p-1 px-2 text-nowrap">{model.x}</td>
                  <td className="p-1 px-2 text-nowrap">{model.y}</td>
                  <td className="p-1 px-2 text-nowrap">{model.z}</td>
                  <td className="p-1">{model.direction}</td>
                </tr>
              ) : (
                <tr key={index} className="bg-zinc-800 text-xs">
                  <td className="p-1 text-nowrap w-14 font-bold">N/A</td>
                  <td className="p-1 px-2 text-nowrap">N/A</td>
                  <td className="p-1 px-2 text-nowrap">N/A</td>
                  <td className="p-1 px-2 text-nowrap">N/A</td>
                  <td className="p-1">N/A</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </>}
    </div>
  );
}