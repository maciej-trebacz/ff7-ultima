import { EditPopover } from "@/components/EditPopover";

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

interface TimerVariableFieldProps {
  variable: VariableFieldDefinition;
  value: number;
  onChange: (value: number) => void;
  isChanged: boolean;
}

export function TimerVariableField({ variable, value, onChange, isChanged }: TimerVariableFieldProps) {
  const handleSubmit = (editValue: string) => {
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(
        variable.min ?? 0,
        Math.min(variable.max ?? 255, newValue)
      );
      onChange(clampedValue);
    }
  };

  const formatTimeValue = (val: number, type: string): string => {
    if (type.includes("Minutes") || type.includes("Seconds")) {
      return val.toString().padStart(2, '0');
    }
    return val.toString();
  };

  return (
    <div 
      className={`flex items-center justify-between p-2 rounded-sm transition-colors duration-200 cursor-pointer hover:bg-zinc-700/50 ${
        isChanged ? 'bg-yellow-500/25' : 'bg-zinc-800/50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-200 truncate">
          {variable.name}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {variable.description}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">#{variable.offset}</span>
        <EditPopover
          defaultValue={value.toString()}
          onSubmit={handleSubmit}
        >
          <span className="text-xs font-mono text-slate-200 min-w-[3rem] text-right cursor-pointer hover:text-blue-400">
            {formatTimeValue(value, variable.name)}
          </span>
        </EditPopover>
      </div>
    </div>
  );
}