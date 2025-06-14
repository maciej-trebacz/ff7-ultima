import { useState } from "react";
import { EditPopover } from "@/components/EditPopover";
import { TextVariableFieldProps } from "./types";
import { decodeText, encodeText } from "@/ff7/fftext";

export function TextVariableField({ variable, value, onChange, isChanged, searchQuery }: TextVariableFieldProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  
  // Decode the byte array to display text
  const decodedText = (() => {
    try {
      const decoded = decodeText(value);
      return new TextDecoder().decode(decoded);
    } catch (error) {
      console.error('Error decoding text:', error);
      return '[Invalid Text]';
    }
  })();

  const handleEdit = () => {
    console.log('🔍 TextVariableField handleEdit called for:', variable.name, 'value:', value);
    setEditValue(decodedText);
    setEditOpen(true);
    console.log('🔍 TextVariableField editOpen set to true');
  };

  const handleSubmit = () => {
    try {
      const encoded = encodeText(editValue);
      // Pad or truncate to the expected length
      const paddedArray = new Uint8Array(variable.length || value.length);
      const copyLength = Math.min(encoded.length, paddedArray.length);
      paddedArray.set(encoded.slice(0, copyLength));
      
      // Fill remaining bytes with 0xFF (end marker) if the encoded text is shorter
      if (copyLength < paddedArray.length) {
        paddedArray[copyLength] = 0xFF;
      }
      
      onChange(paddedArray);
    } catch (error) {
      console.error('Error encoding text:', error);
      // Don't change the value if encoding fails
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
            console.log('🔍 TextVariableField EditPopover onOpenChange:', open);
            setEditOpen(open);
          }}
          value={editValue}
          onValueChange={(value) => {
            console.log('🔍 TextVariableField EditPopover onValueChange:', value);
            setEditValue(value);
          }}
          onSubmit={handleSubmit}
        >
          <span
            className="text-xs font-mono text-slate-200 min-w-[60px] text-right hover:text-blue-400 truncate max-w-[120px]"
            title={decodedText}
          >
            "{decodedText}"
          </span>
        </EditPopover>
      </div>
    </div>
  );
}
