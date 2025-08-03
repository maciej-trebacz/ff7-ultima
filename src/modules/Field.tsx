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
import { SaveStates } from "@/components/SaveStates";
import { Box, Shield, Lightbulb } from "lucide-react";
import { Eye } from "lucide-react";
import { MessageSquare } from "lucide-react";
import { FieldLightsModal } from "@/components/modals/FieldLightsModal";

export function Field(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;
  const [isWarpModalOpen, setIsWarpModalOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCoord, setEditCoord] = useState<"x" | "y" | "z" | "direction" | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentModelEditing, setCurrentModelEditing] = useState<number | null>(null);
  const [isLightsModalOpen, setIsLightsModalOpen] = useState(false);
  const [currentLightsModelIndex, setCurrentLightsModelIndex] = useState<number | null>(null);

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

  const openEditPopover = (title: string, value: string, modelIndex?: number, coord?: "x" | "y" | "z" | "direction") => {
    setEditValue(value);
    setEditTitle(title);
    setCurrentModelEditing(modelIndex ?? null);
    setEditCoord(coord ?? null);
    setPopoverOpen(true);
  }

  const openLightsModal = (modelIndex: number) => {
    setCurrentLightsModelIndex(modelIndex);
    setIsLightsModalOpen(true);
  };

  const closeLightsModal = () => {
    setIsLightsModalOpen(false);
    setCurrentLightsModelIndex(null);
  };

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
    } else if (editTitle === "Step ID") {
      ff7.setFieldStepId(parseInt(editValue));
    } else if (editTitle === "Step Fraction") {
      ff7.setFieldStepFraction(parseInt(editValue));
    } else if (editTitle === "Danger Value") {
      ff7.setFieldDangerValue(parseInt(editValue));
    } else if (editTitle === "Step Offset") {
      ff7.setFieldStepOffset(parseInt(editValue));
    } else if (editTitle === "Formation Index") {
      ff7.setFieldFormationIndex(parseInt(editValue));
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
                    <span className="cursor-pointer">
                      {state.fieldId}
                      {state.fieldId > 0 && (
                        <span className="text-zinc-400 ml-1">({state.fieldId > 63 ? state.fieldName : `wm${state.fieldId - 1}`})</span>
                      )}
                    </span>
                    <Button size="xs" className="ml-2">
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

        </div>
        <div className="flex-1">
          <Row label="Movement enabled">
            <Switch checked={!state.fieldMovementDisabled} onCheckedChange={(enabled) => ff7.toggleMovement()} />
          </Row>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-1">
        <div className="flex-1">
          <Row 
            label="Step Info"
          >
            {/* Step Offset */}
            <EditPopover
              open={popoverOpen && editTitle === "Step Offset"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="bg-zinc-900 px-1 rounded-xl w-[52px] flex justify-between cursor-pointer hover:text-primary" onClick={() => openEditPopover("Step Offset", state.stepOffset.toString())}>
                      <span className="text-xs text-zinc-500 mr-1">Off </span>{state.stepOffset}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit Step Offset</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>

            {/* Step ID */}
            <EditPopover
              open={popoverOpen && editTitle === "Step ID"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="ml-1 bg-zinc-900 px-1 rounded-xl w-[46px] flex justify-between cursor-pointer hover:text-primary" onClick={() => openEditPopover("Step ID", state.stepId.toString())}>
                      <span className="text-xs text-zinc-500 mr-1">ID</span>{state.stepId}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit Step ID</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>

            {/* Step Fraction */}
            <EditPopover
              open={popoverOpen && editTitle === "Step Fraction"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="ml-1 bg-zinc-900 px-1 rounded-xl w-[56px] flex justify-between cursor-pointer hover:text-primary" onClick={() => openEditPopover("Step Fraction", state.stepFraction.toString())}>
                      <span className="text-xs text-zinc-500 mr-1">Frac</span>{state.stepFraction}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit Step Fraction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>

            {/* Danger Value */}
            <EditPopover
              open={popoverOpen && editTitle === "Danger Value"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="ml-1 bg-zinc-900 px-1 rounded-xl min-w-[60px] flex justify-between cursor-pointer hover:text-primary" onClick={() => openEditPopover("Danger Value", state.dangerValue.toString())}>
                      <span className="text-xs text-zinc-500 mr-1">Dng</span>{state.dangerValue}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit Danger Value</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>

            {/* Danger Value */}
            <EditPopover
              open={popoverOpen && editTitle === "Formation Index"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="ml-1 bg-zinc-900 px-1 rounded-xl min-w-[52px] flex justify-between cursor-pointer hover:text-primary" onClick={() => openEditPopover("Formation Index", state.formationIndex.toString())}>
                      <span className="text-xs text-zinc-500 mr-1">Frm</span>{state.formationIndex}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit Formation Index</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>
          </Row>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-1">
        <div className="flex-1">
          <Row label="Skip Dialogues">
            <Switch checked={state.fieldSkipDialoguesEnabled} onCheckedChange={(enabled) => ff7.toggleSkipDialogues()} />
          </Row>
        </div>
      </div>

      <WarpFieldModal
        isOpen={isWarpModalOpen}
        onClose={closeWarpModal}
        onSubmit={onWarpSubmit}
        ff7={ff7}
      />

      <SaveStates ff7={ff7} />

      {state.fieldModels.length > 0 && state.fieldModels[0] && (
        <>
          <h2 className="uppercase font-medium text-sm border-b border-zinc-600 pb-0 mb-2 tracking-wide text-zinc-900 dark:text-zinc-100">
            Field Models
          </h2>
          <table className="w-full">
            <thead className="bg-zinc-800 text-xs text-left">
              <tr>
                <th className="p-1">Name</th>
                <th className="p-1 px-2">X</th>
                <th className="p-1 px-2">Y</th>
                <th className="p-1 px-2">Z</th>
                <th className="p-1">Dir.</th>
                <th className="p-1">Tri.</th>
                <th className="p-1 w-[88px]">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {state.fieldModels.map((model, index) => {
                return model && (Math.abs(model.x) < 50000 && Math.abs(model.y) < 50000 && Math.abs(model.z) < 50000) ? (
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
                    <td className="p-1 text-nowrap">
                      {model.triangle}
                    </td>
                    <td className="p-1 pr-0 text-nowrap flex gap-1">
                      <TooltipProvider>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <Lightbulb
                              className="h-4 w-4 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => openLightsModal(index)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Edit Lights</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <Box 
                              className={`h-4 w-4 ${model.collision ? '' : 'opacity-50'} cursor-pointer hover:text-primary transition-colors`} 
                              onClick={() => ff7.setFieldModelCollision(index, !model.collision)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Collision: {model.collision ? 'Enabled' : 'Disabled'} (click to toggle)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <MessageSquare 
                              className={`h-4 w-4 ${model.interaction ? '' : 'opacity-50'} cursor-pointer hover:text-primary transition-colors`} 
                              onClick={() => ff7.setFieldModelInteraction(index, !model.interaction)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Interaction: {model.interaction ? 'Enabled' : 'Disabled'} (click to toggle)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <Eye 
                              className={`h-4 w-4 ${model.visible ? '' : 'opacity-50'} cursor-pointer hover:text-primary transition-colors`} 
                              onClick={() => ff7.setFieldModelVisible(index, !model.visible)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Visibility: {model.visible ? 'Visible' : 'Hidden'} (click to toggle)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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

      {currentLightsModelIndex !== null && (
        <FieldLightsModal
          open={isLightsModalOpen}
          setOpen={setIsLightsModalOpen}
          lights={state.fieldModels[currentLightsModelIndex]?.lights || {
            global_light_color: [0, 0, 0],
            light1: { color: [0, 0, 0], x: 0, y: 0, z: 0 },
            light2: { color: [0, 0, 0], x: 0, y: 0, z: 0 },
            light3: { color: [0, 0, 0], x: 0, y: 0, z: 0 },
          }}
          onChange={(lights) => ff7.setFieldModelLights(currentLightsModelIndex, lights)}
          modelIndex={currentLightsModelIndex}
          modelName={state.fieldModels[currentLightsModelIndex]?.name || 'Unknown'}
        />
      )}
    </div>
  );
}