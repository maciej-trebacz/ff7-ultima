import { useEffect, useState, useRef } from "react";
import { FF7 } from "@/useFF7";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EditPopover } from "@/components/EditPopover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { VariableFieldDefinition } from "@/components/modals/VariableFields/types";
import { VisibilityAwareVariableField } from "@/components/VisibilityAwareVariableField";
import { banks, SaveVarDefinition } from "@/data/savemap";
import { Card, CardContent } from "@/components/ui/card";

interface VariablesProps {
  ff7: FF7;
}

type ViewFormat = "Decimal" | "Hex" | "Binary";

const bankTitles = ["1/2", "3/4", "B/C", "D/E", "7/F"];

// Convert savemap format to VariableFieldDefinition format
const convertSaveVarToFieldDefinition = (saveVar: SaveVarDefinition): VariableFieldDefinition[] => {
  let type: 'simple' | 'bitmask' | 'timer' | 'text' | 'unknown' = 'simple';
  let bitDescriptions: string[] | undefined;
  let min: number | undefined;
  let max: number | undefined;

  // Determine type based on savemap type and presence of bits
  if (saveVar.type === 'text') {
    type = 'text';
  } else if (saveVar.type === 'bitmask' && saveVar.bits) {
    type = 'bitmask';
    // Create an array where the index corresponds to the actual bit position
    const maxBits = saveVar.length === 1 ? 8 : saveVar.length === 2 ? 16 : 24;
    bitDescriptions = new Array(maxBits);

    // Map each bit definition to its correct position based on the mask
    saveVar.bits.forEach(bit => {
      const bitPosition = Math.log2(bit.mask);
      if (bitPosition >= 0 && bitPosition < maxBits && Number.isInteger(bitPosition)) {
        bitDescriptions![bitPosition] = bit.label;
      }
    });
  } else if (saveVar.label.toLowerCase().includes('timer') ||
             saveVar.label.toLowerCase().includes('hours') ||
             saveVar.label.toLowerCase().includes('minutes') ||
             saveVar.label.toLowerCase().includes('seconds') ||
             saveVar.label.toLowerCase().includes('frames')) {
    type = 'timer';
    // Set appropriate min/max for timer fields
    if (saveVar.label.toLowerCase().includes('hours')) {
      min = 0;
      max = 255;
    } else if (saveVar.label.toLowerCase().includes('minutes') || saveVar.label.toLowerCase().includes('seconds')) {
      min = 0;
      max = 59;
    } else if (saveVar.label.toLowerCase().includes('frames')) {
      min = 0;
      max = saveVar.label.toLowerCase().includes('countdown') ? 30 : 33;
    }
  } else {
    type = 'simple';
    // Set min/max based on data type
    if (saveVar.type === 'u8') {
      min = 0;
      max = 255;
    } else if (saveVar.type === 'u16') {
      min = 0;
      max = 65535;
    } else if (saveVar.type === 'u24') {
      min = 0;
      max = 16777215;
    }

    // Special cases for specific variables
    if (saveVar.label.toLowerCase().includes('love points')) {
      min = 0;
      max = 255;
    } else if (saveVar.label.toLowerCase().includes('chocobo') && saveVar.label.toLowerCase().includes('rating')) {
      min = 1;
      max = 8;
    } else if (saveVar.label.toLowerCase().includes('beauty level')) {
      min = 0;
      max = 25;
    } else if (saveVar.label.toLowerCase().includes('level')) {
      min = 1;
      max = 99;
    }
  }

  // Handle text variables as single entries regardless of length
  if (saveVar.type === 'text') {
    return [{
      offset: saveVar.offset,
      size: Math.min(saveVar.length, 3) as 1 | 2 | 3,
      name: saveVar.label,
      description: saveVar.description || '',
      type,
      bitDescriptions,
      min,
      max,
      length: saveVar.length // Store the full length for text variables
    }];
  }

  // Handle arrays (length > 3) by creating multiple entries
  if (saveVar.length > 3) {
    const results: VariableFieldDefinition[] = [];
    for (let i = 0; i < saveVar.length; i++) {
      results.push({
        offset: saveVar.offset + i,
        size: 1,
        name: `${saveVar.label} [${i}]`,
        description: `${saveVar.label} byte ${i}`,
        type,
        bitDescriptions,
        min,
        max
      });
    }
    return results;
  }

  // Handle normal cases
  return [{
    offset: saveVar.offset,
    size: Math.min(saveVar.length, 3) as 1 | 2 | 3,
    name: saveVar.label,
    description: saveVar.description || '',
    type,
    bitDescriptions,
    min,
    max
  }];
};

