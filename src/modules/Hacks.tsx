import GroupButton from "@/components/GroupButton";
import Row from "@/components/Row";
import { useAlert } from "@/hooks/useAlert";
import { FF7 } from "@/useFF7";

export function Hacks(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const { showAlert, AlertComponent } = useAlert();

  const setSpeed = async (speed: number) => {
    const check = await ff7.setSpeed(speed);
    if (!check) {
      showAlert("Not supported", "This version of FFNx is not supported for setting speed. Use the built-in speedhack instead.");
    }
  };

  return (
    <div>
      <Row label="Speed">
        <div className="join">
          <GroupButton
            active={ff7.gameState.speed === "0.25"}
            onClick={() => setSpeed(0.25)}
          >
            0.25x
          </GroupButton>
          <GroupButton
            active={ff7.gameState.speed === "0.5"}
            onClick={() => setSpeed(0.5)}
          >
            0.5x
          </GroupButton>
          <GroupButton
            active={ff7.gameState.speed === "1"}
            onClick={() => setSpeed(1)}
          >
            1x
          </GroupButton>
          <GroupButton
            active={ff7.gameState.speed === "2"}
            onClick={() => setSpeed(2)}
          >
            2x
          </GroupButton>
          <GroupButton
            active={ff7.gameState.speed === "4"}
            onClick={() => setSpeed(4)}
          >
            4x
          </GroupButton>
        </div>
      </Row>
      <Row label="Battles">
        <div className="join">
          <GroupButton
            active={ff7.gameState.battlesDisabled}
            onClick={() => ff7.disableBattles()}
          >
            None
          </GroupButton>
          <GroupButton
            active={
              !ff7.gameState.battlesDisabled &&
              !ff7.gameState.maxBattlesEnabled
            }
            onClick={() => ff7.enableBattles()}
          >
            Normal
          </GroupButton>
          <GroupButton
            active={ff7.gameState.maxBattlesEnabled}
            onClick={() => ff7.maxBattles()}
          >
            Max
          </GroupButton>
        </div>
      </Row>
      <Row label="Swirl Skip">
        <div className="join">
          <GroupButton
            active={!ff7.gameState.battleSwirlDisabled}
            onClick={() => ff7.enableBattleSwirl()}
          >
            Disable
          </GroupButton>
          <GroupButton
            active={ff7.gameState.battleSwirlDisabled}
            onClick={() => ff7.disableBattleSwirl()}
          >
            Enable
          </GroupButton>
        </div>
      </Row>
      <Row label="Instant ATB">
        <div className="join">
          <GroupButton
            active={!ff7.gameState.instantATBEnabled}
            onClick={() => ff7.disableInstantATB()}
          >
            Disable
          </GroupButton>
          <GroupButton
            active={ff7.gameState.instantATBEnabled}
            onClick={() => ff7.enableInstantATB()}
          >
            Enable
          </GroupButton>
        </div>
      </Row>
      <Row label="Invincibility">
        <div className="join">
          <GroupButton
            active={!ff7.gameState.invincibilityEnabled}
            onClick={() => ff7.disableInvincibility()}
          >
            Disable
          </GroupButton>
          <GroupButton
            active={ff7.gameState.invincibilityEnabled}
            onClick={() => ff7.enableInvincibility()}
          >
            Enable
          </GroupButton>
        </div>
      </Row>
      <Row label="Skip Intro">
        <div className="join">
          <GroupButton
            active={!ff7.introDisabled}
            onClick={() => ff7.disableSkipIntro()}
          >
            Disable
          </GroupButton>
          <GroupButton
            active={ff7.introDisabled}
            onClick={() => ff7.enableSkipIntro()}
          >
            Enable
          </GroupButton>
        </div>
      </Row>
      <Row label="Unfocus patch">
        <div className="join">
          <div
            className="tooltip tooltip-left"
            data-tip={
              ff7.gameState.isFFnx
                ? "FFNx has this patch applied by default"
                : ""
            }
          >
            <GroupButton
              active={!ff7.gameState.unfocusPatchEnabled}
              disabled={ff7.gameState.isFFnx}
              onClick={() => ff7.unpatchWindowUnfocus()}
            >
              Disable
            </GroupButton>
            <GroupButton
              active={ff7.gameState.unfocusPatchEnabled}
              disabled={ff7.gameState.isFFnx}
              onClick={() => ff7.patchWindowUnfocus()}
            >
              Enable
            </GroupButton>
          </div>
        </div>
      </Row>
      <Row label="Movement enabled">
        <div className="join">
          <GroupButton
            active={!!ff7.gameState.fieldMovementDisabled}
            onClick={() => ff7.toggleMovement()}
          >
            Disable
          </GroupButton>
          <GroupButton
            active={!ff7.gameState.fieldMovementDisabled}
            onClick={() => ff7.toggleMovement()}
          >
            Enable
          </GroupButton>
        </div>
      </Row>
      <Row label="PHS" onLabelClick={() => ff7.togglePHS(-1)}>
        <div className="join">
          <GroupButton
            active={ff7.partyMemberEnabled(0)}
            onClick={() => ff7.togglePHS(0)}
          >
            Cloud
          </GroupButton>
          <GroupButton
            active={ff7.partyMemberEnabled(1)}
            onClick={() => ff7.togglePHS(1)}
          >
            Barret
          </GroupButton>
          <GroupButton
            active={ff7.partyMemberEnabled(2)}
            onClick={() => ff7.togglePHS(2)}
          >
            Tifa
          </GroupButton>
          <GroupButton
            active={ff7.partyMemberEnabled(3)}
            onClick={() => ff7.togglePHS(3)}
          >
            Aeris
          </GroupButton>
          <GroupButton
            active={ff7.partyMemberEnabled(4)}
            onClick={() => ff7.togglePHS(4)}
          >
            Red
          </GroupButton>
        </div>
        <div className="join">
          <GroupButton
            active={ff7.partyMemberEnabled(5)}
            onClick={() => ff7.togglePHS(5)}
          >
            Yuffie
          </GroupButton>
          <GroupButton
            active={ff7.partyMemberEnabled(6)}
            onClick={() => ff7.togglePHS(6)}
          >
            Cait Sith
          </GroupButton>
          <GroupButton
            active={ff7.partyMemberEnabled(7)}
            onClick={() => ff7.togglePHS(7)}
          >
            Vincent
          </GroupButton>
          <GroupButton
            active={ff7.partyMemberEnabled(8)}
            onClick={() => ff7.togglePHS(8)}
          >
            Cid
          </GroupButton>
        </div>
      </Row>
      <Row
        label="Menu Visibility"
        onLabelClick={() => ff7.toggleMenuVisibility(-1)}
      >
        <div className="join">
          <GroupButton
            active={ff7.menuVisibilityEnabled(0)}
            onClick={() => ff7.toggleMenuVisibility(0)}
          >
            Item
          </GroupButton>
          <GroupButton
            active={ff7.menuVisibilityEnabled(1)}
            onClick={() => ff7.toggleMenuVisibility(1)}
          >
            Magic
          </GroupButton>
          <GroupButton
            active={ff7.menuVisibilityEnabled(2)}
            onClick={() => ff7.toggleMenuVisibility(2)}
          >
            Materia
          </GroupButton>
          <GroupButton
            active={ff7.menuVisibilityEnabled(3)}
            onClick={() => ff7.toggleMenuVisibility(3)}
          >
            Equip
          </GroupButton>
          <GroupButton
            active={ff7.menuVisibilityEnabled(4)}
            onClick={() => ff7.toggleMenuVisibility(4)}
          >
            Status
          </GroupButton>
        </div>
        <div className="join">
          <GroupButton
            active={ff7.menuVisibilityEnabled(5)}
            onClick={() => ff7.toggleMenuVisibility(5)}
          >
            Order
          </GroupButton>
          <GroupButton
            active={ff7.menuVisibilityEnabled(6)}
            onClick={() => ff7.toggleMenuVisibility(6)}
          >
            Limit
          </GroupButton>
          <GroupButton
            active={ff7.menuVisibilityEnabled(7)}
            onClick={() => ff7.toggleMenuVisibility(7)}
          >
            Config
          </GroupButton>
          <GroupButton
            active={ff7.menuVisibilityEnabled(8)}
            onClick={() => ff7.toggleMenuVisibility(8)}
          >
            PHS
          </GroupButton>
          <GroupButton
            active={ff7.menuVisibilityEnabled(9)}
            onClick={() => ff7.toggleMenuVisibility(9)}
          >
            Save
          </GroupButton>
        </div>
      </Row>
      <Row label="Menu Locks" onLabelClick={() => ff7.toggleMenuLock(-1)}>
        <div className="join">
          <GroupButton
            active={ff7.menuLockEnabled(0)}
            onClick={() => ff7.toggleMenuLock(0)}
          >
            Item
          </GroupButton>
          <GroupButton
            active={ff7.menuLockEnabled(1)}
            onClick={() => ff7.toggleMenuLock(1)}
          >
            Magic
          </GroupButton>
          <GroupButton
            active={ff7.menuLockEnabled(2)}
            onClick={() => ff7.toggleMenuLock(2)}
          >
            Materia
          </GroupButton>
          <GroupButton
            active={ff7.menuLockEnabled(3)}
            onClick={() => ff7.toggleMenuLock(3)}
          >
            Equip
          </GroupButton>
          <GroupButton
            active={ff7.menuLockEnabled(4)}
            onClick={() => ff7.toggleMenuLock(4)}
          >
            Status
          </GroupButton>
        </div>
        <div className="join">
          <GroupButton
            active={ff7.menuLockEnabled(5)}
            onClick={() => ff7.toggleMenuLock(5)}
          >
            Order
          </GroupButton>
          <GroupButton
            active={ff7.menuLockEnabled(6)}
            onClick={() => ff7.toggleMenuLock(6)}
          >
            Limit
          </GroupButton>
          <GroupButton
            active={ff7.menuLockEnabled(7)}
            onClick={() => ff7.toggleMenuLock(7)}
          >
            Config
          </GroupButton>
          <GroupButton
            active={ff7.menuLockEnabled(8)}
            onClick={() => ff7.toggleMenuLock(8)}
          >
            PHS
          </GroupButton>
          <GroupButton
            active={ff7.menuLockEnabled(9)}
            onClick={() => ff7.toggleMenuLock(9)}
          >
            Save
          </GroupButton>
        </div>
      </Row>
      <AlertComponent />
    </div>
  );
}