import { useEffect, useMemo, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls as DreiMapControls, Stats, OrthographicCamera } from '@react-three/drei';
import { Triangle } from '@/ff7/mapfile';
import { MapControls as MapControlsImpl } from 'three-stdlib';
import { OrthographicCamera as ThreeOrthographicCamera, MOUSE } from 'three';
import { RenderingMode } from './types';
import { CAMERA_HEIGHT, MESH_SIZE, SCALE, SHOW_DEBUG } from './constants';
import { CameraDebugInfo, CameraDebugOverlay } from './components/DebugOverlay';
import { MapControls } from './components/MapControls';
import { WorldMesh } from './components/WorldMesh';
import { useMapState } from '@/hooks/useMapState';
import ModelOverlay from './ModelOverlay';

interface MapViewerProps { 
  renderingMode?: RenderingMode,
  onTriangleSelect?: (triangle: Triangle | null) => void,
  isLoading?: boolean,
  wireframe?: boolean,
  onWireframeToggle?: (isWireframe: boolean) => void,
}

function MapViewer({ 
  onTriangleSelect, 
  isLoading,
  onWireframeToggle
}: MapViewerProps) {
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [rotation, setRotation] = useState(0);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showModels, setShowModels] = useState(true);
  const [renderingMode, setRenderingMode] = useState<RenderingMode>("textured");
  const [loaded, setLoaded] = useState(false);
  const [followPlayer, setFollowPlayer] = useState(false);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<MapControlsImpl>(null);
  const cameraRef = useRef<ThreeOrthographicCamera>(null);
  const worldMeshRef = useRef<any>(null);
  const zoomRef = useRef(1);
  const { worldmap, mapType } = useMapState();

  useEffect(() => {
    if (!onTriangleSelect) {
      setSelectedFaceIndex(null);
    }
  }, [onTriangleSelect]);

  const handleTriangleSelect = (triangle: Triangle | null, faceIndex: number | null) => {
    if (onTriangleSelect) {
      setSelectedFaceIndex(faceIndex);
      onTriangleSelect(triangle);
    }
  };

  const handleRotate = (direction: 'left' | 'right') => {
    const rotationAngle = (Math.PI / 8) * (direction === 'left' ? 1 : -1);
    setRotation(prev => prev + rotationAngle);
  };

  const handleWireframeToggle = () => {
    setWireframe(prev => !prev);
    if (onWireframeToggle) {
      onWireframeToggle(!wireframe);
    }
  };

  const handleGridToggle = () => {
    setShowGrid(prev => !prev);
  };

  const handleModelsToggle = () => {
    setShowModels(prev => !prev);
  };

  // Calculate map dimensions and center
  const mapDimensions = useMemo(() => {
    if (!worldmap || !worldmap.length) return { width: 0, height: 0, center: { x: 0, y: 0, z: 0 } };
    
    const sizeZ = worldmap.length * MESH_SIZE * SCALE;
    const sizeX = worldmap[0].length * MESH_SIZE * SCALE;
    
    return {
      width: sizeX,
      height: sizeZ,
      center: {
        x: sizeX / 2,
        y: 0,
        z: sizeZ / 2
      }
    };
  }, [worldmap]);

  // Camera configuration
  const cameraConfig = useMemo(() => {
    const margin = 50;
    const position = [
      mapDimensions.center.x,
      CAMERA_HEIGHT[mapType],
      mapDimensions.center.z
    ] as [number, number, number];

    const halfWidth = mapDimensions.width / 2 + margin;
    const halfHeight = mapDimensions.height / 2 + margin;
    const config = {
      position,
      left: -halfWidth,
      right: halfWidth,
      top: halfHeight,
      bottom: -halfHeight,
      near: -1000,
      far: 100000,
      up: [0, 1, 0] as [number, number, number],
      zoom: 1
    };
    return config;
  }, [mapDimensions, mapType]);

  // Add new function to handle resize
  const handleResize = () => {
    const camera = cameraRef.current;
    if (!camera || !mapDimensions.width) return;

    const margin = 50;
    const containerAspect = window.innerWidth / window.innerHeight;
    const mapAspect = mapDimensions.width / mapDimensions.height;
    
    let halfHeight = mapDimensions.height / 2 + margin;
    let halfWidth = mapDimensions.width / 2 + margin;

    // If container is wider than the map's aspect ratio, fit to height
    if (containerAspect > mapAspect) {
      halfWidth = halfHeight * containerAspect;
    } else {
      // If container is taller than the map's aspect ratio, fit to width
      halfHeight = halfWidth / containerAspect;
    }

    const currentZoom = camera.zoom;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.zoom = currentZoom; // Preserve zoom level
    camera.updateProjectionMatrix();
  };

  // Add resize event listener
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapDimensions]);

  const resetCameraAndControls = () => {
    const camera = cameraRef.current;
    if (!camera || !mapDimensions.width) {
      return;
    }

    // Reset rotation
    setRotation(0);
    
    // Reset camera position and orientation
    camera.position.set(mapDimensions.center.x, CAMERA_HEIGHT[mapType], mapDimensions.center.z);
    camera.lookAt(mapDimensions.center.x, 0, mapDimensions.center.z);

    const margin = 50;
    const containerAspect = window.innerWidth / window.innerHeight;
    const mapAspect = mapDimensions.width / mapDimensions.height;
    
    let halfHeight = mapDimensions.height / 2 + margin;
    let halfWidth = mapDimensions.width / 2 + margin;

    // If container is wider than the map's aspect ratio, fit to height
    if (containerAspect > mapAspect) {
      halfWidth = halfHeight * containerAspect;
    } else {
      // If container is taller than the map's aspect ratio, fit to width
      halfHeight = halfWidth / containerAspect;
    }

    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    // Reset controls target only
    if (controlsRef.current) {
      controlsRef.current.object = camera;
      controlsRef.current.target.set(mapDimensions.center.x, 0, mapDimensions.center.z);
      controlsRef.current.update();
    }
  };

  // Reset zoom state when view is reset
  const resetView = () => {
    resetCameraAndControls();
  };

  // Add camera position clamping to restrict panning inside map bounds
  const clampCameraPosition = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || !mapDimensions.width || !mapDimensions.height) return;
    const padding = 50; // padding in world units
    const viewHalfWidth = (camera.right - camera.left) / (2 * camera.zoom);
    const viewHalfHeight = (camera.top - camera.bottom) / (2 * camera.zoom);
    const minX = -padding + viewHalfWidth;
    const maxX = mapDimensions.width + padding - viewHalfWidth;
    const minZ = -padding + viewHalfHeight;
    const maxZ = mapDimensions.height + padding - viewHalfHeight;
    
    let clampedX;
    if (minX > maxX) {
      clampedX = mapDimensions.center.x;
    } else {
      clampedX = Math.min(Math.max(controls.target.x, minX), maxX);
    }
    
    let clampedZ;
    if (minZ > maxZ) {
      clampedZ = mapDimensions.center.z;
    } else {
      clampedZ = Math.min(Math.max(controls.target.z, minZ), maxZ);
    }
    
    const deltaX = clampedX - controls.target.x;
    const deltaZ = clampedZ - controls.target.z;
    if (deltaX !== 0 || deltaZ !== 0) {
      controls.target.set(clampedX, controls.target.y, clampedZ);
      camera.position.x += deltaX;
      camera.position.z += deltaZ;
      controls.update();
    }
  };

  // Update zoom state when camera changes
  const handleCameraChange = () => {
    if (controlsRef.current?.object) {
      const camera = controlsRef.current.object;
      if (camera.zoom < 1) {
        camera.zoom = 1;
        camera.updateProjectionMatrix();
      }
      zoomRef.current = camera.zoom;
      clampCameraPosition();
    }
  };

  // Add effect to log camera setup
  useEffect(() => {
    if (!mapDimensions.width) return;
    resetCameraAndControls();
    setLoaded(true);
    setTimeout(() => {
      handleResize();
    }, 50);
  }, [mapDimensions]);

  // Handle player position updates from MapControls
  const handlePlayerPositionUpdate = (x: number, z: number) => {
    if (!controlsRef.current || !cameraRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const scale = 20;

    // Calculate the position in Three.js scene coordinates
    const sceneX = x / scale;
    const sceneZ = z / scale;

    // Update camera and controls target to follow player
    camera.position.set(sceneX, CAMERA_HEIGHT[mapType], sceneZ);
    controls.target.set(sceneX, 0, sceneZ);
    controls.update();

    // Find and highlight the triangle at player position if following
    if (followPlayer && worldMeshRef.current) {
      const mesh = worldMeshRef.current;
      
      // Access the findTriangleAtCoordinates method we added to the mesh
      if (mesh.userData && mesh.userData.findTriangleAtCoordinates) {
        // Log the coordinates for debugging
        console.log(`Finding triangle at coordinates (${sceneX}, ${sceneZ}) with rotation ${rotation}`);
        
        // Pass the scene coordinates to findTriangleAtCoordinates
        const result = mesh.userData.findTriangleAtCoordinates(sceneX, sceneZ, rotation);
        if (result) {
          setSelectedFaceIndex(result.faceIndex);
          if (onTriangleSelect) {
            onTriangleSelect(result.triangle);
          }
        } else {
          console.log("No triangle found at player position");
        }
      }
    } else if (followPlayer && !worldMeshRef.current) {
      // If mesh ref is not available yet, set a timeout to try again
      setTimeout(() => handlePlayerPositionUpdate(x, z), 100);
    }
  };

  // Add a handler to get a reference to the WorldMesh
  const handleWorldMeshRef = (mesh: any) => {
    worldMeshRef.current = mesh;
    
    // If we're already following when the ref becomes available, try to highlight
    if (followPlayer && worldMeshRef.current && worldMeshRef.current.userData.findTriangleAtCoordinates) {
      // Force a position update to highlight the triangle
      document.dispatchEvent(new CustomEvent('requestPlayerPosition'));
    }
  };

  // When follow player is toggled off, clear the selection
  useEffect(() => {
    if (!followPlayer) {
      setSelectedFaceIndex(null);
      if (onTriangleSelect) {
        onTriangleSelect(null);
      }
    }
  }, [followPlayer, onTriangleSelect]);

  return (
    <div className="relative flex flex-col w-full h-full">
      <MapControls 
        onRotate={handleRotate} 
        onReset={resetView} 
        wireframe={wireframe}
        onWireframeToggle={handleWireframeToggle}
        showGrid={showGrid}
        onGridToggle={handleGridToggle}
        showModels={showModels}
        onModelsToggle={handleModelsToggle}
        renderingMode={renderingMode}
        onRenderingModeChange={setRenderingMode}
        followPlayer={followPlayer}
        onFollowPlayerToggle={() => setFollowPlayer(prev => !prev)}
        onPlayerPositionUpdate={handlePlayerPositionUpdate}
      />

      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-lg text-muted-foreground">Loading map...</div>
          </div>
        )}

        <Canvas style={{ width: '100%', height: '100%', opacity: !isLoading && loaded ? 1 : 0 }}>
          <OrthographicCamera makeDefault {...cameraConfig} ref={cameraRef} />
          {SHOW_DEBUG && <CameraDebugInfo onDebugInfo={(info) => {
            console.log(info);
          }} />}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[20000, 40000, 20000]}
            intensity={1.0}
            castShadow
          />
          <DreiMapControls 
            ref={controlsRef}
            target={[mapDimensions.center.x, 0, mapDimensions.center.z]}
            enableDamping={false}
            makeDefault
            enableRotate={false}
            mouseButtons={{
              LEFT: MOUSE.PAN,
              MIDDLE: MOUSE.DOLLY,
              RIGHT: MOUSE.DOLLY
            }}
            onChange={handleCameraChange}
          />
          {worldmap && (
            <WorldMesh 
              renderingMode={renderingMode} 
              onTriangleSelect={handleTriangleSelect}
              selectedFaceIndex={selectedFaceIndex}
              debugCanvasRef={debugCanvasRef}
              mapCenter={mapDimensions.center}
              rotation={rotation}
              showGrid={showGrid}
              wireframe={wireframe}
              ref={handleWorldMeshRef}
            />
          )}
          <ModelOverlay zoomRef={zoomRef} visible={showModels} />
        </Canvas>
      </div>
    </div>
  );
}

export default MapViewer; 
