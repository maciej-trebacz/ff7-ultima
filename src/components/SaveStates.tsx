import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditPopover } from "@/components/EditPopover";
import { CategoryPopover } from "@/components/CategoryPopover";
import { SaveState } from "@/useSaveStates";
import { FF7 } from "@/useFF7";
import { useSettings } from "@/useSettings";
import { useState, useRef, useMemo } from "react";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { open, save, confirm } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { revealItemInDir } from '@tauri-apps/plugin-opener';

interface SaveStatesProps {
  ff7: FF7;
}

interface SaveStateRowProps {
  state: SaveState;
  onLoad: () => void;
  onTitleChange: (title: string) => void;
  titleEditOpen: boolean;
  titleEditValue: string;
  onTitleEditOpenChange: (open: boolean) => void;
  onTitleEditValueChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
  categoryEditOpen: boolean;
  categoryEditValue: string;
  onCategoryEditOpenChange: (open: boolean) => void;
  onCategoryEditValueChange: (value: string) => void;
  existingCategories: string[];
  isSelected: boolean;
  onSelectChange: (checked: boolean, event?: React.MouseEvent) => void;
}

function SaveStateRow({
  state,
  onLoad,
  onTitleChange,
  titleEditOpen,
  titleEditValue,
  onTitleEditOpenChange,
  onTitleEditValueChange,
  onCategoryChange,
  categoryEditOpen,
  categoryEditValue,
  onCategoryEditOpenChange,
  onCategoryEditValueChange,
  existingCategories,
  isSelected,
  onSelectChange
}: SaveStateRowProps) {
  const wasShiftClick = useRef(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: state.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move'
  };

  return (
    <tr ref={setNodeRef} style={style} className="bg-zinc-800/50 text-xs hover:bg-zinc-800" {...attributes} {...listeners}>
      <td className="p-1">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => {
            console.log('Checkbox onCheckedChange:', { checked, isSelected, wasShiftClick: wasShiftClick.current });
            // Only handle onCheckedChange if it's not a shift+click (which is handled by onClick)
            if (!wasShiftClick.current) {
              onSelectChange(checked as boolean);
            }
            // Reset the flag
            wasShiftClick.current = false;
          }}
          onClick={(event) => {
            console.log('Checkbox onClick:', { shiftKey: event.shiftKey, isSelected });
            event.stopPropagation();
            wasShiftClick.current = event.shiftKey;
            onSelectChange(!isSelected, event);
          }}
        />
      </td>
      <td className="p-1 w-40">
        <EditPopover
          open={titleEditOpen}
          onOpenChange={onTitleEditOpenChange}
          value={titleEditValue}
          onValueChange={onTitleEditValueChange}
          onSubmit={() => {
            onTitleChange(titleEditValue);
          }}
        >
          <div className="cursor-pointer">
            {state.title ? (
              <span>{state.title}</span>
            ) : (
              <span className="text-zinc-400">{new Date(state.timestamp).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')}</span>
            )}
          </div>
        </EditPopover>
      </td>
      <td className="p-1 w-32">
        <CategoryPopover
          open={categoryEditOpen}
          onOpenChange={onCategoryEditOpenChange}
          value={categoryEditValue}
          onValueChange={onCategoryEditValueChange}
          onSubmit={(value) => {
            onCategoryChange(value);
          }}
          existingCategories={existingCategories}
        >
          <div className="cursor-pointer">
            {state.category ? (
              <span>{state.category}</span>
            ) : (
              <span className="text-zinc-400">Uncategorized</span>
            )}
          </div>
        </CategoryPopover>
      </td>
      <td className="p-1">
        {state.fieldId}
        <span className="text-zinc-400 ml-1">
          ({state.fieldName})
        </span>
      </td>
      <td className="p-1 text-right">
        <Button
          size="xs"
          variant="secondary"
          onClick={onLoad}
        >
          Load
        </Button>
      </td>
    </tr>
  );
}

