import { EditPopover } from "@/components/EditPopover";
import Row from "@/components/Row";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameModule } from "@/types";
import { FF7 } from "@/useFF7";
import { formatTime } from "@/util";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import AutocompleteInput from "@/components/Autocomplete";
import { Modal } from "@/components/Modal";
import { gameMoments } from "@/ff7GameMoments";

export function General(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const state = ff7.gameState;

  const [editValue, setEditValue] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [gameMomentId, setGameMomentId] = useState<string>("");
  const [isGameMomentModalOpen, setIsGameMomentModalOpen] = useState(false);

  const gameModuleAsString = GameModule[state.currentModule];

  const openEditPopover = (title: string, value: string) => {
    setEditTitle(title);
    setEditValue(value);
    setPopoverOpen(true);
  }

  const submitValue = () => {
    if (editTitle === "Game Moment") {
      ff7.setGameMoment(parseInt(editValue));
    } else if (editTitle === "Party GP") {
      ff7.setGP(parseInt(editValue));
    } else if (editTitle === "Current Disc") {
      ff7.setDisc(parseInt(editValue));
    } else if (editTitle === "Party Gil") {
      ff7.setGil(parseInt(editValue));
    } else if (editTitle === "Battles Fought") {
      ff7.setBattleCount(parseInt(editValue));
    } else if (editTitle === "Battles Escaped") {
      ff7.setBattleEscapeCount(parseInt(editValue));
    } else if (editTitle === "In Game Time") {
      ff7.setInGameTime(parseInt(editValue));
    }
    setPopoverOpen(false);
  }

  const openGameMomentModal = () => {
    setGameMomentId(state.gameMoment.toString());
    setIsGameMomentModalOpen(true);
  };

  const closeGameMomentModal = () => {
    setIsGameMomentModalOpen(false);
  };

  const onSubmitGameMoment = (momentId: string | null) => {
    if (momentId === null) {
      return;
    }
    ff7.setGameMoment(parseInt(momentId));
    closeGameMomentModal();
  };

  const onGameMomentModalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeGameMomentModal();
    } else if (e.key === "Enter") {
      onSubmitGameMoment(gameMomentId);
    }
  };

  const gameMomentList = gameMoments.map((moment) => {
    const [id, name] = moment.split(" - ");
    return {
      id: parseInt(id),
      name: moment,
    };
  });

  const PHS = ['Cloud', 'Barret', 'Tifa', 'Aeris', 'Red XIII', 'Yuffie', 'Cait Sith', 'Vincent', 'Cid']
  const Menu = ['Item', 'Magic', 'Materia', 'Equip', 'Status', 'Order', 'Limit', 'Config', 'PHS', 'Save']

  return (
    <div>
      <div className="flex gap-1">
        <div className="flex-1">
          <Row label="Module">{gameModuleAsString}</Row>
          <Row
            label="Party Gil"
            onRowClick={() => openEditPopover("Party Gil", state.gil.toString())}
          >
            <EditPopover
              open={popoverOpen && editTitle === "Party Gil"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer" onClick={() => openEditPopover("Party Gil", state.gil.toString())}>
                      {state.gil}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>
          </Row>
          <Row
            label="Current Disc"
            onRowClick={() => openEditPopover("Current Disc", state.discId.toString())}
          >
            <EditPopover
              open={popoverOpen && editTitle === "Current Disc"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer" onClick={() => openEditPopover("Current Disc", state.discId.toString())}>
                      {state.discId}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>
          </Row>
          <Row
            label="In Game Time"
            onRowClick={() => openEditPopover("In Game Time", formatTime(state.inGameTime))}
          >
            <EditPopover
              open={popoverOpen && editTitle === "In Game Time"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer" onClick={() => openEditPopover("In Game Time", formatTime(state.inGameTime))}>
                      {formatTime(state.inGameTime)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>
          </Row>
          <Row label="PHS">
            <Popover>
              <PopoverTrigger className="flex items-center">
                Change
                <ChevronDown className="h-3 w-3 ml-0.5 mt-0.5 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="text-xs flex flex-col gap-1">
                {PHS.map((ally, index) => (
                  <label className="flex bg-zinc-800 p-1 px-2 rounded-sm flex-col gap-2" key={index}>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">{ally}</div>
                      <label className="flex gap-1 items-center">
                      show
                      <Checkbox checked={ff7.partyMemberVisible(index)} onClick={(e) => ff7.togglePartyMemberVisibility(index)} />
                      </label>
                      <label className="flex gap-1 items-center">
                      lock
                      <Checkbox checked={ff7.partyMemberLocked(index)} onClick={(e) => ff7.togglePartyMemberLocking(index)} />
                      </label>
                    </div>
                  </label>
                ))}
                <div className="flex justify-center">
                  <a className="cursor-pointer hover:underline" onClick={() => {ff7.togglePartyMemberVisibility(-1); ff7.togglePartyMemberLocking(-1)}}>Toggle all</a>
                </div>                
              </PopoverContent>
            </Popover>
          </Row>
        </div>
        <div className="flex-1">
          <Row 
            label="Game Moment"
            onRowClick={openGameMomentModal}
          >
            {state.gameMoment}
          </Row>
          <Modal 
            open={isGameMomentModalOpen} 
            setIsOpen={setIsGameMomentModalOpen}
            title="Set Game Moment"
            buttonText="Set"
            callback={() => onSubmitGameMoment(gameMomentId)}
          >
            <div className="relative">
              <AutocompleteInput
                battles={gameMomentList}
                isVisible={true}
                onSelect={(id) => setGameMomentId(id?.toString() ?? "")}
                onAccept={onGameMomentModalKeyDown}
                placeholder="Enter game moment name or ID"
                id="game-moment-id"
                value={gameMomentList.find(moment => moment.id === state.gameMoment)}
              />
            </div>
          </Modal>
          <Row
            label="Party GP"
            onRowClick={() => openEditPopover("Party GP", state.gp.toString())}
          >
            <EditPopover
              open={popoverOpen && editTitle === "Party GP"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer" onClick={() => openEditPopover("Party GP", state.gp.toString())}>
                      {state.gp}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>
          </Row>
          <Row
            label="Battles Fought"
            onRowClick={() => openEditPopover("Battles Fought", state.battleCount.toString())}
          >
            <EditPopover
              open={popoverOpen && editTitle === "Battles Fought"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer" onClick={() => openEditPopover("Battles Fought", state.battleCount.toString())}>
                      {state.battleCount}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>
          </Row>
          <Row
            label="Battles Escaped"
            onRowClick={() => openEditPopover("Battles Escaped", state.battleEscapeCount.toString())}
          >
            <EditPopover
              open={popoverOpen && editTitle === "Battles Escaped"}
              onOpenChange={setPopoverOpen}
              value={editValue}
              onValueChange={setEditValue}
              onSubmit={submitValue}
            >
              <TooltipProvider>
                <Tooltip delayDuration={250}>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer" onClick={() => openEditPopover("Battles Escaped", state.battleEscapeCount.toString())}>
                      {state.battleEscapeCount}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to edit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </EditPopover>
          </Row>
          <Row label="Menu access">
            <Popover>
              <PopoverTrigger className="flex items-center">
                Change
                <ChevronDown className="h-3 w-3 ml-0.5 mt-0.5 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="text-xs flex flex-col gap-1">
                {Menu.map((menu, index) => (
                  <div className="flex bg-zinc-800 p-1 px-2 rounded-sm flex-col gap-2" key={index}>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">{menu}</div>
                      <label className="flex gap-1 items-center">
                        show
                        <Checkbox checked={ff7.menuVisibilityEnabled(index)} onClick={(e) => ff7.toggleMenuVisibility(index)} />
                      </label>
                      <label className="flex gap-1 items-center">
                        lock
                        <Checkbox checked={ff7.menuLockEnabled(index)} onClick={(e) => ff7.toggleMenuLock(index)} />
                      </label>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center">
                  <a className="cursor-pointer hover:underline" onClick={() => {ff7.toggleMenuVisibility(-1); ff7.toggleMenuLock(-1)}}>Toggle all</a>
                </div>
              </PopoverContent>
            </Popover>
          </Row>
          <Row label="Enable all menus">
            <Switch checked={state.menuAlwaysEnabled} onClick={() => state.menuAlwaysEnabled ? ff7.disableMenuAlwaysEnabled() : ff7.enableMenuAlwaysEnabled()} />
          </Row>
        </div>
      </div>
    </div>
  );
}