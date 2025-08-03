import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { ColorSquare } from "@/components/ui/color-square";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldLights, Light } from "@/types";

interface FieldLightsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  lights: FieldLights;
  onChange: (lights: FieldLights) => void;
  modelIndex: number;
  modelName: string;
}



export function FieldLightsModal({
  open,
  setOpen,
  lights,
  onChange,
  modelIndex,
  modelName,
}: FieldLightsModalProps) {
  const updateGlobalLightColor = (color: [number, number, number]) => {
    onChange({
      ...lights,
      global_light_color: color,
    });
  };

  const updateLight = (lightIndex: 1 | 2 | 3, updates: Partial<Light>) => {
    const lightKey = `light${lightIndex}` as keyof FieldLights;
    const currentLight = lights[lightKey] as Light;
    onChange({
      ...lights,
      [lightKey]: {
        ...currentLight,
        ...updates,
      },
    });
  };

  const updateLightColor = (lightIndex: 1 | 2 | 3, color: [number, number, number]) => {
    updateLight(lightIndex, { color });
  };

  const updateLightCoordinate = (lightIndex: 1 | 2 | 3, coord: 'x' | 'y' | 'z', value: number) => {
    updateLight(lightIndex, { [coord]: value });
  };

  const renderLightRow = (lightIndex: 1 | 2 | 3, light: Light) => (
    <div key={lightIndex} className="flex items-center gap-3 py-2">
      <Label className="text-xs font-medium w-12">Light {lightIndex}</Label>
      <ColorSquare
        value={light.color}
        onChange={(color) => updateLightColor(lightIndex, color)}
      />
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">X</Label>
        <Input
          type="number"
          value={light.x}
          onChange={(e) => updateLightCoordinate(lightIndex, 'x', parseInt(e.target.value) || 0)}
          className="text-xs w-[90px] h-6"
          min={-32768}
          max={32767}
        />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Y</Label>
        <Input
          type="number"
          value={light.y}
          onChange={(e) => updateLightCoordinate(lightIndex, 'y', parseInt(e.target.value) || 0)}
          className="text-xs w-[90px] h-6"
          min={-32768}
          max={32767}
        />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Z</Label>
        <Input
          type="number"
          value={light.z}
          onChange={(e) => updateLightCoordinate(lightIndex, 'z', parseInt(e.target.value) || 0)}
          className="text-xs w-[90px] h-6"
          min={-32768}
          max={32767}
        />
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      setIsOpen={setOpen}
      title={`${modelName} Lights (Model ${modelIndex})`}
      size="lg"
    >
      <div className="p-4 space-y-3 text-xs">
        {/* Global Light */}
        <div className="flex items-center gap-3 py-2 border-b border-zinc-700">
          <Label className="text-xs font-medium w-12">Global</Label>
          <ColorSquare
            value={lights.global_light_color}
            onChange={updateGlobalLightColor}
          />
          <span className="text-xs text-muted-foreground">Global ambient light color</span>
        </div>

        {/* Individual Lights */}
        <div className="space-y-1">
          {renderLightRow(1, lights.light1)}
          {renderLightRow(2, lights.light2)}
          {renderLightRow(3, lights.light3)}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