export function SaveStates({ ff7 }: SaveStatesProps) {
  const { generalSettings, updateGeneralSettings } = useSettings();
  const [titleEditOpen, setTitleEditOpen] = useState(false);
  const [titleEditStateId, setTitleEditStateId] = useState<string | null>(null);
  const [titleEditValue, setTitleEditValue] = useState("");
  const [categoryEditOpen, setCategoryEditOpen] = useState(false);
  const [categoryEditStateId, setCategoryEditStateId] = useState<string | null>(null);
  const [categoryEditValue, setCategoryEditValue] = useState("");
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  const selectedCategoryFilter = generalSettings?.selectedCategoryFilter || "all";

  const handleCategoryFilterChange = (value: string) => {
    if (generalSettings) {
      updateGeneralSettings({
        ...generalSettings,
        selectedCategoryFilter: value,
      });
    }
  };

  console.log('SaveStates render:', { lastSelectedIndex, selectedStatesSize: selectedStates.size });

  const getExistingCategories = (): string[] => {
    const categories = ff7.saveStates.fieldStates
      .map(state => state.category)
      .filter((category): category is string => Boolean(category && category.trim()))
      .filter((category, index, array) => array.indexOf(category) === index)
      .sort();
    return categories;
  };

  const filteredFieldStates = useMemo(() => {
    if (selectedCategoryFilter === "all") {
      return ff7.saveStates.fieldStates;
    }
    if (selectedCategoryFilter === "uncategorized") {
      return ff7.saveStates.fieldStates.filter(state => !state.category || state.category.trim() === "");
    }
    return ff7.saveStates.fieldStates.filter(state => state.category === selectedCategoryFilter);
  }, [ff7.saveStates.fieldStates, selectedCategoryFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStates(new Set(filteredFieldStates.map(state => state.id)));
    } else {
      setSelectedStates(new Set());
    }
    setLastSelectedIndex(null); // Reset last selected index when select all is used
  };

  const handleSelectState = (stateId: string, checked: boolean, event?: React.MouseEvent) => {
    console.log('handleSelectState called:', {
      stateId,
      checked,
      shiftKey: event?.shiftKey,
      lastSelectedIndex,
      currentStates: Array.from(selectedStates)
    });

    const newSelected = new Set(selectedStates);
    const currentIndex = filteredFieldStates.findIndex(state => state.id === stateId);

    console.log('Current index:', currentIndex);

    if (event?.shiftKey && lastSelectedIndex !== null) {
      console.log('Shift+click range selection triggered');
      // Shift+click: select range between last selected and current
      const startIndex = Math.min(lastSelectedIndex, currentIndex);
      const endIndex = Math.max(lastSelectedIndex, currentIndex);

      console.log('Range:', { startIndex, endIndex });

      // Determine the action based on the target state
      const targetStateId = filteredFieldStates[currentIndex].id;
      const isTargetCurrentlySelected = selectedStates.has(targetStateId);

      console.log('Target state:', { targetStateId, isTargetCurrentlySelected });

      // If the target is currently selected, deselect the range; otherwise, select it
      for (let i = startIndex; i <= endIndex; i++) {
        const id = filteredFieldStates[i].id;
        if (isTargetCurrentlySelected) {
          newSelected.delete(id);
          console.log('Deselecting:', id);
        } else {
          newSelected.add(id);
          console.log('Selecting:', id);
        }
      }
    } else {
      console.log('Regular click');
      // Regular click: select/deselect single item
      if (checked) {
        newSelected.add(stateId);
        console.log('Adding:', stateId);
      } else {
        newSelected.delete(stateId);
        console.log('Removing:', stateId);
      }
    }

    console.log('Final selected states:', Array.from(newSelected));
    setSelectedStates(newSelected);
    setLastSelectedIndex(currentIndex);
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm(`Are you sure you want to delete ${selectedStates.size} save state(s)?`, {
      title: 'Delete Save States',
      kind: 'warning',
      okLabel: 'Delete',
      cancelLabel: 'Cancel'
    });
    
    if (confirmed) {
      ff7.saveStates.removeFieldStates(Array.from(selectedStates));
      setSelectedStates(new Set());
    }
  };

  const handleBulkChangeCategory = () => {
    const newCategory = prompt("Enter a new category for the selected save states:");
    if (newCategory !== null) {
      const trimmedCategory = newCategory.trim();
      selectedStates.forEach(stateId => {
        ff7.saveStates.updateFieldStateCategory(stateId, trimmedCategory);
      });
      setSelectedStates(new Set());
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      ff7.saveStates.reorderFieldStates(active.id.toString(), over.id.toString());
    }
  };

  const handleExportStates = async () => {
    try {
      const selected = await save({
        filters: [{ name: "Ultima FF7 State Files", extensions: ["ff7states"] }],
        defaultPath: `${new Date().toISOString().split('T')[0]}`
      });
      
      if (!selected) return;
      
      const exportData = ff7.saveStates.exportStates();
      const json = JSON.stringify(exportData, null, 2);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(json);
      
      await writeFile(selected, bytes);
      await revealItemInDir(selected);
    } catch (error) {
      alert("Error exporting states: " + error);
    }
  };

  const handleImportStates = async () => {
    try {
      const selected = await open({
        filters: [{ name: "Ultima FF7 State Files", extensions: ["ff7states"] }],
        multiple: false
      });
      
      if (!selected || typeof selected !== "string") return;
      
      const fileContent = await readFile(selected);
      const decoder = new TextDecoder();
      const json = decoder.decode(fileContent);
      const data = JSON.parse(json);
      ff7.saveStates.importStates(data);
    } catch (error) {
      alert("Error importing states: " + JSON.stringify(error));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <h2 className="uppercase font-medium text-sm tracking-wide text-zinc-900 dark:text-zinc-100">
              Save states
            </h2>
            <Select value={selectedCategoryFilter} onValueChange={handleCategoryFilterChange}>
              <SelectTrigger className="w-auto h-6 text-xs">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {getExistingCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            {selectedStates.size > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="xs">
                    Bulk Actions ({selectedStates.size})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={handleBulkChangeCategory}
                    >
                      Change Category
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <Button variant="link" size="xs" onClick={handleImportStates}>
              Import states
            </Button>
            <Button variant="link" size="xs" onClick={handleExportStates}>
              Export states
            </Button>
            <Button disabled={!ff7.connected} className="cursor-pointer" size="xs" onClick={() => {
              const title = prompt("Enter a title for this save state (optional):");
              ff7.saveState(title || undefined);
            }}>
              New State
            </Button>
          </div>
        </div>
        <div className="border-b border-zinc-600 -mt-1" />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden mt-1">
        {filteredFieldStates.length > 0 ? (
          <table className="w-full">
            <thead className="bg-zinc-800 text-xs text-left sticky top-0">
              <tr>
                <th className="p-1">
                  <Checkbox
                    checked={selectedStates.size === filteredFieldStates.length && filteredFieldStates.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-1">Title</th>
                <th className="p-1">Category</th>
                <th className="p-1">Field</th>
                <th className="p-1 text-right">&nbsp;</th>
              </tr>
            </thead>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <tbody>
                <SortableContext
                  items={filteredFieldStates.map(state => state.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredFieldStates.map((state: SaveState) => (
                    <SaveStateRow
                      key={state.id}
                      state={state}
                      onLoad={() => ff7.loadState(state.id)}
                      onTitleChange={(title) => {
                        ff7.saveStates.updateFieldStateTitle(state.id, title);
                        setTitleEditOpen(false);
                      }}
                      titleEditOpen={titleEditOpen && titleEditStateId === state.id}
                      titleEditValue={titleEditValue}
                      onTitleEditOpenChange={(open) => {
                        setTitleEditOpen(open);
                        if (open) {
                          setTitleEditStateId(state.id);
                          setTitleEditValue(state.title || "");
                        }
                      }}
                      onTitleEditValueChange={setTitleEditValue}
                      onCategoryChange={(category) => {
                        ff7.saveStates.updateFieldStateCategory(state.id, category);
                        setCategoryEditOpen(false);
                      }}
                      categoryEditOpen={categoryEditOpen && categoryEditStateId === state.id}
                      categoryEditValue={categoryEditValue}
                      onCategoryEditOpenChange={(open) => {
                        setCategoryEditOpen(open);
                        if (open) {
                          setCategoryEditStateId(state.id);
                          setCategoryEditValue(state.category || "");
                        }
                      }}
                      onCategoryEditValueChange={setCategoryEditValue}
                      existingCategories={getExistingCategories()}
                      isSelected={selectedStates.has(state.id)}
                      onSelectChange={(checked, event) => handleSelectState(state.id, checked as boolean, event)}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </DndContext>
          </table>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-xs text-zinc-400 text-center">
              {ff7.saveStates.fieldStates.length === 0 
                ? "No save states found" 
                : `No save states found for category "${selectedCategoryFilter === "uncategorized" ? "Uncategorized" : selectedCategoryFilter}"`}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 pt-2">
        <div className="text-xs text-zinc-400 text-center">Click on title or category to edit • Drag rows to reorder</div>
      </div>
    </div>
  );
} 