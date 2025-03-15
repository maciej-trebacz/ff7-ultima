import { FF7 } from "@/useFF7";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { AutoUpdateOption, GeneralSettings, loadGeneralSettings, loadHackSettings, saveGeneralSettings, saveHackSettings } from "@/settings";

interface GeneralSettingsContentProps {
  ff7: FF7;
}

export function GeneralSettingsContent({ ff7 }: GeneralSettingsContentProps) {
  const autoUpdateOptions = {
    auto: "Auto install",
    notify: "Just notify",
    disabled: "Disabled"
  };

  const autoUpdateHelpText = {
    auto: "Updates will be automatically downloaded and installed when available",
    notify: "You will be notified when updates are available but they won't be installed automatically",
    disabled: "The app will never check for updates"
  };

  const [autoUpdate, setAutoUpdate] = useState<AutoUpdateOption>("notify");
  const [enableShortcuts, setEnableShortcuts] = useState(true);
  const [speedHackEnhancements, setSpeedHackEnhancements] = useState(true);
  const [rememberedHacks, setRememberedHacks] = useState<GeneralSettings['rememberedHacks']>({
    speed: true,
    skipIntros: true,
    unfocusPatch: true,
    swirlSkip: true,
    randomBattles: true,
    expMultiplier: true,
    apMultiplier: true,
    invincibility: true,
    instantATB: true
  });

  useEffect(() => {
    loadGeneralSettings().then(settings => {
      setAutoUpdate(settings.autoUpdate);
      setEnableShortcuts(settings.enableShortcuts);
      setSpeedHackEnhancements(settings.speedHackEnhancements);
      setRememberedHacks(settings.rememberedHacks);
    });
  }, []);

  const saveSettings = async () => {
    await saveGeneralSettings({
      autoUpdate,
      enableShortcuts,
      speedHackEnhancements,
      rememberedHacks
    });
  };

  const getCurrentHackState = (hack: keyof GeneralSettings['rememberedHacks']) => {
    switch (hack) {
      case 'speed':
        return ff7.gameState.speed;
      case 'skipIntros':
        return ff7.introDisabled;
      case 'unfocusPatch':
        return ff7.gameState.unfocusPatchEnabled;
      case 'swirlSkip':
        return ff7.gameState.battleSwirlDisabled;
      case 'randomBattles':
        return ff7.gameState.randomEncounters;
      case 'expMultiplier':
        return ff7.gameState.expMultiplier;
      case 'apMultiplier':
        return ff7.gameState.apMultiplier;
      case 'invincibility':
        return ff7.gameState.invincibilityEnabled;
      case 'instantATB':
        return ff7.gameState.instantATBEnabled;
    }
  };

  const toggleHack = async (hack: keyof GeneralSettings['rememberedHacks']) => {
    const newState = {
      ...rememberedHacks,
      [hack]: !rememberedHacks[hack]
    };

    // Save the general settings first
    await saveGeneralSettings({
      autoUpdate,
      enableShortcuts,
      speedHackEnhancements,
      rememberedHacks: newState
    });

    // Now handle the hack settings
    const hackSettings = await loadHackSettings() || {};
    if (!newState[hack]) {
      // If we're disabling remembering, remove this hack from settings
      delete hackSettings[hack];
      await saveHackSettings(hackSettings);
    } else {
      // If we're enabling remembering, save the current state
      await saveHackSettings({
        ...hackSettings,
        [hack]: getCurrentHackState(hack)
      });
    }

    setRememberedHacks(newState);
  };

  const handleAutoUpdateChange = (value: AutoUpdateOption) => {
    setAutoUpdate(value);
    saveGeneralSettings({
      autoUpdate: value,
      enableShortcuts,
      speedHackEnhancements,
      rememberedHacks
    });
  };

  const handleShortcutsChange = (value: boolean) => {
    setEnableShortcuts(value);
    saveGeneralSettings({
      autoUpdate,
      enableShortcuts: value,
      speedHackEnhancements,
      rememberedHacks
    });
  };

  const handleSpeedHackEnhancementsChange = (value: boolean) => {
    setSpeedHackEnhancements(value);
    saveGeneralSettings({
      autoUpdate,
      enableShortcuts,
      speedHackEnhancements: value,
      rememberedHacks
    });
  };

  return (
    <div className="space-y-6">
      {/* 
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Auto-Update</Label>
          <Select value={autoUpdate} onValueChange={handleAutoUpdateChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(autoUpdateOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-slate-400">{autoUpdateHelpText[autoUpdate]}</p>
      </div>
      */}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Enable Keyboard Shortcuts</Label>
          <Switch checked={enableShortcuts} onCheckedChange={handleShortcutsChange} />
        </div>
        <p className="text-xs text-slate-400">To change the shortcut mapping switch to the Shortcuts tab above</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Speed Hack Enhancements</Label>
          <Switch checked={speedHackEnhancements} onCheckedChange={handleSpeedHackEnhancementsChange} />
        </div>
        <p className="text-xs text-slate-400">When speed hack is enabled this will also:</p>
        <ul className="text-xs text-slate-400 list-disc pl-5 space-y-1">
          <li>disable the temperature dropping in Great Glacier</li>
          <li>disable battles triggered by the wind in Whirlwind Maze</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Label>Remember Hacks</Label>
        <p className="text-xs text-slate-400 mb-2">The selected hacks will be remembered after you close the app and across game sessions</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="speed" 
                checked={rememberedHacks.speed}
                onCheckedChange={() => toggleHack('speed')}
              />
              <label htmlFor="speed" className="text-sm">Game Speed</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="skipIntros" 
                checked={rememberedHacks.skipIntros}
                onCheckedChange={() => toggleHack('skipIntros')}
              />
              <label htmlFor="skipIntros" className="text-sm">Skip Intros</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="unfocusPatch" 
                checked={rememberedHacks.unfocusPatch}
                onCheckedChange={() => toggleHack('unfocusPatch')}
              />
              <label htmlFor="unfocusPatch" className="text-sm">Unfocus Patch</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="swirlSkip" 
                checked={rememberedHacks.swirlSkip}
                onCheckedChange={() => toggleHack('swirlSkip')}
              />
              <label htmlFor="swirlSkip" className="text-sm">Swirl Skip</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="randomBattles" 
                checked={rememberedHacks.randomBattles}
                onCheckedChange={() => toggleHack('randomBattles')}
              />
              <label htmlFor="randomBattles" className="text-sm">Random Battles</label>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="expMultiplier" 
                checked={rememberedHacks.expMultiplier}
                onCheckedChange={() => toggleHack('expMultiplier')}
              />
              <label htmlFor="expMultiplier" className="text-sm">EXP Multiplier</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="apMultiplier" 
                checked={rememberedHacks.apMultiplier}
                onCheckedChange={() => toggleHack('apMultiplier')}
              />
              <label htmlFor="apMultiplier" className="text-sm">AP Multiplier</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="invincibility" 
                checked={rememberedHacks.invincibility}
                onCheckedChange={() => toggleHack('invincibility')}
              />
              <label htmlFor="invincibility" className="text-sm">Invincibility</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="instantATB" 
                checked={rememberedHacks.instantATB}
                onCheckedChange={() => toggleHack('instantATB')}
              />
              <label htmlFor="instantATB" className="text-sm">Instant ATB</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 