import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { VariableFieldProps } from "./types";

export function BitmaskVariableField({ variable, value, onChange, isChanged, searchQuery }: VariableFieldProps) {
  const handleBitChange = (bitIndex: number, checked: boolean) => {
    const newValue = checked 
      ? value | (1 << bitIndex)
      : value & ~(1 << bitIndex);
    onChange(newValue);
  };

  const maxBits = variable.size === 1 ? 8 : variable.size === 2 ? 16 : 24;

  // Helper function to highlight matching text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);
    
    return (
      <>
        {before}
        <span className="bg-yellow-400/30 text-yellow-200 font-semibold px-0.5 rounded-sm">
          {match}
        </span>
        {highlightText(after, query)}
      </>
    );
  };

  return (
    <div 
      className={`p-2 rounded-sm transition-colors duration-200 ${
        isChanged ? 'bg-yellow-500/25' : 'bg-zinc-800/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
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
          <span className="text-xs font-mono text-slate-200">
            0x{value.toString(16).toUpperCase().padStart(variable.size * 2, '0')}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-1">
        {Array.from({ length: maxBits }, (_, i) => {
          const isSet = (value & (1 << i)) !== 0;
          const description = variable.bitDescriptions?.[i] || <span className="text-muted-foreground">Unknown / Unused</span>;
          
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={isSet}
                onCheckedChange={(checked) => handleBitChange(i, checked as boolean)}
                className="h-3 w-3"
              />
              <span className="text-slate-400 w-4">#{i}</span>
              <span 
                className="text-slate-200 flex-1 cursor-pointer hover:text-blue-400"
                onClick={() => handleBitChange(i, !isSet)}
              >
                {searchQuery && typeof description === 'string' ? highlightText(description, searchQuery) : description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}