import { cn } from "@/lib/utils";
import { GameModule } from "@/types";
import { FF7 } from "@/useFF7";
import { formatTime } from "@/util";

export function StatusBar(props: { ff7: FF7 }) {
  const ff7 = props.ff7;
  const connected = ff7.connected;

  return (
    <div className="h-6 bg-zinc-800 items-center flex px-2 text-xs gap-2 flex-shrink">
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
          Game Moment: {ff7.gameState.gameMoment}
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
    </div>
  );
}