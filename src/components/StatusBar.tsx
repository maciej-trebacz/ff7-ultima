import { cn } from "@/lib/utils";
import { GameModule, UpdateInfo } from "@/types";
import { FF7 } from "@/useFF7";
import { formatTime } from "@/util";
import React, { useState, useEffect } from "react";
import { version } from "../../src-tauri/tauri.conf.json";
import { AboutModal } from "./modals/AboutModal";
import { SettingsModal } from "./modals/SettingsModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/useSettings";
import { invoke } from "@tauri-apps/api/core";
import { DownloadCloud } from "lucide-react";

export function StatusBar(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const connected = ff7.connected;
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateHintPopover, setShowUpdateHintPopover] = useState(false);
  const { generalSettings, updateGeneralSettings } = useSettings();

  useEffect(() => {
    const initialize = async () => {
      if (generalSettings) {
        // Check settings hint visibility
        if (!generalSettings.hasSeenSettingsHint) {
          setShowSettingsHint(true);
        }

        // Check for updates
        try {
          const updateInfo = await invoke<UpdateInfo | null>('check_for_updates');
          if (updateInfo) {
            setUpdateAvailable(updateInfo);
            // Show popover only if this version hasn't been dismissed
            if (updateInfo.version !== generalSettings.lastDismissedUpdateVersion) {
              setShowUpdateHintPopover(true);
            }
          }
        } catch (error) {
          console.error("Failed to check for updates:", error);
        }
      }
    };
    initialize();
  }, [generalSettings]);

  const handleHintDismiss = () => {
    setShowSettingsHint(false);
    if (generalSettings) {
      updateGeneralSettings({ ...generalSettings, hasSeenSettingsHint: true });
    }
  };

  const handleUpdateHintDismiss = () => {
    setShowUpdateHintPopover(false);
    if (updateAvailable && generalSettings) {
      updateGeneralSettings({ ...generalSettings, lastDismissedUpdateVersion: updateAvailable.version });
    }
  };

  const handleUpdateConfirm = async () => {
    if (!updateAvailable) return; 
    setIsUpdating(true);
    try {
      await invoke('execute_update');
    } catch (error) {
      console.error("Failed to perform update:", error);
      setIsUpdating(false);
    }
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
            {ff7.gameState.currentModule === GameModule.Battle && ff7.gameState.battleId !== 0xFFFF && <>
              <span className="text-zinc-400 pl-1">
                ({ff7.gameState.battleId})
              </span>
            </>}
            {ff7.gameState.currentModule === GameModule.Field && <>
              <span className="text-zinc-400 pl-1">
                ({ff7.gameState.fieldId})
              </span>
            </>}
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
            <PopoverContent className="w-80 text-sm" side="bottom" align="end" sideOffset={5}>
              <div className="space-y-3">
                <p className="font-medium">Hey, listen!</p>
                <p className="text-muted-foreground">
                  We've added a Settings section where you can configure your keyboard shortcuts and other app settings.
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
          <div className="flex items-center gap-1">
            <div
              className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              onClick={() => setIsAboutModalOpen(true)}
              title="About FF7 Ultima"
            >
              v{version}
            </div>
            {updateAvailable && (
              <Popover open={showUpdateHintPopover} onOpenChange={setShowUpdateHintPopover}>
                <PopoverTrigger asChild>
                  <div
                    className="text-yellow-400 hover:text-yellow-300 cursor-pointer"
                    title={`Update available: v${updateAvailable.version}`}
                  >
                    <DownloadCloud size={12} className="animate-pulse" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-96 text-sm" side="bottom" align="end" sideOffset={5}>
                  <div className="space-y-3">
                    <p className="font-medium">New version available: v{updateAvailable.version}</p>
                    {updateAvailable.date && <p className="text-[10px] text-muted-foreground !mt-0 mb-2">Released on: {updateAvailable.date.split(" ")[0]}</p>}
                    <div className="max-h-48 overflow-y-auto pr-2">
                      <p className="text-muted-foreground whitespace-pre-wrap text-xs">
                        {updateAvailable.body || "No description provided."}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <Button variant="outline" size="sm" onClick={handleUpdateHintDismiss} disabled={isUpdating}>
                        Dismiss
                      </Button>
                      <Button size="sm" onClick={handleUpdateConfirm} disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Download & Install"}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
      <SettingsModal isOpen={isSettingsModalOpen} setIsOpen={setIsSettingsModalOpen} ff7={ff7} />
      <AboutModal isOpen={isAboutModalOpen} setIsOpen={setIsAboutModalOpen} />
    </>
  );
}