import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EditPopover } from "@/components/EditPopover";
import { ChocoboStatsModal, ChocoboStats, ChocoboPersonality, FencedChocoboType } from "@/components/modals/ChocoboStatsModal";
import { FF7 } from "@/useFF7";
import { Trash2, BarChart3, Plus } from "lucide-react";
import { ChocoboSlot } from "@/types";
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

// Helper component for editable fields matching Party.tsx pattern
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
  label: string;
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
      className={`flex items-center justify-between py-1 ${className} ${disabled ? 'cursor-default text-muted-foreground' : 'cursor-pointer hover:text-primary'}`}
      onClick={() => !disabled && setPopoverOpen(true)}
    >
      <Label className="text-xs whitespace-nowrap mr-2">{label}</Label>
      <EditPopover
        open={popoverOpen && !disabled}
        onOpenChange={setPopoverOpen}
        value={editValue}
        onValueChange={setEditValue}
        onSubmit={handleSubmit}
      >
        <span
          className="text-xs text-right"
          data-trigger="true"
        >
          {value}
        </span>
      </EditPopover>
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

  // Prepare data for rendering
  const stableChocoboData = stableChocobos.map((chocobo, index) => ({
    chocobo,
    index,
    isOwned: index < stablesOwned
  }));

  const fencedChocoboData = fencedChocobos.map((chocobo, index) => ({
    chocobo,
    index
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Launch the game to see chocobo data.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Stable Info Panel */}
      <Card className="col-span-2">
        <CardContent className="p-2">
          <div className="flex justify-between items-center text-xs">
            <span>Stables Owned: <strong>{stablesOwned}/6</strong></span>
            <span>Occupied: <strong>{occupiedStables}/{stablesOwned}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Stable Chocobos */}
      <div className="col-span-2 space-y-2">
        <h3 className="text-sm font-medium text-slate-300 px-1">Stable Chocobos</h3>
        <div className="grid grid-cols-2 gap-2">
          {stableChocoboData.map(({ chocobo, index, isOwned }) => (
            <Card key={index}>
              <CardHeader className="p-2 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Slot {index + 1}</CardTitle>
                  <div className="flex gap-1">
                    {chocobo && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setStatsModalIndex(index);
                            setStatsModalOpen(true);
                          }}
                          className="h-5 w-5 p-0"
                        >
                          <BarChart3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStable(index, null)}
                          className="h-5 w-5 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {!chocobo && isOwned && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStable(index, makeDefaultStableChocobo())}
                        className="h-5 w-5 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                    {!chocobo && !isOwned && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={buyStable}
                        className="h-5 px-2 text-xs"
                      >
                        Buy
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {chocobo ? (
                  <div className="space-y-1">
                    <EditableStat
                      label="Name"
                      value={chocobo.name}
                      onSave={(value) => updateStable(index, { ...chocobo, name: value as string })}
                      type="text"
                      className="py-0.5"
                    />
                    <div className="flex items-center justify-between py-0.5">
                      <Label className="text-xs whitespace-nowrap mr-2">Color</Label>
                      <Select
                        value={chocobo.color}
                        onValueChange={(val) => updateStable(index, { ...chocobo, color: val as ChocoboColor })}
                      >
                        <SelectTrigger className={`h-6 text-xs w-20 ${getColorStyle(chocobo.color)}`}>
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
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <Label className="text-xs whitespace-nowrap mr-2">Sex</Label>
                      <div className="flex bg-slate-800 rounded-md p-0.5 w-32">
                        <Button
                          type="button"
                          variant={chocobo.sex === ChocoboSex.Male ? "default" : "ghost"}
                          size="sm"
                          className={`flex-1 h-5 px-0 text-xs rounded-sm ${
                            chocobo.sex === ChocoboSex.Male
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-slate-700 text-muted-foreground"
                          }`}
                          onClick={() => updateStable(index, { ...chocobo, sex: ChocoboSex.Male })}
                        >
                          ♂ Male
                        </Button>
                        <Button
                          type="button"
                          variant={chocobo.sex === ChocoboSex.Female ? "default" : "ghost"}
                          size="sm"
                          className={`flex-1 h-5 px-0 text-xs rounded-sm ${
                            chocobo.sex === ChocoboSex.Female
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-slate-700 text-muted-foreground"
                          }`}
                          onClick={() => updateStable(index, { ...chocobo, sex: ChocoboSex.Female })}
                        >
                          ♀ Female
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <Label className="text-xs whitespace-nowrap mr-2">Can mate</Label>
                      <Checkbox
                        checked={chocobo.canMate}
                        onCheckedChange={(checked) => updateStable(index, { ...chocobo, canMate: Boolean(checked) })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <span className="text-xs text-muted-foreground italic">
                      {isOwned ? "Empty stable" : "Stable not owned"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Fenced Chocobos */}
      <div className="col-span-2 space-y-2">
        <h3 className="text-sm font-medium text-slate-300 px-1">Fenced Chocobos (Penned)</h3>
        <div className="grid grid-cols-2 gap-2">
          {fencedChocoboData.map(({ chocobo, index }) => (
            <Card key={index}>
              <CardHeader className="p-2 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Pen {index + 1}</CardTitle>
                  <div className="flex gap-1">
                    {chocobo ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateFenced(index, null)}
                        className="h-5 w-5 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateFenced(index, makeDefaultFencedChocobo())}
                        className="h-5 w-5 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {chocobo ? (
                  <div className="flex items-center justify-between py-0.5">
                    <Label className="text-xs whitespace-nowrap mr-2">Type</Label>
                    <Select
                      value={chocobo.type}
                      onValueChange={(val) => updateFenced(index, { type: val as FencedChocoboType })}
                    >
                      <SelectTrigger className="h-6 text-xs w-20">
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
                  </div>
                ) : (
                  <div className="text-center py-1">
                    <span className="text-xs text-muted-foreground italic">Empty pen</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats modal */}
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