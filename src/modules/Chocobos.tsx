import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EditPopover } from "@/components/EditPopover";
import { ChocoboStatsModal, ChocoboStats, ChocoboPersonality, FencedChocoboType } from "@/components/modals/ChocoboStatsModal";
import { FF7 } from "@/useFF7";
import { Trash2, BarChart3, Plus, Minus } from "lucide-react";
import { ChocoboData, ChocoboSlot } from "@/types";
import { encodeText } from "@/ff7/fftext";
import { useFF7Context } from "@/FF7Context";

// Types ----------------------------------------------------

export enum ChocoboColor {
  Yellow = "Yellow",
  Blue = "Blue", 
  Green = "Green",
  Black = "Black",
  Gold = "Gold"
}

export enum ChocoboSex {
  Male = "Male",
  Female = "Female"
}

interface StableChocobo {
  name: string;
  color: ChocoboColor;
  sex: ChocoboSex;
  canMate: boolean;
}

interface LocalFencedChocobo {
  type: FencedChocoboType;
}

// Helper components for editable fields -----------------
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

// Consts ----------------------------------------------------

const makeDefaultStableChocobo = (): StableChocobo => ({
  name: "Choco",
  color: ChocoboColor.Yellow,
  sex: ChocoboSex.Male,
  canMate: true,
});

const makeDefaultFencedChocobo = (): LocalFencedChocobo => ({
  type: FencedChocoboType.Average,
});

const makeDefaultStats = (): ChocoboStats => ({
  rating: FencedChocoboType.Average,
  racesWon: 0,
  personality: ChocoboPersonality.RunType0,
  acceleration: 50,
  stamina: 50,
  cooperation: 50,
  intelligence: 50,
  runSpeedMin: 30,
  runSpeedMax: 50,
  sprintSpeedMin: 60,
  sprintSpeedMax: 90,
  pCount: 0,
});

// Helper functions to convert between frontend and backend types
const colorToNumber = (color: ChocoboColor): number => {
  switch (color) {
    case ChocoboColor.Yellow: return 0;
    case ChocoboColor.Green: return 1;
    case ChocoboColor.Blue: return 2;
    case ChocoboColor.Black: return 3;
    case ChocoboColor.Gold: return 4;
    default: return 0;
  }
};

const numberToColor = (num: number): ChocoboColor => {
  switch (num) {
    case 0: return ChocoboColor.Yellow;
    case 1: return ChocoboColor.Green;
    case 2: return ChocoboColor.Blue;
    case 3: return ChocoboColor.Black;
    case 4: return ChocoboColor.Gold;
    default: return ChocoboColor.Yellow;
  }
};

const getColorStyle = (color: ChocoboColor): string => {
  switch (color) {
    case ChocoboColor.Yellow: return "text-yellow-100";
    case ChocoboColor.Green: return "text-green-400";
    case ChocoboColor.Blue: return "text-blue-400";
    case ChocoboColor.Black: return "text-gray-400";
    case ChocoboColor.Gold: return "text-yellow-300";
    default: return "text-yellow-400";
  }
};

const ratingToNumber = (rating: FencedChocoboType): number => {
  switch (rating) {
    case FencedChocoboType.Wonderful: return 1;
    case FencedChocoboType.Great: return 2;
    case FencedChocoboType.Good: return 3;
    case FencedChocoboType.Average: return 4;
    case FencedChocoboType.Poor: return 5;
    case FencedChocoboType.SoSo: return 6;
    default: return 4;
  }
};

const numberToRating = (num: number): FencedChocoboType => {
  switch (num) {
    case 1: return FencedChocoboType.Wonderful;
    case 2: return FencedChocoboType.Great;
    case 3: return FencedChocoboType.Good;
    case 4: return FencedChocoboType.Average;
    case 5: return FencedChocoboType.Poor;
    case 6: return FencedChocoboType.SoSo;
    default: return FencedChocoboType.Average;
  }
};

const personalityToNumber = (personality: ChocoboPersonality): number => {
  return Object.values(ChocoboPersonality).indexOf(personality);
};

