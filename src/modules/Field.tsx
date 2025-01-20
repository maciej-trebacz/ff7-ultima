import Row from "@/components/Row";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FF7 } from "@/useFF7";
import { useState } from "react";
import { WarpFieldModal } from "@/components/modals/WarpFieldModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditPopover } from "@/components/EditPopover";

export function Field(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;
  const [isWarpModalOpen, setIsWarpModalOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCoord, setEditCoord] = useState<"x" | "y" | "z" | "direction" | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentModelEditing, setCurrentModelEditing] = useState<number | null>(null);

  const openWarpModal = () => {
    setIsWarpModalOpen(true);
  };

  const closeWarpModal = () => {
    setIsWarpModalOpen(false);
  };

  const onWarpSubmit = (fieldId: number | null, destination?: any) => {
    if (fieldId === null) {
      return;
    }
    ff7.warpToFieldId(fieldId, destination);
    closeWarpModal();
  };

  const openEditPopover = (title: string, value: string, modelIndex: number, coord: "x" | "y" | "z" | "direction") => {
    console.log(`openEditPopover(${title}, ${value}, ${modelIndex}, ${coord})`);
    setEditValue(value);
    setEditTitle(title);
    setCurrentModelEditing(modelIndex);
    setEditCoord(coord);
    setPopoverOpen(true);
  }

  const submitValue = () => {
    if (currentModelEditing !== null && editCoord) {
      const model = state.fieldModels[currentModelEditing];
      ff7.setFieldModelCoordinates(
        currentModelEditing,
        editCoord === "x" ? parseInt(editValue) : model.x,
        editCoord === "y" ? parseInt(editValue) : model.y,
        editCoord === "z" ? parseInt(editValue) : model.z,
        editCoord === "direction" ? parseInt(editValue) : model.direction
      );
    }
    setPopoverOpen(false);
  }

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
                  <div className="h-4">
                    <span className="cursor-pointer" onClick={openWarpModal}>
                      {state.fieldId}
                      {state.fieldId > 0 && (
                        <span className="text-zinc-400 ml-1">({state.fieldId > 63 ? state.fieldName : `wm${state.fieldId - 1}`})</span>
                      )}
                    </span>
                    <Button size="xs" className="ml-2" onClick={openWarpModal}>
                      Warp
                    </Button>
                  </div>
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

      <WarpFieldModal
        isOpen={isWarpModalOpen}
        onClose={closeWarpModal}
        onSubmit={onWarpSubmit}
        ff7={ff7}
      />

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
                              <div className="p-1 cursor-pointer hover:bg-zinc-700 w-full" onClick={() => openEditPopover("Direction", model.direction.toString(), index, "direction")}>
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
                ) : (
                  <tr key={index} className="bg-zinc-800 text-xs">
                    <td className="p-1 text-nowrap w-14 font-bold">N/A</td>
                    <td className="p-1 px-2 text-nowrap">N/A</td>
                    <td className="p-1 px-2 text-nowrap">N/A</td>
                    <td className="p-1 px-2 text-nowrap">N/A</td>
                    <td className="p-1">N/A</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}