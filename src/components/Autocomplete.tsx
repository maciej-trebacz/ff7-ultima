import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';

export interface BattleItem {
  id: number;
  name: string;
}

interface AutocompleteInputProps {
  battles: BattleItem[];
  isVisible: boolean;
  onSelect: (id: number | null) => void;
  onAccept?: (e: any) => void;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ battles, isVisible, onSelect, onAccept }) => {
  const [input, setInput] = useState<string>('');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    const filteredSuggestions = battles.filter(battle =>
      battle.name.toLowerCase().includes(value.toLowerCase())
    );
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

  useEffect(() => {
    if (isVisible) {
      setInput('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    }
  }, [isVisible]);

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
        <input
          ref={inputRef}
          type="text"
          className="input input-bordered w-full pr-10"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter battle name"
        />
        {input && (
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={handleClear}
          >
            <span>✕</span>
          </button>
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="menu bg-base-200 w-full rounded-box absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto shadow-lg flex-nowrap">
          {suggestions.map((battle, index) => (
            <li key={battle.id}>
              <a
                onClick={() => handleSelectSuggestion(battle)}
                className={`hover:bg-base-300 inline ${
                  index === highlightedIndex ? "bg-base-300" : ""
                }`}
              >
                {highlightMatch(battle.name, input)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;