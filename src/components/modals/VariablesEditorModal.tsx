import { useEffect, useState, useRef } from "react";
import { Modal } from "@/components/Modal";
import { FF7 } from "@/useFF7";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EditPopover } from "@/components/EditPopover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// Temporarily disabled due to TypeScript configuration issues
// import { SimpleVariableField } from "./VariableFields/SimpleVariableField";
// import { BitmaskVariableField } from "./VariableFields/BitmaskVariableField";
// import { TimerVariableField } from "./VariableFields/TimerVariableField";

interface VariablesEditorModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  ff7: FF7;
}

type ViewFormat = "Decimal" | "Hex" | "Binary";

interface VariableFieldDefinition {
  offset: number;
  size: 1 | 2 | 3;
  name: string;
  description: string;
  type: 'simple' | 'bitmask' | 'timer' | 'unknown';
  bitDescriptions?: string[];
  min?: number;
  max?: number;
}

// Variable definitions based on savemap documentation for Banks 1/2
const BANK_1_2_VARIABLES: VariableFieldDefinition[] = [
  {
    offset: 0,
    size: 2,
    name: "Main Progress Variable",
    description: "Main story progression variable",
    type: 'simple'
  },
  {
    offset: 2,
    size: 1,
    name: "Yuffie Initial Level",
    description: "Yuffie's initial level when joining the team",
    type: 'simple',
    min: 1,
    max: 99
  },
  {
    offset: 3,
    size: 1,
    name: "Aeris Love Points",
    description: "Aeris' current love points",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 4,
    size: 1,
    name: "Tifa Love Points", 
    description: "Tifa's current love points",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 5,
    size: 1,
    name: "Yuffie Love Points",
    description: "Yuffie's current love points", 
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 6,
    size: 1,
    name: "Barret Love Points",
    description: "Barret's current love points",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 16,
    size: 1,
    name: "Game Timer Hours",
    description: "Game timer hours",
    type: 'timer',
    min: 0,
    max: 255
  },
  {
    offset: 17,
    size: 1,
    name: "Game Timer Minutes",
    description: "Game timer minutes",
    type: 'timer',
    min: 0,
    max: 59
  },
  {
    offset: 18,
    size: 1,
    name: "Game Timer Seconds",
    description: "Game timer seconds",
    type: 'timer',
    min: 0,
    max: 59
  },
  {
    offset: 19,
    size: 1,
    name: "Game Timer Frames",
    description: "Game timer frames (0-33 FPS)",
    type: 'timer',
    min: 0,
    max: 33
  },
  {
    offset: 20,
    size: 1,
    name: "Countdown Timer Hours",
    description: "Countdown timer hours",
    type: 'timer',
    min: 0,
    max: 255
  },
  {
    offset: 21,
    size: 1,
    name: "Countdown Timer Minutes",
    description: "Countdown timer minutes",
    type: 'timer',
    min: 0,
    max: 59
  },
  {
    offset: 22,
    size: 1,
    name: "Countdown Timer Seconds",
    description: "Countdown timer seconds",
    type: 'timer',
    min: 0,
    max: 59
  },
  {
    offset: 23,
    size: 1,
    name: "Countdown Timer Frames",
    description: "Countdown timer frames (0-30)",
    type: 'timer',
    min: 0,
    max: 30
  },
  {
    offset: 24,
    size: 2,
    name: "Battles Fought",
    description: "Number of battles fought",
    type: 'simple',
    min: 0,
    max: 65535
  },
  {
    offset: 26,
    size: 2,
    name: "Escapes",
    description: "Number of escapes from battle",
    type: 'simple',
    min: 0,
    max: 65535
  },
  {
    offset: 28,
    size: 2,
    name: "Menu Visibility",
    description: "Menu visibility settings",
    type: 'bitmask',
    bitDescriptions: [
      "Item menu",
      "Magic menu", 
      "Materia menu",
      "Equip menu",
      "Status menu",
      "Order menu",
      "Limit menu",
      "Config menu",
      "PHS menu",
      "Save menu"
    ]
  },
  {
    offset: 30,
    size: 2,
    name: "Menu Locking",
    description: "Menu locking settings (1: Locked)",
    type: 'bitmask',
    bitDescriptions: [
      "Item menu",
      "Magic menu",
      "Materia menu", 
      "Equip menu",
      "Status menu",
      "Order menu",
      "Limit menu",
      "Config menu",
      "PHS menu",
      "Save menu"
    ]
  },
  {
    offset: 36,
    size: 1,
    name: "Sector 7 Train Items",
    description: "Items collected in Sector 7 Train Graveyard",
    type: 'bitmask',
    bitDescriptions: [
      "Hi-Potion (Barrel 1)",
      "Echo Screen (Barrel 2)",
      "Potion (Floor 2)",
      "Ether (Floor 3)",
      "Hi-Potion (Roof Train 1)",
      "Potion (Inside Train 2)", 
      "Potion (Floor 1)",
      "Hi-Potion (Roof Train 2)"
    ]
  },
  {
    offset: 37,
    size: 1,
    name: "Field Items Set 1",
    description: "Various field items collected",
    type: 'bitmask',
    bitDescriptions: [
      "Elixir",
      "Potion",
      "Safety Bit",
      "Mind Source",
      "Sneak Glove",
      "Premium Heart",
      "Unused",
      "Unused"
    ]
  },
  {
    offset: 48,
    size: 1,
    name: "Field Items & Materia",
    description: "Field items and materia collected",
    type: 'bitmask',
    bitDescriptions: [
      "Potion",
      "Potion + Phoenix Down",
      "Ether",
      "Cover Materia",
      "Choco-Mog Summon",
      "Sense Materia",
      "Ramuh Summon",
      "Mythril Key Item"
    ]
  },
  {
    offset: 49,
    size: 1,
    name: "Materia Cave Items",
    description: "Items from Materia Cave / Northern Cave",
    type: 'bitmask',
    bitDescriptions: [
      "Mime Materia",
      "HP<->MP Materia",
      "Quadra Magic Materia",
      "Knights of Round Summon",
      "Elixir",
      "X-Potion",
      "Turbo Ether",
      "Vaccine"
    ]
  },
  {
    offset: 50,
    size: 1,
    name: "Northern Cave Items",
    description: "Items from Northern Cave",
    type: 'bitmask',
    bitDescriptions: [
      "Magic Counter Materia",
      "Speed Source",
      "Turbo Ether",
      "X-Potion",
      "Mega All",
      "Luck Source",
      "Remedy",
      "Bolt Ring"
    ]
  },
  {
    offset: 51,
    size: 1,
    name: "Misc Field Items",
    description: "Miscellaneous field items",
    type: 'bitmask',
    bitDescriptions: [
      "Gold Armlet",
      "Great Gospel",
      "Umbrella (Shooting Coaster)",
      "Flayer (Shooting Coaster)",
      "Death Penalty + Chaos",
      "Elixir",
      "Enemy Skill Animation",
      "Enemy Skill"
    ]
  },
  {
    offset: 56,
    size: 1,
    name: "Wall Market & Shinra Items",
    description: "Items from Wall Market and Shinra HQ",
    type: 'bitmask',
    bitDescriptions: [
      "Ether (Corneo basement)",
      "Hyper (Corneo bedroom)",
      "Phoenix Down (Corneo 2nd floor)",
      "Elixir (Shinra stairs)",
      "Unused",
      "Magic Source",
      "First Midgar Part",
      "Second Midgar Part"
    ]
  },
  {
    offset: 57,
    size: 1,
    name: "Shinra HQ Items",
    description: "Items from Shinra HQ",
    type: 'bitmask',
    bitDescriptions: [
      "Third Midgar Part",
      "Fourth Midgar Part",
      "Fifth Midgar Part",
      "Keycard 66",
      "All Materia",
      "Ether",
      "Wind Slash",
      "Fairy Ring"
    ]
  },
  {
    offset: 58,
    size: 1,
    name: "Field Items Set 2",
    description: "Various field items",
    type: 'bitmask',
    bitDescriptions: [
      "X-Potion",
      "Added Effect Materia",
      "Black M-phone",
      "Ether",
      "Elixir",
      "HP Absorb Materia",
      "Magic Shuriken",
      "Hairpin"
    ]
  },
  {
    offset: 59,
    size: 1,
    name: "Field Items Set 3",
    description: "More field items",
    type: 'bitmask',
    bitDescriptions: [
      "Keycard 62",
      "MP Absorb Materia",
      "Swift Bolt",
      "Elixir",
      "Pile Bunker",
      "Master Fist",
      "Behemoth Horn",
      "Full Cure Materia"
    ]
  },
  {
    offset: 80,
    size: 1,
    name: "Aeris Battle Love Points",
    description: "Aeris' battle love points",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 81,
    size: 1,
    name: "Tifa Battle Love Points",
    description: "Tifa's battle love points",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 82,
    size: 1,
    name: "Yuffie Battle Love Points",
    description: "Yuffie's battle love points",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 83,
    size: 1,
    name: "Barret Battle Love Points",
    description: "Barret's battle love points",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 85,
    size: 1,
    name: "Chocobo 1 Rating",
    description: "Rating for penned chocobo #1 (1: Wonderful - 8: Worst)",
    type: 'simple',
    min: 1,
    max: 8
  },
  {
    offset: 86,
    size: 1,
    name: "Chocobo 2 Rating",
    description: "Rating for penned chocobo #2 (1: Wonderful - 8: Worst)",
    type: 'simple',
    min: 1,
    max: 8
  },
  {
    offset: 87,
    size: 1,
    name: "Chocobo 3 Rating",
    description: "Rating for penned chocobo #3 (1: Wonderful - 8: Worst)",
    type: 'simple',
    min: 1,
    max: 8
  },
  {
    offset: 88,
    size: 1,
    name: "Chocobo 4 Rating",
    description: "Rating for penned chocobo #4 (1: Wonderful - 8: Worst)",
    type: 'simple',
    min: 1,
    max: 8
  },
  {
    offset: 91,
    size: 3,
    name: "Ultimate Weapon HP",
    description: "Ultimate Weapon's remaining HP",
    type: 'simple',
    min: 0,
    max: 16777215
  },
  {
    offset: 112,
    size: 2,
    name: "Battle Points",
    description: "Current Battle Points (Battle Square)",
    type: 'simple',
    min: 0,
    max: 65535
  },
  {
    offset: 116,
    size: 1,
    name: "Battle Square Wins",
    description: "Number of battles won in Battle Square",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 122,
    size: 1,
    name: "Tutorial Flags",
    description: "Tutorial and event flags",
    type: 'bitmask',
    bitDescriptions: [
      "Junon Parade tutorial",
      "Space animation shown",
      "Submarine tutorial seen",
      "Forgotten City animation",
      "Unknown",
      "Snow area tutorial seen",
      "Display field help",
      "Bizarro Sephiroth main group"
    ]
  },
  {
    offset: 123,
    size: 1,
    name: "Weapons Killed",
    description: "Status of optional bosses",
    type: 'bitmask',
    bitDescriptions: [
      "Ultimate Weapon killed",
      "Unused",
      "Ultima Weapon HP < 20,000",
      "Ruby Weapon killed",
      "Emerald Weapon killed",
      "Unused",
      "Unused", 
      "Unused"
    ]
  },
  {
    offset: 124,
    size: 1,
    name: "Chocobo Stable Status",
    description: "Which chocobo was taken from stable (0-6)",
    type: 'simple',
    min: 0,
    max: 6
  },
  {
    offset: 125,
    size: 1,
    name: "Chocobo Options",
    description: "Wild chocobo dialog options",
    type: 'bitmask',
    bitDescriptions: [
      "Show send/release options",
      "Unused",
      "Unused",
      "Unused",
      "Unused",
      "Unused",
      "Unused",
      "Unused"
    ]
  },
  {
    offset: 126,
    size: 1,
    name: "Chocobo Display",
    description: "Chocobo display on world map",
    type: 'bitmask',
    bitDescriptions: [
      "Wild chocobo caught",
      "Riding chocobo",
      "Yellow chocobo",
      "Green chocobo",
      "Blue chocobo", 
      "Black chocobo",
      "Gold chocobo",
      "Unused"
    ]
  },
  {
    offset: 127,
    size: 1,
    name: "Vehicle Display",
    description: "Vehicle display on world map",
    type: 'bitmask',
    bitDescriptions: [
      "Buggy available",
      "Driving buggy",
      "Tiny Bronco available",
      "Unused",
      "Highwind available",
      "Highwind flying",
      "Unused",
      "Unused"
    ]
  },
  {
    offset: 160,
    size: 1,
    name: "Wall Market Items 1",
    description: "Wall Market progress items",
    type: 'bitmask',
    bitDescriptions: [
      "Cologne",
      "Flower Cologne",
      "Sexy Cologne",
      "Wig",
      "Dyed Wig",
      "Blonde Wig",
      "Pharmacy Coupon",
      "Any Wig obtained"
    ]
  },
  {
    offset: 161,
    size: 1,
    name: "Wall Market Items 2",
    description: "Wall Market makeup and dress items",
    type: 'bitmask',
    bitDescriptions: [
      "Poor makeup result",
      "Average makeup result", 
      "Best makeup result",
      "Dress obtained",
      "Dress selected",
      "Cotton Dress",
      "Satin Dress",
      "Silk Dress"
    ]
  },
  {
    offset: 162,
    size: 1,
    name: "Wall Market Items 3",
    description: "Wall Market pharmacy and vending items",
    type: 'bitmask',
    bitDescriptions: [
      "Disinfectant",
      "Deodorant",
      "Digestive",
      "Materia shop request",
      "200 gil vending item",
      "100 gil vending item",
      "50 gil vending item",
      "Boutique son request"
    ]
  },
  {
    offset: 163,
    size: 1,
    name: "Cloud Beauty Level",
    description: "Ms. Cloud beauty contest score (0-25 points)",
    type: 'simple',
    min: 0,
    max: 25
  },
  {
    offset: 164,
    size: 1,
    name: "Train Positions",
    description: "Train positions in Sector 7 Graveyard",
    type: 'bitmask',
    bitDescriptions: [
      "Train 1 moved",
      "Train 2 moved",
      "Train 3 moved",
      "Unused",
      "Unused",
      "Unused",
      "Unused",
      "Unused"
    ]
  },
  {
    offset: 165,
    size: 1,
    name: "Wall Market Batteries",
    description: "Battery collection progress in Wall Market",
    type: 'bitmask',
    bitDescriptions: [
      "Saw first battery holder",
      "First battery applied",
      "Second battery applied",
      "Unused",
      "Third battery and Ether obtained",
      "Battery pack 1/3 collected",
      "Battery pack 2/3 collected",
      "Battery pack 3/3 collected"
    ]
  },
  {
    offset: 166,
    size: 1,
    name: "Fort Condor Battles",
    description: "Number of Fort Condor battles fought",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 167,
    size: 1,
    name: "Fort Condor Wins",
    description: "Number of Fort Condor battles won",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 180,
    size: 2,
    name: "Fort Condor Funds",
    description: "Current funds for Fort Condor",
    type: 'simple',
    min: 0,
    max: 65535
  },
  {
    offset: 182,
    size: 1,
    name: "Fort Condor Losses",
    description: "Number of Fort Condor battles lost",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 224,
    size: 1,
    name: "Shinra Floor Access",
    description: "Which Shinra floors are unlocked by keycards",
    type: 'simple',
    min: 0,
    max: 255
  },
  {
    offset: 225,
    size: 1,
    name: "Reactor Mission Flags 1",
    description: "First reactor mission progress flags",
    type: 'bitmask',
    bitDescriptions: [
      "Elevator on top floor",
      "Unused",
      "Unused",
      "First door opened",
      "Second door opened",
      "Jessie freed from stuck",
      "Bomb set",
      "Time out for game over"
    ]
  },
  {
    offset: 226,
    size: 1,
    name: "Reactor Mission Flags 2",
    description: "Additional reactor mission flags",
    type: 'bitmask',
    bitDescriptions: [
      "Unused",
      "Elevator door opened",
      "Scrolled at map init",
      "Unused",
      "Unused",
      "Unused",
      "Unused",
      "Unused"
    ]
  }
];

