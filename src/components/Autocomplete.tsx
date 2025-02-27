import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BattleItem {
  id: number;
  name: string;
}

interface AutocompleteInputProps {
  battles: BattleItem[];
  isVisible: boolean;
  onSelect: (id: number | null) => void;
  onAccept?: (e: any) => void;
  placeholder?: string;
  value?: BattleItem;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ 
  battles, 
  isVisible, 
  onSelect, 
  onAccept, 
  placeholder = "Search...",
  value
}) => {
  const [input, setInput] = useState<string>(value?.name ?? '');
  const [suggestions, setSuggestions] = useState<BattleItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      setInput(value?.name ?? '');
      setHighlightedIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current) {
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isVisible, value?.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Filter existing battles
    const filteredSuggestions = battles.filter(battle =>
      battle.name.toLowerCase().includes(value.toLowerCase())
    );

    // Add custom entry if input is a number and doesn't exist in battles
    const numValue = parseInt(value);
    if (!isNaN(numValue) && !battles.some(b => b.id === numValue)) {
      filteredSuggestions.unshift({
        id: numValue,
        name: `${numValue} - Custom value`
      });
    }

    setSuggestions(filteredSuggestions);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = (battle: BattleItem) => {
    setInput(battle.name);
    setIsOpen(false);
    onSelect(battle.id);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setInput('');
    setIsOpen(false);
    onSelect(null);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[highlightedIndex]);
            inputRef.current?.focus();
          } else {
            // If input is a number but no suggestion is selected, treat it as a custom value
            const numValue = parseInt(input);
            if (!isNaN(numValue)) {
              handleSelectSuggestion({
                id: numValue,
                name: `${numValue} (custom value)`
              });
            } else if (suggestions.length > 0) {
              handleSelectSuggestion(suggestions[0]);
            }
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    }
    else if (e.key === 'Enter' && highlightedIndex === -1) {
      // If input is a number, allow it as a custom value even when suggestions are closed
      const numValue = parseInt(input);
      if (!isNaN(numValue)) {
        handleSelectSuggestion({
          id: numValue,
          name: `${numValue} (custom value)`
        });
      }
      onAccept?.(e);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) ? <strong key={index}>{part}</strong> : part
        )}
      </>
    );
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (!input) {
              setSuggestions(battles);
              setIsOpen(true);
            }
          }}
          className={cn("w-full", !isVisible && "hidden")}
          placeholder={placeholder}
        />
        {input && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {suggestions.slice(0, 25).map((battle, index) => (
            <div
              key={battle.id}
              onClick={() => handleSelectSuggestion(battle)}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none whitespace-break-spaces overflow-hidden",
                index === highlightedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {highlightMatch(battle.name, input)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;