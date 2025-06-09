import { useState } from "react";
import { EditPopover } from "@/components/EditPopover";
import { VariableFieldProps } from "./types";

export function TimerVariableField({ variable, value, onChange, isChanged, searchQuery }: VariableFieldProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState("");

  const handleEdit = () => {
    setEditValue(value.toString());
    setEditOpen(true);
  };

  const handleSubmit = () => {
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(
        variable.min ?? 0,
        Math.min(variable.max ?? 255, newValue)
      );
      onChange(clampedValue);
    }
    setEditOpen(false);
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
      onClick={handleEdit}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-200 break-words">
          {variable.name}
        </div>
        <div className="text-xs text-slate-400 break-words">
          {variable.description}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">#{variable.offset}</span>
        <EditPopover
          open={editOpen}
          onOpenChange={setEditOpen}
          value={editValue}
          onValueChange={setEditValue}
          onSubmit={handleSubmit}
        >
          <span
            className="text-xs font-mono text-slate-200 min-w-[26px] text-right hover:text-blue-400"
          >
            {formatTimeValue(value, variable.name)}
          </span>
        </EditPopover>
      </div>
    </div>
  );
}