export function VariablesEditorModal({ isOpen, setIsOpen, ff7 }: VariablesEditorModalProps) {
  const [selectedBank, setSelectedBank] = useState("1");
  const [variables, setVariables] = useState<number[]>([]);
  const [viewFormat, setViewFormat] = useState<ViewFormat>("Decimal");
  const [is16BitMode, setIs16BitMode] = useState(false);
  const [changedIndices, setChangedIndices] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("simple");
  const previousVariables = useRef<number[]>([]);
  const isInitialLoad = useRef(true);
  const isBankChanging = useRef(false);
  const [editValue, setEditValue] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const loadVariables = async () => {
    const bank = parseInt(selectedBank);
    const vars = await ff7.getVariables(bank);
    
    // Check for changes, but skip if it's initial load or bank change
    if (!isInitialLoad.current && !isBankChanging.current) {
      const changed = new Set<number>();
      vars.forEach((value, index) => {
        if (previousVariables.current[index] !== value) {
          changed.add(index);
        }
      });
      
      if (changed.size > 0) {
        setChangedIndices(changed);
        // Clear the changed indices after the flash duration
        setTimeout(() => setChangedIndices(new Set()), 200);
      }
    }
    
    previousVariables.current = vars;
    setVariables(vars);
    
    // Reset flags after loading
    isInitialLoad.current = false;
    isBankChanging.current = false;
  };

  useEffect(() => {
    if (isOpen) {
      // Set initial load flag when modal opens
      isInitialLoad.current = true;
      // Load variables immediately when opened
      loadVariables();

      // Set up interval to reload variables
      const interval = setInterval(loadVariables, 500);

      // Clean up interval when modal closes or bank changes
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedBank]);

  // Handle bank changes
  const handleBankChange = (bank: string) => {
    isBankChanging.current = true;
    setSelectedBank(bank);
  };

  const handle16BitModeChange = (enabled: boolean) => {
    setIs16BitMode(enabled);
    if (enabled && viewFormat === "Binary") {
      setViewFormat("Decimal");
    }
  };

  const get16BitValue = (index: number): number => {
    const low = variables[index * 2] || 0;
    const high = variables[index * 2 + 1] || 0;
    return low + (high << 8);
  };

  const formatValue = (value: number, index: number) => {
    if (is16BitMode) {
      value = get16BitValue(index);
    }

    switch (viewFormat) {
      case "Hex":
        return value.toString(16).toUpperCase().padStart(is16BitMode ? 4 : 2, "0");
      case "Binary":
        return value.toString(2).padStart(is16BitMode ? 16 : 8, "0");
      default:
        return value.toString();
    }
  };

  const getDisplayVariables = () => {
    if (!is16BitMode) return variables;
    
    // Create array of indices for 16-bit mode (half the length)
    return Array.from({ length: Math.ceil(variables.length / 2) }, (_, i) => i);
  };

  const isChanged = (index: number): boolean => {
    if (is16BitMode) {
      return changedIndices.has(index * 2) || changedIndices.has(index * 2 + 1);
    }
    return changedIndices.has(index);
  };

  const parseInputValue = (input: string): number => {
    try {
      if (viewFormat === "Hex") {
        return parseInt(input, 16);
      } else if (viewFormat === "Binary") {
        return parseInt(input, 2);
      }
      return parseInt(input, 10);
    } catch {
      return 0;
    }
  };

  const handleEdit = async (index: number) => {
    const value = is16BitMode ? get16BitValue(index) : variables[index];
    setEditIndex(index);
    setEditValue(formatValue(value, index));
  };

  const handleSubmitEdit = async () => {
    if (editIndex === null) return;

    const bank = parseInt(selectedBank);
    const value = parseInputValue(editValue);

    if (is16BitMode) {
      const baseIndex = editIndex * 2;
      const low = value & 0xFF;
      const high = (value >> 8) & 0xFF;
      await ff7.setVariable(bank, baseIndex, low);
      await ff7.setVariable(bank, baseIndex + 1, high);
    } else {
      await ff7.setVariable(bank, editIndex, value & 0xFF);
    }

    setEditIndex(null);
    await loadVariables();
  };

  const bankTitles = ["1/2", "3/4", "B/C", "D/E", "7/F"];

  // Filter variables based on search query
  const filteredVariables = BANK_1_2_VARIABLES.filter(variable =>
    variable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    variable.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to get value from variables array
  const getVariableValue = (offset: number, size: 1 | 2 | 3): number => {
    if (size === 1) {
      return variables[offset] || 0;
    } else if (size === 2) {
      const low = variables[offset] || 0;
      const high = variables[offset + 1] || 0;
      return low + (high << 8);
    } else { // size === 3
      const byte1 = variables[offset] || 0;
      const byte2 = variables[offset + 1] || 0;
      const byte3 = variables[offset + 2] || 0;
      return byte1 + (byte2 << 8) + (byte3 << 16);
    }
  };

  // Helper function to set variable value
  const setVariableValue = async (offset: number, size: 1 | 2 | 3, value: number) => {
    const bank = parseInt(selectedBank);
    
    if (size === 1) {
      await ff7.setVariable(bank, offset, value & 0xFF);
    } else if (size === 2) {
      const low = value & 0xFF;
      const high = (value >> 8) & 0xFF;
      await ff7.setVariable(bank, offset, low);
      await ff7.setVariable(bank, offset + 1, high);
    } else { // size === 3
      const byte1 = value & 0xFF;
      const byte2 = (value >> 8) & 0xFF;
      const byte3 = (value >> 16) & 0xFF;
      await ff7.setVariable(bank, offset, byte1);
      await ff7.setVariable(bank, offset + 1, byte2);
      await ff7.setVariable(bank, offset + 2, byte3);
    }
    
    await loadVariables();
  };

  return (
    <Modal
      open={isOpen}
      setIsOpen={setIsOpen}
      title="Variables Editor"
      size="lg"
      callback={() => {}}
    >
      <div className="p-2 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Bank:</span>
            <Select value={selectedBank} onValueChange={handleBankChange}>
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((bank) => (
                  <SelectItem key={bank} value={bank.toString()} className="text-xs">
                    Bank {bank} ({bankTitles[bank - 1]})
                  </SelectItem>
                ))}
                <SelectItem key={6} value={"6"} className="text-xs">
                  Temp Bank (5/6)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="text-xs">Simple</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="simple" className="mt-2">
            {/* Only show simple interface for Banks 1/2 */}
            {(selectedBank === "1" || selectedBank === "2") ? (
              <>
                {/* Search field - sticky */}
                <div className="sticky top-0 bg-slate-900 z-10 pb-2 border-b border-slate-700 mb-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      placeholder="Search variables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Variables list */}
                <div className="max-h-[60vh] overflow-y-auto space-y-2">
                  {filteredVariables.map((variable) => {
                    const value = getVariableValue(variable.offset, variable.size);
                    
                    // Simplified inline field implementation
                    return (
                      <div 
                        key={variable.offset}
                        className={`flex items-center justify-between p-2 rounded-sm transition-colors duration-200 cursor-pointer hover:bg-zinc-700/50 ${
                          isChanged(variable.offset) ? 'bg-yellow-500/25' : 'bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {variable.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {variable.description} ({variable.type})
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">#{variable.offset}</span>
                          <EditPopover
                            defaultValue={value.toString()}
                            onSubmit={(editValue: string) => {
                              const newValue = parseInt(editValue, 10);
                              if (!isNaN(newValue)) {
                                const maxValue = variable.size === 1 ? 255 : variable.size === 2 ? 65535 : 16777215;
                                const clampedValue = Math.max(
                                  variable.min ?? 0,
                                  Math.min(variable.max ?? maxValue, newValue)
                                );
                                setVariableValue(variable.offset, variable.size, clampedValue);
                              }
                            }}
                          >
                            <span className="text-xs font-mono text-slate-200 min-w-[3rem] text-right cursor-pointer hover:text-blue-400">
                              {value}
                            </span>
                          </EditPopover>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                Simple interface is only available for Banks 1/2.
                <br />
                Switch to Advanced tab to edit other banks.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-2">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">View as:</span>
                <Select value={viewFormat} onValueChange={(value: ViewFormat) => setViewFormat(value)}>
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Decimal" className="text-xs">Decimal</SelectItem>
                    <SelectItem value="Hex" className="text-xs">Hex</SelectItem>
                    <SelectItem value="Binary" className="text-xs" disabled={is16BitMode}>Binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">16-bit mode:</span>
                <Switch
                  checked={is16BitMode}
                  onCheckedChange={handle16BitModeChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-x-4 gap-y-1 max-h-[60vh] overflow-y-auto pr-2">
              {getDisplayVariables().map((value, index) => (
                <div key={index} className="contents">
                  <div 
                    className={`flex items-center gap-2 text-xs px-2 py-1 rounded-sm transition-colors duration-200 ${
                      isChanged(index) 
                        ? 'bg-yellow-500/25' 
                        : 'bg-zinc-800/50'
                    } cursor-pointer hover:bg-zinc-700/50`}
                    data-trigger="true"
                    onClick={() => handleEdit(index)}
                  >
                    <EditPopover
                      open={editIndex === index}
                      onOpenChange={(open) => {
                        if (!open) setEditIndex(null);
                      }}
                      value={editValue}
                      onValueChange={setEditValue}
                      onSubmit={handleSubmitEdit}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-slate-400 w-6">#{is16BitMode ? index * 2 : index}</span>
                        <span className="flex-1 font-mono">{formatValue(value, index)}</span>
                      </div>
                    </EditPopover>
                  </div>
                  {index % 4 === 3 && <div className="col-span-4 h-px bg-zinc-800/50 -mx-2" />}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Modal>
  );
} 