import * as React from "react";
import { useState } from "react";
import { RgbColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorSquareProps {
  value: [number, number, number];
  onChange: (color: [number, number, number]) => void;
  className?: string;
  disabled?: boolean;
}

export function ColorSquare({ value, onChange, className, disabled = false }: ColorSquareProps) {
  const [isOpen, setIsOpen] = useState(false);

  const rgbToHex = (rgb: [number, number, number]) => {
    return "#" + rgb.map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const handleColorChange = (color: { r: number; g: number; b: number }) => {
    const rgb: [number, number, number] = [
      Math.round(color.r),
      Math.round(color.g),
      Math.round(color.b)
    ];
    onChange(rgb);
  };

  const rgbToColorObject = (rgb: [number, number, number]) => ({
    r: rgb[0],
    g: rgb[1],
    b: rgb[2]
  });

  const handleRgbInputChange = (index: 0 | 1 | 2, inputValue: string) => {
    const numValue = parseInt(inputValue) || 0;
    const clampedValue = Math.max(0, Math.min(255, numValue));
    const newRgb: [number, number, number] = [...value];
    newRgb[index] = clampedValue;
    onChange(newRgb);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-6 w-6 p-0 border border-gray-300 rounded",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          disabled={disabled}
          style={{ backgroundColor: rgbToHex(value) }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-50 p-3">
        <div className="space-y-3">
          <RgbColorPicker
            color={rgbToColorObject(value)}
            onChange={handleColorChange}
            className="w-full"
          />
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">RGB Values</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={value[0]}
                  onChange={(e) => handleRgbInputChange(0, e.target.value)}
                  className="text-xs w-16 h-6"
                  min={0}
                  max={255}
                />
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={value[1]}
                  onChange={(e) => handleRgbInputChange(1, e.target.value)}
                  className="text-xs w-16 h-6"
                  min={0}
                  max={255}
                />
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={value[2]}
                  onChange={(e) => handleRgbInputChange(2, e.target.value)}
                  className="text-xs w-16 h-6"
                  min={0}
                  max={255}
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Hex: {rgbToHex(value)}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
