import { Modal } from "@/components/Modal";
import Row from "@/components/Row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutocompleteInput from "@/components/Autocomplete";
import { FF7 } from "@/useFF7";
import { useState, useEffect } from "react";
import scenes from "@/data/scenes.json";
import { SceneSource, SceneDestination, Scene } from "@/types/scenes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Transform scenes data into a format suitable for autocomplete
const fieldList = Object.values(scenes).map(scene => ({
  id: scene.id,
  name: `${scene.id} - ${scene.fieldName}${scene.mapNames.length > 0 ? ` (${scene.mapNames[0]})` : ''}`
}));

export function Field(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;
  const [fieldId, setFieldId] = useState<string>("");
  const [selectedDestination, setSelectedDestination] = useState<SceneDestination | undefined>();
  const [availableDestinations, setAvailableDestinations] = useState<SceneSource[]>([]);
  const [isWarpModalOpen, setIsWarpModalOpen] = useState(false);

  useEffect(() => {
    if (fieldId) {
      const selectedField: Scene = (scenes as any)[fieldId];
      if (selectedField) {
        const destinations = selectedField.sources.filter(source => source.destination);
        setAvailableDestinations(destinations);
        setSelectedDestination(destinations[0]?.destination);
      }
    } else {
      setAvailableDestinations([]);
      setSelectedDestination(undefined);
    }
  }, [fieldId]);

  const openWarpModal = () => {
    setFieldId("");
    setSelectedDestination(undefined);
    setAvailableDestinations([]);
    setIsWarpModalOpen(true);
    setTimeout(() => {
      (document.getElementById('field-id-input') as any)?.focus();
    }, 50);
  };

  const closeWarpModal = () => {
    setIsWarpModalOpen(false);
  };

  const onSubmitFieldId = (id: number | null) => {
    if (id === null) {
      return;
    }
    debugger;
    ff7.warpToFieldId(id, selectedDestination);
    closeWarpModal();
  };

  const onWarpModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeWarpModal();
    } else if (e.key === "Enter") {
      onSubmitFieldId(parseInt(fieldId));
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-1">
        <div className="flex-1">
          <Row 
            label="Field ID"
            onRowClick={openWarpModal}
          >
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <span className="cursor-pointer" onClick={openWarpModal}>
                    {state.fieldId}
                    {state.fieldId > 0 && (
                      <span className="text-zinc-400 ml-1">({state.fieldName})</span>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Click to warp to another field</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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

      <Modal
        open={isWarpModalOpen}
        setIsOpen={setIsWarpModalOpen}
        title="Warp to Field"
        buttonText="Warp"
        callback={() => onSubmitFieldId(parseInt(fieldId))}
      >
        <div className="mt-4 space-y-4">
          <AutocompleteInput
            battles={fieldList}
            isVisible={isWarpModalOpen}
            onSelect={(id) => setFieldId(id?.toString() ?? "")}
            onAccept={onWarpModalKeyDown}
            placeholder="Enter field name or ID"
          />

          {availableDestinations.length > 0 && (
            <Select
              value={selectedDestination ? JSON.stringify(selectedDestination) : undefined}
              onValueChange={(value) => setSelectedDestination(value ? JSON.parse(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No destinations available" />
              </SelectTrigger>
              <SelectContent>
                {availableDestinations.map((source, index) => (
                  <SelectItem 
                    key={index} 
                    value={JSON.stringify(source.destination)}
                  >
                    From: {source.fieldName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Modal>

      <h4 className="text-center mt-2 mb-1 font-medium">Experimental save states</h4>
      <div className="flex gap-1 justify-center mb-4">
      <Button size="sm" className="mt-2" onClick={() => ff7.saveState()}>
        Save state
      </Button> &nbsp;
      <Button size="sm" className="mt-2" onClick={() => ff7.loadState()}>
        Load state
      </Button>
      </div>

      {state.fieldModels.length > 0 && state.fieldModels[0] && (
        <>
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
        </>
      )}
    </div>
  );
}