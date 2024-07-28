import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { getCurrent } from "@tauri-apps/api/webview";
import "./App.css";
import { useFF7 } from "./useFF7";
import { getCurrent as getCurrentWindow } from "@tauri-apps/api/window";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [battleId, setBattleId] = useState("");

  const {
    connected,
    gameState,
    setSpeed,
    toggleMenuAccess,
    toggleMovement,
    enableAllMenus,
    enableAllPartyMembers,
    disableBattles,
    enableBattles,
    maxBattles,
    endBattle,
    patchWindowUnfocus,
    unpatchWindowUnfocus,
    skipFMV,
    startBattle,
    disableBattleSwirl,
    enableBattleSwirl,
    enableInstantATB,
    disableInstantATB,
  } = useFF7();

  async function greet() {
    try {
      const readTest = await invoke("read_ff7_data");
      console.log({ readTest });
    } catch (e) {
      console.log("Error: ", e);
    }
  }

  useEffect(() => {
    getCurrentWindow().show();
  }, []);

  return (
    <div className="container">
      Connected: {connected ? "Yes" : "No"}
      <br />
      <br />
      Game Moment: {gameState.gameMoment}
      <br />
      Field FPS: {gameState.fieldFps}
      <br />
      Battle FPS: {gameState.battleFps}
      <br />
      World FPS: {gameState.worldFps}
      <br />
      Current Module: {gameState.currentModule}
      <br />
      Field ID: {gameState.fieldId}
      <br />
      In Game Time: {gameState.inGameTime}
      <br />
      DISC ID: {gameState.discId}
      <br />
      Menu Visibility: {gameState.menuVisibility}
      <br />
      Menu Locks: {gameState.menuLocks}{" "}
      <button className="btn btn-primary" onClick={() => enableAllMenus()}>
        Enable All
      </button>
      <br />
      Field Movement Disabled: {gameState.fieldMovementDisabled}{" "}
      <button className="btn btn-primary" onClick={() => toggleMovement()}>
        Toggle
      </button>
      <br />
      Field Menu Access Enabled: {gameState.fieldMenuAccessEnabled}{" "}
      <button className="btn btn-primary" onClick={() => toggleMenuAccess()}>
        Toggle
      </button>
      <br />
      Party Bitmask: {gameState.partyBitmask}{" "}
      <button
        className="btn btn-primary"
        onClick={() => enableAllPartyMembers()}
      >
        Enable All
      </button>
      <br />
      GIL: {gameState.gil}
      <br />
      Battle Count: {gameState.battleCount}
      <br />
      Battle Escape Count: {gameState.battleEscapeCount}
      <br />
      <br />
      Speed: 
      <button className="btn btn-primary" onClick={() => setSpeed(0.25)}>
        0.25x
      </button>
      <button className="btn btn-primary" onClick={() => setSpeed(0.5)}>
        0.5x
      </button>
      <button className="btn btn-primary" onClick={() => setSpeed(1)}>
        1x
      </button>
      <button className="btn btn-primary" onClick={() => setSpeed(2)}>
        2x
      </button>
      <button className="btn btn-primary" onClick={() => setSpeed(4)}>
        4x
      </button>
      <br />
      <button className="btn btn-primary" onClick={() => endBattle()}>
        End Battle
      </button>
      <button className="btn btn-primary" onClick={() => disableBattles()}>
        Disable Battles
      </button>
      <button className="btn btn-primary" onClick={() => enableBattles()}>
        Enable Battles
      </button>
      <button className="btn btn-primary" onClick={() => maxBattles()}>
        Max Battles
      </button>
      Status: {gameState.battlesDisabled ? "Battles Disabled" : gameState.maxBattlesEnabled ? "Max Battles Enabled" : "Battles Enabled"}
      <br />
      <button className="btn btn-primary" onClick={() => disableBattleSwirl()}>
        Disable Battle Swirl
      </button>
      <button className="btn btn-primary" onClick={() => enableBattleSwirl()}>
        Enable Battle Swirl
      </button>
      Status: {gameState.battleSwirlDisabled ? "Disabled" : "Enabled"}
      <br />
      <button className="btn btn-primary" onClick={() => enableInstantATB()}>
        Enable Instant ATB
      </button>
      <button className="btn btn-primary" onClick={() => disableInstantATB()}>
        Disable Instant ATB
      </button>
      Status: {gameState.instantATBEnabled ? "Enabled" : "Disabled"}
      <br />
      Battle ID: <input type="number" value={battleId} onChange={(e) => setBattleId(e.target.value)} />
      <button className="btn btn-primary" onClick={() => startBattle(parseInt(battleId))}>
        Start Battle
      </button>
      <br />
      <button className="btn btn-primary" onClick={() => patchWindowUnfocus()}>
        Patch Window Unfocus
      </button>
      <button className="btn btn-primary" onClick={() => unpatchWindowUnfocus()}>
        Unpatch Window Unfocus
      </button>
      <br />
      <button className="btn btn-primary" onClick={() => skipFMV()}>
        Skip FMV
      </button>
      <br /><br />
      <div className="container">
        <div className="row">
          <div className="col-sm">
            <div className="card">
              <div className="card-body">
                <p className="card-text">
                  {gameState.fieldModels.map((model, i) => (
                    <div key={i}>
                      <h5 className="card-title">Field Model {i}</h5>
                      <div>X: {model.x}</div>
                      <div>Y: {model.y}</div>
                      <div>Z: {model.z}</div>
                      <div>Direction: {model.direction}</div>
                    </div>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <div className="container">
        <div className="row">
          <div className="col-sm">
            <div className="card">
              <div className="card-body">
                <p className="card-text">
                  {gameState.battlePartyChars.map((char, i) => (
                    <div key={i}>
                      <h5 className="card-title">Battle Char {i}</h5>
                      <div>HP: {char.hp} / {char.max_hp}</div>
                      <div>MP: {char.mp} / {char.max_mp}</div>
                      <div>ATB: {char.atb}</div>
                      <div>Limit: {char.limit}</div>
                    </div>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
    </div>
  );
}

export default App;