// Get variables for a specific bank
const getBankVariables = (bankNumber: number): VariableFieldDefinition[] => {
  const bankData = banks[bankNumber];
  if (!bankData) return [];

  return bankData.flatMap(convertSaveVarToFieldDefinition);
};

// Get all variables from all banks with bank information
const getAllBankVariables = (): Array<VariableFieldDefinition & { bankNumber: number; bankTitle: string }> => {
  const allVariables: Array<VariableFieldDefinition & { bankNumber: number; bankTitle: string }> = [];

  // Iterate through all banks that have data
  Object.keys(banks).forEach(bankKey => {
    const bankNumber = parseInt(bankKey);
    const bankVariables = getBankVariables(bankNumber);
    const bankTitle = bankNumber === 6 ? "Temp Bank (5/6)" : `Bank ${bankNumber} (${bankTitles[bankNumber - 1]})`;

    bankVariables.forEach(variable => {
      allVariables.push({
        ...variable,
        bankNumber,
        bankTitle
      });
    });
  });

  return allVariables;
};

export function Variables({ ff7 }: VariablesProps) {
  const [selectedBank, setSelectedBank] = useState("1");
  const [variables, setVariables] = useState<number[]>([]);
  const [allBankVariables, setAllBankVariables] = useState<Record<number, number[]>>({});
  const [viewFormat, setViewFormat] = useState<ViewFormat>("Decimal");
  const [is16BitMode, setIs16BitMode] = useState(false);
  const [changedIndices, setChangedIndices] = useState<Set<number>>(new Set());
  const [allBankChangedIndices, setAllBankChangedIndices] = useState<Record<number, Set<number>>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("simple");
  const previousVariables = useRef<number[]>([]);
  const previousAllBankVariables = useRef<Record<number, number[]>>({});
  const isInitialLoad = useRef(true);
  const isBankChanging = useRef(false);
  const [editValue, setEditValue] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const loadAllBankVariables = async () => {
    const allVars: Record<number, number[]> = {};
    const allChanged: Record<number, Set<number>> = {};

    // Load variables for all banks (1-6)
    for (let bankNum = 1; bankNum <= 6; bankNum++) {
      const vars = await ff7.getVariables(bankNum);
      allVars[bankNum] = vars;

      // Check for changes, but skip if it's initial load
      if (!isInitialLoad.current) {
        const changed = new Set<number>();
        const prevVars = previousAllBankVariables.current[bankNum] || [];
        vars.forEach((value, index) => {
          if (prevVars[index] !== value) {
            changed.add(index);
          }
        });

        if (changed.size > 0) {
          allChanged[bankNum] = changed;
          // Clear the changed indices after the flash duration
          setTimeout(() => {
            setAllBankChangedIndices(prev => ({
              ...prev,
              [bankNum]: new Set()
            }));
          }, 200);
        }
      }
    }

    previousAllBankVariables.current = allVars;
    setAllBankVariables(allVars);

    if (Object.keys(allChanged).length > 0) {
      setAllBankChangedIndices(prev => ({ ...prev, ...allChanged }));
    }

    // Reset flags after loading
    isInitialLoad.current = false;
  };

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
    // Set initial load flag when component mounts
    isInitialLoad.current = true;

    // Load appropriate data based on active tab
    if (activeTab === "simple") {
      loadAllBankVariables();
      // Set up interval to reload all bank variables
      const interval = setInterval(loadAllBankVariables, 500);
      return () => clearInterval(interval);
    } else {
      loadVariables();
      // Set up interval to reload variables
      const interval = setInterval(loadVariables, 500);
      return () => clearInterval(interval);
    }
  }, [selectedBank, activeTab]);

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

  // Filter variables based on search query for Simple view (all banks)
  const filteredAllBankVariables = getAllBankVariables().filter(variable => {
    const query = searchQuery.toLowerCase();

    // Check variable name and description
    if (variable.name.toLowerCase().includes(query) ||
        variable.description.toLowerCase().includes(query)) {
      return true;
    }

    // For bitmask variables, also check bit descriptions
    if (variable.type === 'bitmask' && variable.bitDescriptions) {
      return variable.bitDescriptions.some(desc =>
        desc && desc.toLowerCase().includes(query)
      );
    }

    return false;
  });

  // Filter variables based on search query for Advanced view (single bank)
  const filteredVariables = getBankVariables(parseInt(selectedBank)).filter(variable => {
    const query = searchQuery.toLowerCase();

    // Check variable name and description
    if (variable.name.toLowerCase().includes(query) ||
        variable.description.toLowerCase().includes(query)) {
      return true;
    }

    // For bitmask variables, also check bit descriptions
    if (variable.type === 'bitmask' && variable.bitDescriptions) {
      return variable.bitDescriptions.some(desc =>
        desc && desc.toLowerCase().includes(query)
      );
    }

    return false;
  });

  // Helper function to get value from variables array (for Advanced view)
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

  // Helper function to get value from all bank variables (for Simple view)
  const getAllBankVariableValue = (bankNumber: number, offset: number, size: 1 | 2 | 3): number => {
    const bankVars = allBankVariables[bankNumber] || [];
    if (size === 1) {
      return bankVars[offset] || 0;
    } else if (size === 2) {
      const low = bankVars[offset] || 0;
      const high = bankVars[offset + 1] || 0;
      return low + (high << 8);
    } else { // size === 3
      const byte1 = bankVars[offset] || 0;
      const byte2 = bankVars[offset + 1] || 0;
      const byte3 = bankVars[offset + 2] || 0;
      return byte1 + (byte2 << 8) + (byte3 << 16);
    }
  };

  // Helper function to get text value from all bank variables (for Simple view)
  const getAllBankTextVariableValue = (bankNumber: number, offset: number, length: number): Uint8Array => {
    const bankVars = allBankVariables[bankNumber] || [];
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = bankVars[offset + i] || 0;
    }
    return result;
  };

  // Helper function to check if variable changed (for Advanced view)
  const isVariableChanged = (offset: number): boolean => {
    if (is16BitMode) {
      return changedIndices.has(offset * 2) || changedIndices.has(offset * 2 + 1);
    }
    return changedIndices.has(offset);
  };

  // Helper function to check if all bank variable changed (for Simple view)
  const isAllBankVariableChanged = (bankNumber: number, offset: number): boolean => {
    const bankChanged = allBankChangedIndices[bankNumber] || new Set();
    return bankChanged.has(offset);
  };

  // Helper function to set variable value (for Advanced view)
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

  // Helper function to set all bank variable value (for Simple view)
  const setAllBankVariableValue = async (bankNumber: number, offset: number, size: 1 | 2 | 3, value: number) => {
    if (size === 1) {
      await ff7.setVariable(bankNumber, offset, value & 0xFF);
    } else if (size === 2) {
      const low = value & 0xFF;
      const high = (value >> 8) & 0xFF;
      await ff7.setVariable(bankNumber, offset, low);
      await ff7.setVariable(bankNumber, offset + 1, high);
    } else { // size === 3
      const byte1 = value & 0xFF;
      const byte2 = (value >> 8) & 0xFF;
      const byte3 = (value >> 16) & 0xFF;
      await ff7.setVariable(bankNumber, offset, byte1);
      await ff7.setVariable(bankNumber, offset + 1, byte2);
      await ff7.setVariable(bankNumber, offset + 2, byte3);
    }

    await loadAllBankVariables();
  };

  // Helper function to set text variable value (for Simple view)
  const setAllBankTextVariableValue = async (bankNumber: number, offset: number, value: Uint8Array) => {
    for (let i = 0; i < value.length; i++) {
      await ff7.setVariable(bankNumber, offset + i, value[i]);
    }
    await loadAllBankVariables();
  };

  return (
    <div className="flex flex-col gap-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simple" className="text-xs">Simple</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="simple" className="mt-2 flex-1 flex flex-col data-[state=inactive]:hidden">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search field - sticky */}
            <div className="sticky -top-2 -mt-2 z-10 bg-background py-2 border-b border-slate-700 mb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input
                  placeholder="Search variables across all banks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs bg-transparent border-slate-600 focus:border-slate-500"
                />
              </div>
            </div>

            {/* Variables list grouped by bank */}
            <div className="flex-1 space-y-4 min-h-0">
              {Object.keys(banks).map(bankKey => {
                const bankNumber = parseInt(bankKey);
                const bankTitle = bankNumber === 6 ? "Temp Bank (5/6)" : `Bank ${bankNumber} (${bankTitles[bankNumber - 1]})`;

                // Filter variables for this specific bank
                const bankFilteredVariables = filteredAllBankVariables.filter(v => v.bankNumber === bankNumber);

                // Only show bank if it has variables (either no search or matching variables)
                if (searchQuery && bankFilteredVariables.length === 0) {
                  return null;
                }

                const bankVariables = searchQuery ? bankFilteredVariables : getBankVariables(bankNumber).map(v => ({ ...v, bankNumber, bankTitle }));

                if (bankVariables.length === 0) {
                  return null;
                }

                return (
                  <div key={bankNumber} className="space-y-2">
                    {/* Bank header */}
                    <div className="sticky top-[37px] z-0 bg-card py-1 border-b border-slate-600">
                      <h3 className="text-sm pl-2 font-medium text-slate-300">{bankTitle}</h3>
                    </div>

                    {/* Bank variables */}
                    <div className="space-y-1">
                      {bankVariables.map((variable) => {
                        // Handle different variable types
                        let value: number | Uint8Array;
                        let handleVariableChange: (newValue: number | Uint8Array) => Promise<void>;

                        if (variable.type === 'text') {
                          value = getAllBankTextVariableValue(bankNumber, variable.offset, variable.length || variable.size);
                          handleVariableChange = async (newValue: number | Uint8Array) => {
                            await setAllBankTextVariableValue(bankNumber, variable.offset, newValue as Uint8Array);
                          };
                        } else {
                          value = getAllBankVariableValue(bankNumber, variable.offset, variable.size);
                          handleVariableChange = async (newValue: number | Uint8Array) => {
                            await setAllBankVariableValue(bankNumber, variable.offset, variable.size, newValue as number);
                          };
                        }

                        const changed = isAllBankVariableChanged(bankNumber, variable.offset);

                        // Create unique ID for this variable field
                        const uniqueId = `simple-${bankNumber}-${variable.offset}`;

                        return (
                          <VisibilityAwareVariableField
                            key={`${bankNumber}-${variable.offset}`}
                            variable={variable}
                            value={value}
                            onChange={handleVariableChange}
                            isChanged={changed}
                            searchQuery={searchQuery}
                            uniqueId={uniqueId}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-2 flex-1 flex flex-col data-[state=inactive]:hidden">
          {variables.length > 0 ? (
            <>
              <div className="flex items-center gap-4 mb-2">
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

              <div className="grid grid-cols-4 gap-x-4 gap-y-1 flex-1 overflow-y-auto pr-2 min-h-0">
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
            </>
          ) : (
        <Card>
          <CardContent className="p-6 text-center">
            Launch the game to see variables.
          </CardContent>
        </Card>              
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
