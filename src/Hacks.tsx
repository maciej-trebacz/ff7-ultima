import Row from "./components/Row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Switch } from "./components/ui/switch";
import { useAlert } from "./hooks/useAlert";
import { GameModule, RandomEncounters, Tabs } from "./types";
import { FF7 } from "./useFF7";

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

  const setSpeed = async (speed: string) => {
    const check = await ff7.setSpeed(parseFloat(speed));
    if (!check) {
      showAlert("Not supported", "This version of FFNx is not supported for setting speed. Use the built-in speedhack instead.");
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
  }

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
        <Switch checked={ff7.introDisabled} onClick={() => ff7.introDisabled ? ff7.enableSkipIntro() : ff7.disableSkipIntro()} />
      </Row>

      <Row label="Unfocus patch">
        <Switch checked={ff7.gameState.unfocusPatchEnabled} onClick={() => ff7.gameState.unfocusPatchEnabled ? ff7.unpatchWindowUnfocus() : ff7.patchWindowUnfocus()} />
      </Row>
      
      <Row label="Swirl skip">
        <Switch checked={ff7.gameState.battleSwirlDisabled} onClick={() => ff7.gameState.battleSwirlDisabled ? ff7.enableBattleSwirl() : ff7.disableBattleSwirl()} />
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