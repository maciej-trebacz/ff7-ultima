import { Button } from "@/components/ui/button";
import { FF7 } from "@/useFF7";
import { useState } from "react";
import { VariablesEditorModal } from "@/components/modals/VariablesEditorModal";

interface AdvancedProps {
  ff7: FF7;
}

export function Advanced({ ff7 }: AdvancedProps) {
  const [isVariablesEditorModalOpen, setIsVariablesEditorModalOpen] = useState(false);

  return (
    <>
      <h2 className="uppercase font-medium text-sm border-b border-zinc-600 pb-0 mb-2 tracking-wide text-zinc-900 dark:text-zinc-100">
        Advanced
      </h2>
      <div className="flex gap-1">
        <div className="flex-1 flex flex-col gap-1">
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={() => setIsVariablesEditorModalOpen(true)}
            >
              Variables Editor
            </Button>
          </div>
        </div>
      </div>

      <VariablesEditorModal
        isOpen={isVariablesEditorModalOpen}
        setIsOpen={setIsVariablesEditorModalOpen}
        ff7={ff7}
      />
    </>
  );
} 