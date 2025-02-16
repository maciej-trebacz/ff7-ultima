import { useEffect, useState, useRef } from "react";
import { Modal } from "@/components/Modal";
import { FF7 } from "@/useFF7";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EditPopover } from "@/components/EditPopover";

interface VariablesEditorModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  ff7: FF7;
}

type ViewFormat = "Decimal" | "Hex" | "Binary";

export function VariablesEditorModal({ isOpen, setIsOpen, ff7 }: VariablesEditorModalProps) {
  const [selectedBank, setSelectedBank] = useState("1");
  const [variables, setVariables] = useState<number[]>([]);
  const [viewFormat, setViewFormat] = useState<ViewFormat>("Decimal");
  const [is16BitMode, setIs16BitMode] = useState(false);
  const [changedIndices, setChangedIndices] = useState<Set<number>>(new Set());
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

  const bankTitles = ["1/2", "3/4", "B/C", "D/E", "7/F"]

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
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((bank) => (
                  <SelectItem key={bank} value={bank.toString()} className="text-xs">
                    Bank {bank} ({bankTitles[bank - 1]})
                  </SelectItem>
                ))}
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

        <div className="grid grid-cols-4 gap-x-4 gap-y-1 max-h-[60vh] overflow-y-auto pr-2">
          {getDisplayVariables().map((value, index) => (
            <div key={index} className="contents">
              <div 
                className={`flex items-center gap-2 text-xs px-2 py-1 rounded-sm transition-colors duration-200 ${
                  isChanged(index) 
                    ? 'bg-yellow-500/25' 
                    : 'bg-zinc-800/50'
                } cursor-pointer hover:bg-zinc-700/50`}
                onClick={() => handleEdit(index)}
              >
                <EditPopover
                  open={editIndex === index}
                  onOpenChange={(open) => !open && setEditIndex(null)}
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
      </div>
    </Modal>
  );
} 