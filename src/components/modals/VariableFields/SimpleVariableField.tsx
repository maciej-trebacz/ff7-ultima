import { useState } from "react";
import { EditPopover } from "@/components/EditPopover";
import { VariableFieldProps } from "./types";

export function SimpleVariableField({ variable, value, onChange, isChanged, searchQuery }: VariableFieldProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const handleEdit = () => {
    console.log('🔍 SimpleVariableField handleEdit called for:', variable.name, 'value:', value);
    setEditValue(value.toString());
    setEditOpen(true);
    console.log('🔍 SimpleVariableField editOpen set to true');
  };

  const handleSubmit = () => {
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(
        variable.min ?? 0,
        Math.min(variable.max ?? (variable.size === 1 ? 255 : variable.size === 2 ? 65535 : 16777215), newValue)
      );
      onChange(clampedValue);
    }
    setEditOpen(false);
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
          onOpenChange={(open) => {
            console.log('🔍 SimpleVariableField EditPopover onOpenChange:', open);
            setEditOpen(open);
          }}
          value={editValue}
          onValueChange={(value) => {
            console.log('🔍 SimpleVariableField EditPopover onValueChange:', value);
            setEditValue(value);
          }}
          onSubmit={handleSubmit}
        >
          <span
            className="text-xs font-mono text-slate-200 min-w-[26px] text-right hover:text-blue-400"
          >
            {value}
          </span>
        </EditPopover>
      </div>
    </div>
  );
}