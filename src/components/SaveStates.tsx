import { Button } from "@/components/ui/button";
import { EditPopover } from "@/components/EditPopover";
import { SaveState } from "@/useSaveStates";
import { FF7 } from "@/useFF7";
import { useState } from "react";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { revealItemInDir } from '@tauri-apps/plugin-opener';

interface SaveStatesProps {
  ff7: FF7;
}

interface SaveStateRowProps {
  state: SaveState;
  onLoad: () => void;
  onDelete: () => void;
  onTitleChange: (title: string) => void;
  titleEditOpen: boolean;
  titleEditValue: string;
  onTitleEditOpenChange: (open: boolean) => void;
  onTitleEditValueChange: (value: string) => void;
}

function SaveStateRow({ 
  state, 
  onLoad,
  onDelete,
  onTitleChange,
  titleEditOpen,
  titleEditValue,
  onTitleEditOpenChange,
  onTitleEditValueChange
}: SaveStateRowProps) {
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
      <td className="p-1">
        {state.fieldId}
        <span className="text-zinc-400 ml-1">
          ({state.fieldName})
        </span>
      </td>
      <td className="p-1 text-right space-x-1">
        <Button 
          size="xs" 
          variant="secondary"
          onClick={onLoad}
        >
          Load
        </Button>
        <Button 
          size="xs" 
          variant="destructive"
          onClick={onDelete}
        >
          Delete
        </Button>
      </td>
    </tr>
  );
}

export function SaveStates({ ff7 }: SaveStatesProps) {
  const [titleEditOpen, setTitleEditOpen] = useState(false);
  const [titleEditStateId, setTitleEditStateId] = useState<string | null>(null);
  const [titleEditValue, setTitleEditValue] = useState("");

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
    <div className="mt-2">
      <div className="relative mb-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="uppercase font-medium text-sm tracking-wide text-zinc-900 dark:text-zinc-100">
            Save states
          </h2>
          <div className="flex space-x-2">
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
      
      {ff7.saveStates.fieldStates.length > 0 ? (
        <div className="mb-4 max-h-48 overflow-y-auto overflow-x-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800 text-xs text-left sticky top-0">
              <tr>
                <th className="p-1">Title</th>
                <th className="p-1">Field</th>
                <th className="p-1 text-right">&nbsp;</th>
              </tr>
            </thead>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <tbody>
                <SortableContext 
                  items={ff7.saveStates.fieldStates.map(state => state.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {ff7.saveStates.fieldStates.map((state: SaveState) => (
                    <SaveStateRow
                      key={state.id}
                      state={state}
                      onLoad={() => ff7.loadState(state.id)}
                      onDelete={() => ff7.saveStates.removeFieldState(state.id)}
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
                    />
                  ))}
                </SortableContext>
              </tbody>
            </DndContext>
          </table>
          <div className="text-xs text-zinc-400 mt-1 text-center">Click on the save title to rename it • Drag rows to reorder</div>
        </div>
      ) : (
        <div className="text-xs text-zinc-400 mt-1 mb-4 text-center">No save states found</div>
      )}
    </div>
  );
} 