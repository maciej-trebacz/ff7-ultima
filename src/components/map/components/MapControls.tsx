import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { RotateCcw, RotateCw, Home, Grid, Grip, Boxes, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RenderingMode } from '../types';
import { useFF7Context } from '@/FF7Context';
import { useEffect } from 'react';

interface MapControlsProps {
  onRotate: (direction: 'left' | 'right') => void;
  onReset: () => void;
  wireframe?: boolean;
  onWireframeToggle?: () => void;
  showGrid?: boolean;
  onGridToggle?: () => void;
  showModels?: boolean;
  onModelsToggle?: () => void;
  renderingMode: RenderingMode;
  onRenderingModeChange: (mode: RenderingMode) => void;
  followPlayer?: boolean;
  onFollowPlayerToggle?: () => void;
  onPlayerPositionUpdate?: (x: number, z: number) => void;
}

export function MapControls({ 
  onRotate, 
  onReset, 
  wireframe = false, 
  onWireframeToggle,
  showGrid = false,
  onGridToggle,
  showModels = false,
  onModelsToggle,
  renderingMode,
  onRenderingModeChange,
  followPlayer = false,
  onFollowPlayerToggle,
  onPlayerPositionUpdate
}: MapControlsProps) {
  const { gameState } = useFF7Context();
  const { x = 0, z = 0 } = gameState.worldCurrentModel || {};

  // Notify parent of player position changes when following
  useEffect(() => {
    if (followPlayer && onPlayerPositionUpdate) {
      onPlayerPositionUpdate(x, z);
    }
  }, [followPlayer, x, z, onPlayerPositionUpdate]);

  // Listen for requests to update player position
  useEffect(() => {
    const handleRequestPosition = () => {
      if (onPlayerPositionUpdate) {
        onPlayerPositionUpdate(x, z);
      }
    };

    document.addEventListener('requestPlayerPosition', handleRequestPosition);
    return () => {
      document.removeEventListener('requestPlayerPosition', handleRequestPosition);
    };
  }, [x, z, onPlayerPositionUpdate]);

  return (
    <div className="w-full bg-sidebar border-b border-slate-800/40 flex items-center justify-between gap-2 px-2 py-1">
      {/* Left side - Rendering options and toggles */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Mode:</span>
          <Select value={renderingMode} onValueChange={(value) => onRenderingModeChange(value as RenderingMode)}>
            <SelectTrigger className="w-[90px] px-2 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="textured">Textured</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="region">Region</SelectItem>
              <SelectItem value="scripts">Scripts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-3.5 w-[1px] bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Display:</span>
          {onWireframeToggle && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={wireframe ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${wireframe ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={onWireframeToggle}
                  >
                    <Grid className={`h-3.5 w-3.5 ${wireframe ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Toggle wireframe {wireframe ? '(on)' : '(off)'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onGridToggle && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${showGrid ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={onGridToggle}
                  >
                    <Grip className={`h-3.5 w-3.5 ${showGrid ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Toggle grid overlay {showGrid ? '(on)' : '(off)'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onModelsToggle && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showModels ? "default" : "outline"}
                    size="icon"
                    className={`h-6 w-6 ${showModels ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={onModelsToggle}
                  >
                    <Boxes className={`h-3.5 w-3.5 ${showModels ? 'text-primary-foreground' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>Toggle models {showModels ? '(on)' : '(off)'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="h-3.5 w-[1px] bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">Position:</span>
          <div className="flex items-center gap-2 text-[10px] tabular-nums">
            <span>X: <span className="text-foreground font-medium">{x.toFixed(0)}</span></span>
            <span>Z: <span className="text-foreground font-medium">{z.toFixed(0)}</span></span>
          </div>
        </div>
      </div>

      {/* Right side - Camera controls */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">Camera:</span>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={followPlayer ? "default" : "outline"}
                size="icon"
                className={`h-6 w-6 ${followPlayer ? 'bg-primary hover:bg-primary/90' : ''}`}
                onClick={onFollowPlayerToggle}
              >
                <User className={`h-3.5 w-3.5 ${followPlayer ? 'text-primary-foreground' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>Follow player {followPlayer ? '(on)' : '(off)'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={onReset}
              >
                <Home className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>Reset view</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => onRotate('left')}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>Rotate map left</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => onRotate('right')}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              <p>Rotate map right</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
} 