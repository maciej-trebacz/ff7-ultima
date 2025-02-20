import { cn } from "@/lib/utils";
import { GameModule } from "@/types";
import { FF7 } from "@/useFF7";
import { formatTime } from "@/util";
import React, { useState, useEffect } from "react";
import { version } from "../../src-tauri/tauri.conf.json";
import { AboutModal } from "./modals/AboutModal";
import { SettingsModal } from "./modals/SettingsModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { loadGeneralSettings, saveGeneralSettings } from "@/settings";

export function StatusBar(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const connected = ff7.connected;
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  useEffect(() => {
    const checkSettingsHint = async () => {
      const settings = await loadGeneralSettings();
      if (!settings.hasSeenSettingsHint) {
        setShowSettingsHint(true);
      }
    };
    checkSettingsHint();
  }, []);

  const handleHintDismiss = async () => {
    setShowSettingsHint(false);
    const settings = await loadGeneralSettings();
    await saveGeneralSettings({ ...settings, hasSeenSettingsHint: true });
  };

  return (
    <>
      <div className="h-6 bg-zinc-800 items-center flex px-2 text-xs gap-2 flex-shrink-0">
        <div className="flex items-center">
          <div className={cn(connected ? "bg-green-500" : "bg-red-500", "h-[7px] w-[7px] rounded-full mr-1.5 ")}></div>
          {connected ? "Connected" : "Disconnected"}
        </div>
        {connected && <>
          <div className="h-4 w-px bg-zinc-600"></div>
          <div className="flex items-center">
            Module: {GameModule[ff7.gameState.currentModule]}
          </div>
          <div className="h-4 w-px bg-zinc-600"></div>
          <div className="flex items-center">
            Moment: {ff7.gameState.gameMoment}
          </div>
          <div className="h-4 w-px bg-zinc-600"></div>
          <div className="flex items-center">
            Time: {formatTime(ff7.gameState.inGameTime)}
          </div>
          <div className="h-4 w-px bg-zinc-600"></div>
          <div className="flex items-center">
            Disc: {ff7.gameState.discId}
          </div>
        </>}
        <div className="ml-auto flex items-center gap-2">
          <Popover open={showSettingsHint} onOpenChange={setShowSettingsHint}>
            <PopoverTrigger asChild>
              <div 
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer" 
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSettingsModalOpen(true);
                }}
              >
                Settings
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="end" sideOffset={5}>
              <div className="space-y-3">
                <p className="font-medium">Hey, listen!</p>
                <p className="text-sm text-muted-foreground">
                  We've added a Settings section here where you can configure your keyboard shortcuts and other app settings.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleHintDismiss}>
                    Okay
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div className="h-4 w-px bg-zinc-600"></div>
          <div 
            className="text-zinc-400 hover:text-zinc-200 cursor-pointer" 
            onClick={() => setIsAboutModalOpen(true)}
          >
            v{version}
          </div>
        </div>
      </div>
      <SettingsModal isOpen={isSettingsModalOpen} setIsOpen={setIsSettingsModalOpen} ff7={ff7} />
      <AboutModal isOpen={isAboutModalOpen} setIsOpen={setIsAboutModalOpen} />
    </>
  );
}