const numberToPersonality = (num: number): ChocoboPersonality => {
  return Object.values(ChocoboPersonality)[num] || ChocoboPersonality.RunType0;
};

// Main Component -------------------------------------------

export function Chocobos({ ff7 }: { ff7: FF7 }) {
  const { gameState } = useFF7Context();

  // Get chocobo data from context
  const chocoboData = gameState?.chocoboData;
  const loading = !chocoboData;
  
  // Extract stable counts
  const stablesOwned = chocoboData?.stables_owned || 0;
  const occupiedStables = chocoboData?.occupied_stables || 0;

  // Stable chocobos: fixed 6 slots
  const [stableChocobos, setStableChocobos] = useState<(StableChocobo | null)[]>(
    Array(6).fill(null)
  );
  // Fenced chocobos: 4 slots (not 6 as in mock)
  const [fencedChocobos, setFencedChocobos] = useState<(LocalFencedChocobo | null)[]>(
    Array(4).fill(null)
  );

  // Stats modal -------------------------------------------
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsModalIndex, setStatsModalIndex] = useState<number | null>(null);

  // per-slot stats storage
  const [stableStats, setStableStats] = useState<(ChocoboStats | null)[]>(
    Array(6).fill(null)
  );

  // Update local state when context data changes
  useEffect(() => {
    if (!chocoboData) return;
    
    // Convert backend data to frontend format
    const newStableChocobos: (StableChocobo | null)[] = Array(6).fill(null);
    const newStableStats: (ChocoboStats | null)[] = Array(6).fill(null);
    
    chocoboData.stable_chocobos.forEach((slot, index) => {
      if (slot) {
        const canMate = (chocoboData.cant_mate_mask & (1 << index)) === 0;
        newStableChocobos[index] = {
          name: chocoboData.chocobo_names[index] || `Chocobo ${index + 1}`,
          color: numberToColor(slot.color),
          sex: slot.sex === 1 ? ChocoboSex.Female : ChocoboSex.Male,
          canMate,
        };
        
        newStableStats[index] = {
          rating: numberToRating(1), // We'll derive this from other stats
          racesWon: slot.races_won,
          personality: numberToPersonality(slot.personality),
          acceleration: slot.acceleration,
          stamina: chocoboData.chocobo_stamina[index] || 0,
          cooperation: slot.cooperation,
          intelligence: slot.intelligence,
          runSpeedMin: slot.speed,
          runSpeedMax: slot.max_speed,
          sprintSpeedMin: slot.sprint_speed,
          sprintSpeedMax: slot.max_sprint_speed,
          pCount: slot.pcount,
        };
      }
    });
    
    setStableChocobos(newStableChocobos);
    setStableStats(newStableStats);
    
    // Convert fenced chocobo data
    const newFencedChocobos: (LocalFencedChocobo | null)[] = Array(4).fill(null);
    chocoboData.fenced_chocobos.forEach((fenced, index) => {
      if (fenced.rating > 0) {
        newFencedChocobos[index] = {
          type: numberToRating(fenced.rating),
        };
      }
    });
    setFencedChocobos(newFencedChocobos);
  }, [chocoboData]);

  // Save chocobo slot to game
  const saveChocoboSlot = async (index: number, chocobo: StableChocobo | null, stats: ChocoboStats | null) => {
    try {
      if (chocobo && stats && chocoboData) {
        const slot: ChocoboSlot = {
          sprint_speed: stats.sprintSpeedMin,
          max_sprint_speed: stats.sprintSpeedMax,
          speed: stats.runSpeedMin,
          max_speed: stats.runSpeedMax,
          acceleration: stats.acceleration,
          cooperation: stats.cooperation,
          intelligence: stats.intelligence,
          personality: personalityToNumber(stats.personality),
          pcount: stats.pCount,
          races_won: stats.racesWon,
          sex: chocobo.sex === ChocoboSex.Female ? 1 : 0,
          color: colorToNumber(chocobo.color),
        };
        
        await invoke("write_chocobo_slot", { slotIndex: index, chocobo: slot });
        
        // Save name (skip the final 0xFF byte)
        const encodedName = Array.from(encodeText(chocobo.name)).slice(0, -1);
        await invoke("write_chocobo_name", { slotIndex: index, encodedName });
        
        // Save stamina
        await invoke("write_chocobo_stamina", { slotIndex: index, stamina: stats.stamina });
        
        // Update occupation mask
        let newMask = chocoboData.stables_occupied_mask | (1 << index);
        await invoke("write_stable_occupation_mask", { mask: newMask });
        
        // Update occupied stables count
        let newOccupiedCount = occupiedStables;
        if ((chocoboData.stables_occupied_mask & (1 << index)) === 0) {
          // This slot was previously empty, increment count
          newOccupiedCount++;
          await invoke("write_occupied_stables", { count: newOccupiedCount });
        }
        
        // Set can mate status (this handles both the mask and target battle count)
        await invoke("set_chocobo_can_mate", { slotIndex: index, canMate: chocobo.canMate });
        
        // Data will automatically refresh from context polling
      } else {
        // Remove chocobo - clear occupation bit
        if (chocoboData) {
          let newMask = chocoboData.stables_occupied_mask & ~(1 << index);
          await invoke("write_stable_occupation_mask", { mask: newMask });
          
          // Update occupied stables count
          if ((chocoboData.stables_occupied_mask & (1 << index)) !== 0) {
            // This slot was previously occupied, decrement count
            const newOccupiedCount = Math.max(0, occupiedStables - 1);
            await invoke("write_occupied_stables", { count: newOccupiedCount });
          }
          
          // Data will automatically refresh from context polling
        }
      }
    } catch (error) {
      console.error("Failed to save chocobo slot:", error);
    }
  };

  // Buy a new stable
  const buyStable = async () => {
    try {
      if (chocoboData && stablesOwned < 6) {
        await invoke("write_stables_owned", { count: stablesOwned + 1 });
        // Data will automatically refresh from context polling
      }
    } catch (error) {
      console.error("Failed to buy stable:", error);
    }
  };

  // Save fenced chocobo rating
  const saveFencedChocobo = async (index: number, fenced: LocalFencedChocobo | null) => {
    try {
      const rating = fenced ? ratingToNumber(fenced.type) : 0;
      await invoke("write_fenced_chocobo", { slotIndex: index, rating });
      // Data will automatically refresh from context polling
    } catch (error) {
      console.error("Failed to save fenced chocobo:", error);
    }
  };

  // Helpers -------------------------------------------------
  const updateStable = (index: number, data: StableChocobo | null) => {
    setStableChocobos((prev) => {
      const copy = [...prev];
      copy[index] = data;
      return copy;
    });
    
    // If adding a new chocobo and stats don't exist, create default stats
    let statsToSave = stableStats[index];
    if (data && !statsToSave) {
      statsToSave = makeDefaultStats();
      setStableStats((prev) => {
        const copy = [...prev];
        copy[index] = statsToSave;
        return copy;
      });
    }
    
    // Save to game immediately
    saveChocoboSlot(index, data, statsToSave);
  };
  
  const updateFenced = (index: number, data: LocalFencedChocobo | null) => {
    setFencedChocobos((prev) => {
      const copy = [...prev];
      copy[index] = data;
      return copy;
    });
    // Save to game immediately
    saveFencedChocobo(index, data);
  };

  const updateStats = (index: number, stats: ChocoboStats) => {
    setStableStats((prev) => {
      const copy = [...prev];
      copy[index] = stats;
      return copy;
    });
    // Save to game immediately
    saveChocoboSlot(index, stableChocobos[index], stats);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-2">
        <Card>
          <CardContent className="p-6 text-center">
            Loading chocobo data...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {/* Stable Info Panel -------------------------------- */}
      <Card>
        <CardContent className="p-3">
          <div className="flex justify-between items-center text-xs">
            <span>Stables Owned: <strong>{stablesOwned}/6</strong></span>
            <span>Occupied: <strong>{occupiedStables}/{stablesOwned}</strong></span>
          </div>
        </CardContent>
      </Card>
      
      {/* Stable Chocobos ---------------------------------- */}
      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Stable Chocobos</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="p-1 w-24 text-left">Name</th>
                  <th className="p-1 w-24 text-left">Color</th>
                  <th className="p-1 w-20 text-left">Sex</th>
                  <th className="p-1 w-20 text-center">Can mate</th>
                  <th className="p-1 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stableChocobos.map((slot, index) => {
                  if (slot) {
                    return (
                      <tr key={index} className="bg-zinc-800 even:bg-zinc-900">
                        {/* Name */}
                        <td className="p-1">
                          <Input
                            value={slot.name}
                            onChange={(e) =>
                              updateStable(index, {
                                ...slot,
                                name: e.target.value,
                              })
                            }
                            className="h-6 text-xs px-1"
                          />
                        </td>
                        {/* Color */}
                        <td className="p-1">
                          <Select
                            value={slot.color}
                            onValueChange={(val) =>
                              updateStable(index, {
                                ...slot,
                                color: val as ChocoboColor,
                              })
                            }
                          >
                            <SelectTrigger className={`h-6 text-xs ${getColorStyle(slot.color)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(ChocoboColor).map((c) => (
                                <SelectItem key={c} value={c} className={`text-xs ${getColorStyle(c)}`}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        {/* Sex */}
                        <td className="p-1">
                          <Select
                            value={slot.sex}
                            onValueChange={(val) =>
                              updateStable(index, {
                                ...slot,
                                sex: val as ChocoboSex,
                              })
                            }
                          >
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.values(ChocoboSex)).map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        {/* Can mate */}
                        <td className="p-1 text-center">
                          <Checkbox
                            checked={slot.canMate}
                            onCheckedChange={(checked) =>
                              updateStable(index, {
                                ...slot,
                                canMate: Boolean(checked),
                              })
                            }
                          />
                        </td>
                        {/* Actions */}
                        <td className="p-1 text-center flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateStable(index, null)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setStatsModalIndex(index);
                              setStatsModalOpen(true);
                            }}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  }
                  // Empty slot UI -------------------------------------
                  const isStableOwned = index < stablesOwned;
                  
                  return (
                    <tr key={index} className="bg-zinc-800 even:bg-zinc-900">
                      <td className="p-1" colSpan={4}>
                        {isStableOwned ? (
                          <span className="italic text-muted-foreground">- empty stable -</span>
                        ) : (
                          <span className="italic text-muted-foreground">- stable not owned -</span>
                        )}
                      </td>
                      <td className="p-1 flex gap-1 justify-center">
                        {isStableOwned ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateStable(index, null)}
                              disabled
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateStable(index, makeDefaultStableChocobo())}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={buyStable}
                            className="h-6 px-2 text-xs"
                          >
                            Buy Stable
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Fenced Chocobos ---------------------------------- */}
      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Fenced Chocobos (Penned)</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="p-1 w-32 text-left">Type</th>
                  <th className="p-1 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fencedChocobos.map((slot, index) => {
                  if (slot) {
                    return (
                      <tr key={index} className="bg-zinc-800 even:bg-zinc-900">
                        <td className="p-1">
                          <Select
                            value={slot.type}
                            onValueChange={(val) =>
                              updateFenced(index, { type: val as FencedChocoboType })
                            }
                          >
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(FencedChocoboType).map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1 flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateFenced(index, null)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={index} className="bg-zinc-800 even:bg-zinc-900">
                      <td className="p-1" colSpan={1}>
                        <span className="italic text-muted-foreground">- empty -</span>
                      </td>
                      <td className="p-1 flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateFenced(index, makeDefaultFencedChocobo())}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stats modal --------------------------------------- */}
      {statsModalIndex !== null && (
        <ChocoboStatsModal
          open={statsModalOpen}
          setOpen={setStatsModalOpen}
          stats={
            stableStats[statsModalIndex] ?? makeDefaultStats()
          }
          onChange={(newStats) => updateStats(statsModalIndex, newStats)}
          slotIndex={statsModalIndex}
          chocoboName={stableChocobos[statsModalIndex]?.name || `Chocobo ${statsModalIndex + 1}`}
        />
      )}
    </div>
  );
} 