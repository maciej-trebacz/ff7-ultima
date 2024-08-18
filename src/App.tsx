import { useState } from "react";
import { useFF7 } from "./useFF7";

function App() {
  const [battleId, setBattleId] = useState("");

  const ff7 = useFF7();
  const state = ff7.gameState;

  return (
    <div className="container">
      Connected: {ff7.connected ? "Yes" : "No"}
      <br />
      <br />
      Game Moment: {state.gameMoment}
      <br />
      Field FPS: {state.fieldFps}
      <br />
      Battle FPS: {state.battleFps}
      <br />
      World FPS: {state.worldFps}
      <br />
      Current Module: {state.currentModule}
      <br />
      Field ID: {state.fieldId}
      <br />
      In Game Time: {state.inGameTime}
      <br />
      DISC ID: {state.discId}
      <br />
      Menu Visibility: {state.menuVisibility}
      <br />
      Menu Locks: {state.menuLocks}{" "}
      <button className="btn btn-primary" onClick={() => ff7.enableAllMenus()}>
        Enable All
      </button>
      <br />
      Field Movement Disabled: {state.fieldMovementDisabled}{" "}
      <button className="btn btn-primary" onClick={() => ff7.toggleMovement()}>
        Toggle
      </button>
      <br />
      Field Menu Access Enabled: {state.fieldMenuAccessEnabled}{" "}
      <button className="btn btn-primary" onClick={() => ff7.toggleMenuAccess()}>
        Toggle
      </button>
      <br />
      Party Bitmask: {state.partyBitmask}{" "}
      <button
        className="btn btn-primary"
        onClick={() => ff7.enableAllPartyMembers()}
      >
        Enable All
      </button>
      <br />
      GIL: {state.gil}
      <br />
      Battle Count: {state.battleCount}
      <br />
      Battle Escape Count: {state.battleEscapeCount}
      <br />
      <br />
      Speed: 
      <button className="btn btn-primary" onClick={() => ff7.setSpeed(0.25)}>
        0.25x
      </button>
      <button className="btn btn-primary" onClick={() => ff7.setSpeed(0.5)}>
        0.5x
      </button>
      <button className="btn btn-primary" onClick={() => ff7.setSpeed(1)}>
        1x
      </button>
      <button className="btn btn-primary" onClick={() => ff7.setSpeed(2)}>
        2x
      </button>
      <button className="btn btn-primary" onClick={() => ff7.setSpeed(4)}>
        4x
      </button>
      <br />
      <button className="btn btn-primary" onClick={() => ff7.endBattle()}>
        End Battle
      </button>
      <button className="btn btn-primary" onClick={() => ff7.disableBattles()}>
        Disable Battles
      </button>
      <button className="btn btn-primary" onClick={() => ff7.enableBattles()}>
        Enable Battles
      </button>
      <button className="btn btn-primary" onClick={() => ff7.maxBattles()}>
        Max Battles
      </button>
      Status: {state.battlesDisabled ? "Battles Disabled" : state.maxBattlesEnabled ? "Max Battles Enabled" : "Battles Enabled"}
      <br />
      <button className="btn btn-primary" onClick={() => ff7.disableBattleSwirl()}>
        Disable Battle Swirl
      </button>
      <button className="btn btn-primary" onClick={() => ff7.enableBattleSwirl()}>
        Enable Battle Swirl
      </button>
      Status: {state.battleSwirlDisabled ? "Disabled" : "Enabled"}
      <br />
      <button className="btn btn-primary" onClick={() => ff7.enableInstantATB()}>
        Enable Instant ATB
      </button>
      <button className="btn btn-primary" onClick={() => ff7.disableInstantATB()}>
        Disable Instant ATB
      </button>
      Status: {state.instantATBEnabled ? "Enabled" : "Disabled"}
      <br />
      Battle ID: <input type="number" value={battleId} onChange={(e) => setBattleId(e.target.value)} />
      <button className="btn btn-primary" onClick={() => ff7.startBattle(parseInt(battleId))}>
        Start Battle
      </button>
      <br />
      <button className="btn btn-primary" onClick={() => ff7.patchWindowUnfocus()}>
        Patch Window Unfocus
      </button>
      <button className="btn btn-primary" onClick={() => ff7.unpatchWindowUnfocus()}>
        Unpatch Window Unfocus
      </button>
      <br />
      <button className="btn btn-primary" onClick={() => ff7.skipFMV()}>
        Skip FMV
      </button>
      <br />
      <button className="btn btn-primary" onClick={() => ff7.enableSkipIntro()}>
        Enable Skip Intro
      </button>
      <button className="btn btn-primary" onClick={() => ff7.disableSkipIntro()}>
        Disable Skip Intro
      </button>
      Intro Disabled: {ff7.introDisabled ? "Yes" : "No"}
      <br /><br />
      <div className="container">
        <div className="row">
          <div className="col-sm">
            <div className="card">
              <div className="card-body">
                <p className="card-text">
                  {state.fieldModels.map((model, i) => (
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
                  {state.battlePartyChars.map((char, i) => (
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
