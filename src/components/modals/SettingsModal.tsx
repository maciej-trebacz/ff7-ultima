import { Modal } from "@/components/Modal";
import { FF7 } from "@/useFF7";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShortcutsContent } from "./ShortcutsModal";
import { GeneralSettingsContent } from "./GeneralSettingsContent";

interface SettingsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  ff7: FF7;
}

export function SettingsModal({ isOpen, setIsOpen, ff7 }: SettingsModalProps) {
  return (
    <Modal
      open={isOpen}
      setIsOpen={setIsOpen}
      title="Settings"
      size="md"
      callback={() => {}}
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
          <TabsTrigger value="shortcuts" className="flex-1">Shortcuts</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-4">
          <GeneralSettingsContent ff7={ff7} />
        </TabsContent>
        <TabsContent value="shortcuts" className="mt-4">
          <ShortcutsContent ff7={ff7} />
        </TabsContent>
      </Tabs>
    </Modal>
  );
} 