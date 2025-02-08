import { Modal } from "@/components/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutocompleteInput from "@/components/Autocomplete";
import { useState, useEffect } from "react";
import scenes from "@/data/scenes.json";
import { SceneSource, Scene } from "@/types/scenes";
import { FF7 } from "@/useFF7";
import { GameModule, WorldFieldTblItem } from "@/types";

interface WarpFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fieldId: number | null, destination?: SceneSource['destination']) => void;
  ff7: FF7;
}

export function WarpFieldModal({ isOpen, onClose, onSubmit, ff7 }: WarpFieldModalProps) {
  const [fieldId, setFieldId] = useState<string>("");
  const [selectedDestination, setSelectedDestination] = useState<number | undefined>();
  const [availableDestinations, setAvailableDestinations] = useState<SceneSource[]>([]);
  const [worldFieldTblData, setWorldFieldTblData] = useState<WorldFieldTblItem[]>([]);

  // Transform scenes data into a format suitable for autocomplete
  const fieldList = Object.values(scenes).map(scene => {
    let mapName = scene.mapNames.length > 0 ? ` (${scene.mapNames[0]})` : '';
    if (scene.id > 0 && scene.id <= 64) {
      const source = scene.sources[0]?.id;
      if (source) {
        const sourceScene = (scenes as any)[source] as Scene;
        if (sourceScene) {
          mapName = ` (${sourceScene.mapNames[0] || sourceScene.fieldName})`;
        }
      }
    }
    return {
      id: scene.id,
      name: `${scene.id} - ${scene.fieldName}${mapName}`
    }
  }).filter(scene => {
    // Do not let warping to wm* fields while on the world map, as it results in a crash
    return ff7.gameState.currentModule !== GameModule.World || scene.id > 64;
  })

  useEffect(() => {
    if (isOpen) {
      setFieldId("");
      setSelectedDestination(undefined);
      setAvailableDestinations([]);
      ff7.getWorldFieldTblData().then(data => {
        setWorldFieldTblData(data);
        setTimeout(() => {
          (document.getElementById('field-id-input') as any)?.focus();
        }, 50);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (fieldId) {
      const selectedField: Scene = (scenes as any)[fieldId];
      if (selectedField) {
        const destinations = selectedField.sources.filter(source => source.destination);
        
        // Check if this field exists in the field.tbl data
        const fieldTblEntry = worldFieldTblData.find(item => item.field_id === parseInt(fieldId));
        
        // If found in world field data, add it as first destination
        if (fieldTblEntry) {
          const worldMapSource: SceneSource = {
            id: -1,
            fieldName: "world map",
            destination: {
              x: fieldTblEntry.x,
              y: fieldTblEntry.y,
              triangle: fieldTblEntry.triangle_id,
              direction: fieldTblEntry.direction
            },
            type: "gateway"
          };
          setAvailableDestinations([worldMapSource, ...destinations]);
          setSelectedDestination(worldMapSource.id);
        } else {
          setAvailableDestinations(destinations);
          setSelectedDestination(destinations[0]?.id ?? -1);
        }
        
      }
    } else {
      setAvailableDestinations([]);
      setSelectedDestination(undefined);
    }
  }, [fieldId, worldFieldTblData]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      onSubmit(parseInt(fieldId), availableDestinations.find(source => source.id === selectedDestination)?.destination);
    }
  };

  return (
    <Modal
      open={isOpen}
      setIsOpen={onClose}
      title="Warp to Field"
      buttonText="Warp"
      callback={() => onSubmit(
        parseInt(fieldId),
        availableDestinations.find(source => source.id === selectedDestination)?.destination
      )}
    >
      <div className="mt-4 space-y-4">
        <AutocompleteInput
          battles={fieldList}
          isVisible={isOpen}
          onSelect={(id) => setFieldId(id?.toString() ?? "")}
          onAccept={onKeyDown}
          placeholder="Enter field name or ID"
        />

        {availableDestinations.length > 0 && (
          <Select
            value={"" + selectedDestination}
            onValueChange={(value) => setSelectedDestination(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="No destinations available" />
            </SelectTrigger>
            <SelectContent>
              {availableDestinations.map((source, index) => (
                <SelectItem 
                  key={index} 
                  value={"" + source.id}
                >
                  From: {source.fieldName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </Modal>
  );
} 