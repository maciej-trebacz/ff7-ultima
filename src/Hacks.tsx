import Row from "./components/Row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Switch } from "./components/ui/switch";
import { useAlert } from "./hooks/useAlert";
import { RandomEncounters, Tabs } from "./types";
import { FF7 } from "./useFF7";
import { useEffect } from "react";
import { useSettings } from "./useSettings";

export function Hacks(props: { ff7: FF7, tab: Tabs }) {
  const ff7 = props.ff7;
  const { showAlert, AlertComponent } = useAlert();
  const { generalSettings, hackSettings, updateHackSettings } = useSettings();

  const setSpeed = async (speed: string) => {
    const check = await ff7.setSpeed(parseFloat(speed));
    if (!check) {
      showAlert("Not supported", "This version of FFNx is not supported for setting speed. Use the built-in speedhack instead.");
    } else if (generalSettings?.rememberedHacks.speed) {
      updateHackSettings({ ...hackSettings, speed });
    }
  };

  const setRandomBattles = async (randomEncounters: RandomEncounters) => {
    if (randomEncounters === RandomEncounters.Off) {
      ff7.disableBattles();
    } else if (randomEncounters === RandomEncounters.Normal) {
      ff7.enableBattles();
    } else if (randomEncounters === RandomEncounters.Max) {
      ff7.maxBattles();
    }
    if (generalSettings?.rememberedHacks.randomBattles) {
      updateHackSettings({ ...hackSettings, randomBattles: randomEncounters });
    }
  };

  const toggleSkipIntros = () => {
    const newValue = !ff7.introDisabled;
    newValue ? ff7.enableSkipIntro() : ff7.disableSkipIntro();
    if (generalSettings?.rememberedHacks.skipIntros) {
      updateHackSettings({ ...hackSettings, skipIntros: newValue });
    }
  };

  const toggleUnfocusPatch = () => {
    if (ff7.gameState.isFFnx) return;
    const newValue = !ff7.gameState.unfocusPatchEnabled;
    newValue ? ff7.patchWindowUnfocus() : ff7.unpatchWindowUnfocus();
    if (generalSettings?.rememberedHacks.unfocusPatch) {
      updateHackSettings({ ...hackSettings, unfocusPatch: newValue });
    }
  };

  const toggleSwirlSkip = () => {
    const newValue = !ff7.gameState.battleSwirlDisabled;
    newValue ? ff7.disableBattleSwirl() : ff7.enableBattleSwirl();
    if (generalSettings?.rememberedHacks.swirlSkip) {
      updateHackSettings({ ...hackSettings, swirlSkip: newValue });
    }
  };

  return ( 
    <>
      <Row label="Speed">
        <Select value={ff7.gameState.speed || "1"} onValueChange={setSpeed}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.25">Slowest (1/4x)</SelectItem>
            <SelectItem value="0.5">Slow (1/2x)</SelectItem>
            <SelectItem value="1">Normal (1x)</SelectItem>
            <SelectItem value="2">Fast (2x)</SelectItem>
            <SelectItem value="5">Fastest (5x)</SelectItem>
          </SelectContent>
        </Select>
      </Row>

      <Row label="Skip intros">
        <Switch checked={ff7.introDisabled} onClick={toggleSkipIntros} />
      </Row>

      <div className={ff7.gameState.isFFnx ? "opacity-50" : ""} title={ff7.gameState.isFFnx ? "FFNx already has this feature" : ""}>
        <Row label="Unfocus patch">
          <Switch checked={ff7.gameState.unfocusPatchEnabled} onClick={toggleUnfocusPatch} />
        </Row>
      </div>
      
      <Row label="Swirl skip">
        <Switch checked={ff7.gameState.battleSwirlDisabled} onClick={toggleSwirlSkip} />
      </Row>

      <Row label="Random battles">
        <Select value={'' + ff7.gameState.randomEncounters} onValueChange={v => setRandomBattles(parseInt(v) as RandomEncounters)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={'' + RandomEncounters.Off}>Off</SelectItem>
            <SelectItem value={'' + RandomEncounters.Normal}>Normal</SelectItem>
            <SelectItem value={'' + RandomEncounters.Max}>Max</SelectItem>
          </SelectContent>
        </Select>
      </Row>

      <AlertComponent />
    </>
  )
}