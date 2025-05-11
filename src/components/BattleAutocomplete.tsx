import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SceneFormation, SceneEnemy } from "@/types";
import { BattleLocations } from "@/ff7BattleLocations";

export interface BattleFormationItem {
  id: number;
  formation: SceneFormation;
  enemies: SceneEnemy[];
}

interface BattleAutocompleteProps {
  formations: BattleFormationItem[];
  isVisible: boolean;
  onSelect: (id: number | null) => void;
  onAccept?: (e: any) => void;
  placeholder?: string;
  value?: BattleFormationItem;
}

const getBattleType = (setup: SceneFormation['setup']): string => {
  const layoutType = setup.battle_layout_type;
  switch (layoutType) {
    case 0: return "Normal";
    case 1: return "Pre-emptive";
    case 2: return "Back Attack";
    case 3: return "Side Attack";
    case 4: return "Pincer Attack";
    case 5: return "Side Attack (Alt)";
    case 6: return "Side Attack (Alt 2)";
    case 7: return "Side Attack (Alt 3)";
    case 8: return "Front Row Lock";
    default: return "Unknown";
  }
};

const getBattleFlags = (setup: SceneFormation['setup']): string => {
  const flags = [];
  if (!(setup.flags & 0x04)) flags.push("Can't Escape");
  if (!(setup.flags & 0x08)) flags.push("No Victory Poses");
  if (!(setup.flags & 0x10)) flags.push("No Pre-emptive");
  return flags.join(", ");
};

const BattleFormationRow: React.FC<{ item: BattleFormationItem }> = ({ item }) => {
  const { formation, enemies } = item;
  
  // Count occurrences of each enemy
  const enemyCounts = new Map<string, number>();
  formation.enemies.forEach(entry => {
    const enemy = enemies.find(e => e.id === entry.enemy_id);
    const enemyName = enemy ? enemy.name : "Unknown";
    enemyCounts.set(enemyName, (enemyCounts.get(enemyName) || 0) + 1);
  });

  // Format enemy list with counts
  const enemyList = Array.from(enemyCounts.entries()).map(([name, count]) => 
    count > 1 ? `${name.trim()} (x${count})` : name.trim()
  );

  const battleFlags = getBattleFlags(formation.setup);

  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">#{item.id}</span>
        <span className="text-xs font-medium">{enemyList.join(", ")}</span>
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded",
          formation.setup.battle_layout_type === 0 ? "bg-slate-500/20 text-slate-300" :
          formation.setup.battle_layout_type === 1 ? "bg-green-500/20 text-green-300" :
          formation.setup.battle_layout_type === 2 ? "bg-red-500/20 text-red-300" :
          formation.setup.battle_layout_type === 3 ? "bg-blue-500/20 text-blue-300" :
          formation.setup.battle_layout_type === 4 ? "bg-red-600/40 text-red-200" :
          formation.setup.battle_layout_type === 8 ? "bg-purple-500/20 text-purple-300" :
          "bg-orange-500/20 text-orange-300"
        )}>
          {getBattleType(formation.setup)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground line-clamp-1">
        <span>{BattleLocations[formation.setup.battle_location]}</span>
        {battleFlags && (
          <div className="flex gap-1">
            {battleFlags.split(", ").map((flag, index) => (
              <span key={index} className="px-1 py-0 text-[10px] rounded bg-slate-700/50 text-slate-300">
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BattleAutocomplete: React.FC<BattleAutocompleteProps> = ({ 
  formations, 
  isVisible, 
  onSelect, 
  onAccept, 
  placeholder = "Search battle formations...",
  value
}) => {
  const [input, setInput] = useState<string>(value?.formation.setup.battle_location.toString() ?? '');
  const [suggestions, setSuggestions] = useState<BattleFormationItem[]>([]);
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
      setInput(value?.formation.setup.battle_location.toString() ?? '');
      setHighlightedIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current) {
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isVisible, value?.formation.setup.battle_location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // If input is a number, only match by formation ID
    if (!isNaN(Number(value))) {
      const idMatches = formations.filter(formation => 
        formation.id.toString().includes(value)
      );
      setSuggestions(idMatches);
      setIsOpen(true);
      setHighlightedIndex(-1);
      return;
    }

    const searchTerm = value.toLowerCase();
    const enemyMatches: BattleFormationItem[] = [];
    const locationMatches: BattleFormationItem[] = [];

    formations.forEach(formation => {
      const location = BattleLocations[formation.formation.setup.battle_location]?.toLowerCase() ?? '';
      const enemyNames = formation.formation.enemies.map(e => 
        formation.enemies.find(f => f.id === e.enemy_id)?.name.toLowerCase()
      );

      // Check for enemy name matches
      if (enemyNames.some(name => name?.includes(searchTerm))) {
        enemyMatches.push(formation);
      }
      // Only add to location matches if no enemy match was found
      else if (location.includes(searchTerm)) {
        locationMatches.push(formation);
      }
    });

    // Combine matches with enemy matches first, then location matches
    setSuggestions([...enemyMatches, ...locationMatches]);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = (formation: BattleFormationItem) => {
    setInput(formation.id.toString());
    setIsOpen(false);
    onSelect(formation.id);
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
          } else if (suggestions.length > 0) {
            handleSelectSuggestion(suggestions[0]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    }
    else if (e.key === 'Enter' && highlightedIndex === -1) {
      onAccept?.(e);
    }
  };

  const maxSuggestions = input.length > 2 ? 50 : 25;

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
              setSuggestions(formations);
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
          {suggestions.slice(0, maxSuggestions).map((formation, index) => (
            <div
              key={formation.id}
              onClick={() => handleSelectSuggestion(formation)}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none",
                index === highlightedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <BattleFormationRow item={formation} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BattleAutocomplete; 