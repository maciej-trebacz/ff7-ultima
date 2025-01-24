import Row from "./components/Row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Switch } from "./components/ui/switch";
import { useAlert } from "./hooks/useAlert";
import { GameModule, RandomEncounters, Tabs } from "./types";
import { FF7 } from "./useFF7";
import { useEffect } from "react";
import { HackSettings, loadHackSettings, saveHackSettings } from "./settings";

const ExpMultiplier = ({ ff7 }: { ff7: FF7 }) => {
  return (
    <Row label="EXP Multiplier">
      <Select value={'' + ff7.gameState.expMultiplier}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0" onClick={() => ff7.setExpMultiplier(0)}>0</SelectItem>
          <SelectItem value="1" onClick={() => ff7.setExpMultiplier(1)}>1</SelectItem>
          <SelectItem value="2" onClick={() => ff7.setExpMultiplier(2)}>2</SelectItem>
          <SelectItem value="3" onClick={() => ff7.setExpMultiplier(3)}>3</SelectItem>
          <SelectItem value="4" onClick={() => ff7.setExpMultiplier(4)}>4</SelectItem>
        </SelectContent>
      </Select>
    </Row>
  );
};

const APMultiplier = ({ ff7 }: { ff7: FF7 }) => {
  return (
    <Row label="AP Multiplier">
      <Select value={'' + ff7.gameState.apMultiplier}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0" onClick={() => ff7.setApMultiplier(0)}>0</SelectItem>
          <SelectItem value="1" onClick={() => ff7.setApMultiplier(1)}>1</SelectItem>
          <SelectItem value="2" onClick={() => ff7.setApMultiplier(2)}>2</SelectItem>
          <SelectItem value="3" onClick={() => ff7.setApMultiplier(3)}>3</SelectItem>
          <SelectItem value="4" onClick={() => ff7.setApMultiplier(4)}>4</SelectItem>
        </SelectContent>
      </Select>
    </Row>
  );
};

const Invincibility = ({ ff7 }: { ff7: FF7 }) => {
  return (
    <Row label="Invincibility">
      <Switch checked={ff7.gameState.invincibilityEnabled} onClick={() => ff7.gameState.invincibilityEnabled ? ff7.disableInvincibility() : ff7.enableInvincibility()} />
    </Row>
  );
};

const InstantATB = ({ ff7 }: { ff7: FF7 }) => {
  return (
    <Row label="Instant ATB">
      <Switch checked={ff7.gameState.instantATBEnabled} onClick={() => ff7.gameState.instantATBEnabled ? ff7.disableInstantATB() : ff7.enableInstantATB()} />
    </Row>
  );
};

export function Hacks(props: { ff7: FF7, tab: Tabs }) {
  const ff7 = props.ff7;
  const { showAlert, AlertComponent } = useAlert();

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await loadHackSettings();
      if (settings) {
        if (settings.speed) await setSpeed(settings.speed);
        if (settings.skipIntros !== undefined) settings.skipIntros ? ff7.enableSkipIntro() : ff7.disableSkipIntro();
        if (settings.unfocusPatch !== undefined) settings.unfocusPatch ? ff7.patchWindowUnfocus() : ff7.unpatchWindowUnfocus();
        if (settings.swirlSkip !== undefined) settings.swirlSkip ? ff7.disableBattleSwirl() : ff7.enableBattleSwirl();
        if (settings.randomBattles !== undefined) await setRandomBattles(settings.randomBattles);
      }
    };
    loadSettings();
  }, []);

  const setSpeed = async (speed: string) => {
    const check = await ff7.setSpeed(parseFloat(speed));
    if (!check) {
      showAlert("Not supported", "This version of FFNx is not supported for setting speed. Use the built-in speedhack instead.");
    } else {
      await saveHackSettings({ 
        ...(await loadHackSettings() || {}),
        speed
      });
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
    await saveHackSettings({ 
      ...(await loadHackSettings() || {}),
      randomBattles: randomEncounters
    });
  }

  const toggleSkipIntros = async () => {
    const newValue = !ff7.introDisabled;
    newValue ? ff7.enableSkipIntro() : ff7.disableSkipIntro();
    await saveHackSettings({ 
      ...(await loadHackSettings() || {}),
      skipIntros: newValue
    });
  };

  const toggleUnfocusPatch = async () => {
    if (ff7.gameState.isFFnx) return;
    const newValue = !ff7.gameState.unfocusPatchEnabled;
    newValue ? ff7.patchWindowUnfocus() : ff7.unpatchWindowUnfocus();
    await saveHackSettings({ 
      ...(await loadHackSettings() || {}),
      unfocusPatch: newValue
    });
  };

  const toggleSwirlSkip = async () => {
    const newValue = !ff7.gameState.battleSwirlDisabled;
    newValue ? ff7.disableBattleSwirl() : ff7.enableBattleSwirl();
    await saveHackSettings({ 
      ...(await loadHackSettings() || {}),
      swirlSkip: newValue
    });
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
            <SelectItem value="4">Fastest (4x)</SelectItem>
          </SelectContent>
        </Select>
      </Row>

      <Row label="Skip intros">
        <Switch checked={ff7.introDisabled} onClick={toggleSkipIntros} />
      </Row>

      <div className={ff7.gameState.isFFnx ? "opacity-50" : ""} title="FFNx already has this feature">
        <Row label="Unfocus patch">
          <Switch checked={ff7.gameState.unfocusPatchEnabled} onClick={toggleUnfocusPatch} />
        </Row>
      </div>
      
      <Row label="Swirl skip">
        <Switch checked={ff7.gameState.battleSwirlDisabled} onClick={toggleSwirlSkip} />
      </Row>

      <Row label="Random battles">
        <Select value={('' + ff7.gameState.randomEncounters) || "1"} onValueChange={v => setRandomBattles(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Off</SelectItem>
            <SelectItem value="1">Normal</SelectItem>
            <SelectItem value="2">Max</SelectItem>
          </SelectContent>
        </Select>
      </Row>

      <AlertComponent />
    </>
  )
}