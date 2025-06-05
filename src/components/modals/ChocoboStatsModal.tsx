import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Modal } from "@/components/Modal";
import { EditPopover } from "@/components/EditPopover";
import { Plus, Minus } from "lucide-react";

// Types
export interface ChocoboStats {
  rating: FencedChocoboType;
  racesWon: number;
  personality: ChocoboPersonality;
  acceleration: number;
  stamina: number;
  cooperation: number;
  intelligence: number;
  runSpeedMin: number;
  runSpeedMax: number;
  sprintSpeedMin: number;
  sprintSpeedMax: number;
  pCount: number;
}

export enum ChocoboPersonality {
  RunType0 = "Type 0",
  RunType1 = "Type 1",
  RunType2 = "Type 2 (dashing)", 
}

export enum FencedChocoboType {
  Wonderful = "Wonderful",
  Great = "Great",
  Good = "Good",
  Average = "Average",
  Poor = "Poor",
  SoSo = "So-So"
}

// Helper components for editable fields
const EditableStat = ({
  label,
  value,
  onSave,
  type = "number",
  min,
  max,
  disabled = false,
  className
}: {
  label?: string;
  value: string | number;
  onSave: (newValue: string | number) => void;
  type?: "text" | "number";
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleSubmit = useCallback(() => {
    if (disabled) return;
    let finalValue: string | number = editValue;
    if (type === "number") {
      const numValue = Number(editValue);
      if (isNaN(numValue)) return;
      if (min !== undefined && numValue < min) finalValue = min;
      else if (max !== undefined && numValue > max) finalValue = max;
      else finalValue = numValue;
    }
    onSave(finalValue);
    setPopoverOpen(false);
  }, [disabled, editValue, type, min, max, onSave]);

  return (
    <div 
      className={`flex items-center ${label ? 'justify-between' : 'justify-center'} ${className} ${disabled ? 'cursor-default text-muted-foreground' : 'cursor-pointer hover:text-primary'}`}
    >
      {label && <span className="text-xs whitespace-nowrap mr-2">{label}</span>}
      <EditPopover
        open={popoverOpen && !disabled}
        onOpenChange={setPopoverOpen}
        value={editValue}
        onValueChange={setEditValue}
        onSubmit={handleSubmit}
      >
        <span
          className="text-xs text-right cursor-pointer hover:text-primary bg-gray-800 rounded px-2 py-1"
          data-trigger="true"
          onClick={() => !disabled && setPopoverOpen(true)}
        >
          {value}
        </span>
      </EditPopover>
    </div>
  );
};

const EditableSelect = ({
  label,
  value,
  options,
  onSave,
  disabled = false,
  className
}: {
  label?: string;
  value: string;
  options: string[];
  onSave: (newValue: string) => void;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <div 
      className={`flex items-center ${label ? 'justify-between' : 'justify-center'} ${className}`}
    >
      {label && <span className="text-xs whitespace-nowrap mr-2">{label}</span>}
      <Select
        value={value}
        onValueChange={onSave}
        disabled={disabled}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="text-xs">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Main StatsModal Component
export function ChocoboStatsModal({
  open,
  setOpen,
  stats,
  onChange,
  slotIndex,
  chocoboName,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  stats: ChocoboStats;
  onChange: (stats: ChocoboStats) => void;
  slotIndex: number;
  chocoboName: string;
}) {
  const rankLetter = (() => {
    if (stats.racesWon >= 9) return "S";
    if (stats.racesWon >= 6) return "A";
    if (stats.racesWon >= 3) return "B";
    return "C";
  })();

  const updateStat = (field: keyof ChocoboStats, value: string | number) => {
    onChange({
      ...stats,
      [field]: value,
    });
  };

  return (
    <Modal
      open={open}
      setIsOpen={setOpen}
      title={`${chocoboName}'s Stats (Slot ${slotIndex + 1})`}
    >
      <div className="p-2 space-y-3 text-xs">
        {/* Rating & Races */}
        <div className="grid grid-cols-2 gap-2 items-center">
          <label className="whitespace-nowrap">Rating</label>
          <EditableSelect
            value={stats.rating}
            options={Object.values(FencedChocoboType)}
            onSave={(val) => updateStat('rating', val as FencedChocoboType)}
          />

          <label className="whitespace-nowrap">Races Won</label>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateStat('racesWon', Math.max(0, stats.racesWon - 1))}
              disabled={stats.racesWon <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <EditableStat
              value={stats.racesWon}
              onSave={(val) => updateStat('racesWon', Math.max(0, val as number))}
              min={0}
              max={255}
              className="min-w-[40px]"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateStat('racesWon', Math.min(255, stats.racesWon + 1))}
              disabled={stats.racesWon >= 255}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <span className="text-muted-foreground">Rank: {rankLetter}</span>
          </div>
        </div>

        <hr className="border-zinc-700" />

        {/* Core stats */}
        <div className="grid grid-cols-2 gap-2 items-center">
          <EditableStat
            label="Acceleration"
            value={stats.acceleration}
            onSave={(val) => updateStat('acceleration', val as number)}
            min={0}
            max={255}
          />

          <EditableStat
            label="Stamina"
            value={stats.stamina}
            onSave={(val) => updateStat('stamina', val as number)}
            min={0}
            max={65535}
          />

          <EditableStat
            label="Cooperation"
            value={stats.cooperation}
            onSave={(val) => updateStat('cooperation', val as number)}
            min={0}
            max={255}
          />

          <EditableStat
            label="Intelligence"
            value={stats.intelligence}
            onSave={(val) => updateStat('intelligence', val as number)}
            min={0}
            max={255}
          />
        </div>

        <hr className="border-zinc-700" />

        {/* Speed */}
        <div className="grid grid-cols-2 gap-4">
          {/* Run Speed */}
          <div className="space-y-2">
            <label className="font-semibold block text-center">Run Speed</label>
            <div className="grid grid-cols-2 gap-2 items-center">
              <span className="text-right text-xs">Min</span>
              <EditableStat
                value={stats.runSpeedMin}
                onSave={(val) => updateStat('runSpeedMin', val as number)}
                min={0}
                max={65535}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <span className="text-right text-xs">Max</span>
              <EditableStat
                value={stats.runSpeedMax}
                onSave={(val) => updateStat('runSpeedMax', val as number)}
                min={0}
                max={65535}
              />
            </div>
          </div>
          
          {/* Sprint Speed */}
          <div className="space-y-2">
            <label className="font-semibold block text-center">Sprint Speed</label>
            <div className="grid grid-cols-2 gap-2 items-center">
              <span className="text-right text-xs">Min</span>
              <EditableStat
                value={stats.sprintSpeedMin}
                onSave={(val) => updateStat('sprintSpeedMin', val as number)}
                min={0}
                max={65535}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <span className="text-right text-xs">Max</span>
              <EditableStat
                value={stats.sprintSpeedMax}
                onSave={(val) => updateStat('sprintSpeedMax', val as number)}
                min={0}
                max={65535}
              />
            </div>
          </div>
        </div>

        <hr className="border-zinc-700" />

        {/* Personality & PCount */}
        <div className="grid grid-cols-2 gap-2 items-center">
          <EditableStat
            label="P Count"
            value={stats.pCount}
            onSave={(val) => updateStat('pCount', val as number)}
            min={0}
            max={255}
          />

          <EditableSelect
            label="Personality"
            value={stats.personality}
            options={Object.values(ChocoboPersonality)}
            onSave={(val) => updateStat('personality', val as ChocoboPersonality)}
          />
        </div>
      </div>
    </Modal>
  );
} 