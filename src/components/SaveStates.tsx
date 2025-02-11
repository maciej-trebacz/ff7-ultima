import { Button } from "@/components/ui/button";
import { EditPopover } from "@/components/EditPopover";
import { SaveState } from "@/useSaveStates";
import { FF7 } from "@/useFF7";
import { useState } from "react";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SaveStatesProps {
  ff7: FF7;
}

interface SaveStateRowProps {
  state: SaveState;
  index: number;
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
  index,
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
  } = useSortable({ id: state.timestamp.toString() });

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
  const [titleEditIndex, setTitleEditIndex] = useState<number | null>(null);
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
      const oldIndex = ff7.saveStates.fieldStates.findIndex(
        state => state.timestamp.toString() === active.id
      );
      const newIndex = ff7.saveStates.fieldStates.findIndex(
        state => state.timestamp.toString() === over.id
      );
      
      ff7.saveStates.reorderFieldStates(oldIndex, newIndex);
    }
  };

  return (
    <div>
      <div className="relative">
        <h2 className="uppercase mt-2 font-medium text-sm border-b border-zinc-600 pb-0 mb-2 tracking-wide text-zinc-900 dark:text-zinc-100">
          Save states
        </h2>
        <Button disabled={!ff7.connected} className="absolute right-0 top-[2px] cursor-pointer" size="xs" onClick={() => {
          const title = prompt("Enter a title for this save state (optional):");
          ff7.saveState(title || undefined);
        }}>
          New State
        </Button>
      </div>
      
      {ff7.saveStates.fieldStates.length > 0 ? (
        <div className="mb-4 max-h-48 overflow-y-auto">
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
                  items={ff7.saveStates.fieldStates.map(state => state.timestamp.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  {ff7.saveStates.fieldStates.map((state: SaveState, index: number) => (
                    <SaveStateRow
                      key={state.timestamp}
                      state={state}
                      index={index}
                      onLoad={() => ff7.loadState(index)}
                      onDelete={() => ff7.saveStates.removeFieldState(index)}
                      onTitleChange={(title) => {
                        ff7.saveStates.updateFieldStateTitle(index, title);
                        setTitleEditOpen(false);
                      }}
                      titleEditOpen={titleEditOpen && titleEditIndex === index}
                      titleEditValue={titleEditValue}
                      onTitleEditOpenChange={(open) => {
                        setTitleEditOpen(open);
                        if (open) {
                          setTitleEditIndex(index);
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