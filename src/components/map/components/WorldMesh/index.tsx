import { useEffect, useState, useCallback, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useTextureAtlas } from './hooks';
import { useGeometry } from './hooks';
import { useSelectedTriangleGeometry } from './hooks';
import { RenderingMode, TriangleWithVertices } from '../../types';
import { Triangle } from '@/ff7/mapfile';
import { useMapState } from '@/hooks/useMapState';
import { MESH_SIZE } from '../../constants';
import { GridOverlay } from '../GridOverlay';
import { SELECTION_Y_OFFSET } from '../../constants';

interface WorldMeshProps {
  renderingMode: RenderingMode;
  onTriangleSelect?: (triangle: Triangle | null, faceIndex: number | null) => void;
  selectedFaceIndex?: number | null;
  debugCanvasRef?: React.RefObject<HTMLCanvasElement>;
  mapCenter: { x: number, y: number, z: number };
  rotation: number;
  showGrid?: boolean;
  disablePainting?: boolean;
  wireframe?: boolean;
}

export const WorldMesh = forwardRef<THREE.Mesh, WorldMeshProps>(function WorldMesh({
  renderingMode,
  onTriangleSelect,
  selectedFaceIndex = null,
  debugCanvasRef,
  mapCenter,
  rotation,
  showGrid,
  disablePainting,
  wireframe,
}: WorldMeshProps, ref) {
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [paintingMouseDownPos, setPaintingMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [paintingDragActive, setPaintingDragActive] = useState(false);
  const [paintingDragStartMode, setPaintingDragStartMode] = useState<boolean | null>(null);
  const [paintingHasToggled, setPaintingHasToggled] = useState(false);
  const { textures, worldmap, mapType, addChangedMesh, mode, paintingSelectedTriangles, togglePaintingSelectedTriangle, setTriangleMap } = useMapState();
  
  if (!worldmap) return null;

  const { texture, canvas, texturePositions } = useTextureAtlas(textures, mapType);
  const { geometry, triangleMap, updateTriangleUVs, updateTrianglePosition, updateColors, updateTriangleTexture } = useGeometry(worldmap, mapType, renderingMode, textures, texturePositions);
  const selectedGeometry = useSelectedTriangleGeometry(
    triangleMap,
    selectedFaceIndex
  );

  const selectedTriangle = triangleMap && selectedFaceIndex !== null ? triangleMap[selectedFaceIndex] : null;

  // Update triangleMap in global state whenever it changes
  useEffect(() => {
    if (triangleMap) {
      setTriangleMap(triangleMap, updateColors, updateTriangleTexture);
    }
  }, [triangleMap, setTriangleMap]);

  // Set up global update functions when selected triangle changes
  useEffect(() => {
    if (window && selectedTriangle && updateTriangleUVs && updateTrianglePosition) {
      (window as any).updateTriangleUVs = function(u0: number, v0: number, u1: number, v1: number, u2: number, v2: number) {
        updateTriangleUVs(selectedTriangle, u0, v0, u1, v1, u2, v2);
        addChangedMesh(selectedTriangle.meshOffsetZ / MESH_SIZE, selectedTriangle.meshOffsetX / MESH_SIZE);
      };
      (window as any).updateArbitraryTriangleUVs = function(
        triangle: TriangleWithVertices,
        u0: number,
        v0: number,
        u1: number,
        v1: number,
        u2: number,
        v2: number
      ) {
        updateTriangleUVs(triangle, u0, v0, u1, v1, u2, v2);
        addChangedMesh(triangle.meshOffsetZ / MESH_SIZE, triangle.meshOffsetX / MESH_SIZE);
      };
      
      (window as any).updateTrianglePosition = function(
        v0: [number, number, number],
        v1: [number, number, number],
        v2: [number, number, number]
      ) {
        updateTrianglePosition(selectedTriangle, v0, v1, v2);
        addChangedMesh(selectedTriangle.meshOffsetZ / MESH_SIZE, selectedTriangle.meshOffsetX / MESH_SIZE);
      }
    }
    
    // Clean up functions when no triangle is selected or functions aren't available
    return () => {
      delete (window as any).updateTriangleUVs;
      delete (window as any).updateTrianglePosition;
    }
  }, [selectedTriangle, updateTriangleUVs, updateTrianglePosition]);

  const meshRef = useRef<THREE.Mesh>(null);
  
  // Expose method to find triangle at coordinates using raycasting
  const findTriangleAtCoordinates = useCallback((x: number, z: number, meshRotation: number = 0) => {
    if (!meshRef.current || !triangleMap) return null;
    
    // Apply inverse rotation to the coordinates since the mesh is rotated
    // but raycasting happens in local space
    const angle = -meshRotation; // Need to reverse the rotation to get local coordinates
    const rotatedX = Math.cos(angle) * x - Math.sin(angle) * z;
    const rotatedZ = Math.sin(angle) * x + Math.cos(angle) * z;
    
    // Create a raycaster
    const raycaster = new THREE.Raycaster();

    // Cast from high up directly down
    const rayOrigin = new THREE.Vector3(rotatedX, 1000, rotatedZ);
    const rayDirection = new THREE.Vector3(0, -1, 0);
    rayDirection.normalize();
    raycaster.set(rayOrigin, rayDirection);
    
    // Perform raycasting
    const intersects = raycaster.intersectObject(meshRef.current, false);
    
    if (intersects.length > 0 && intersects[0].faceIndex !== undefined && intersects[0].faceIndex !== null) {
      const faceIndex = intersects[0].faceIndex;
      if (triangleMap && faceIndex < triangleMap.length) {
        return {
          triangle: triangleMap[faceIndex],
          faceIndex: faceIndex
        };
      }
    }
    
    return null;
  }, [triangleMap]);
  
  // Make the function available to parent components
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.findTriangleAtCoordinates = findTriangleAtCoordinates;
    }
  }, [findTriangleAtCoordinates]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (showGrid) return;
    setMouseDownPos({ x: event.clientX, y: event.clientY });
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (showGrid || !mouseDownPos || !onTriangleSelect || !triangleMap) return;

    // Check if mouse moved more than 5 pixels in any direction
    const dx = Math.abs(event.clientX - mouseDownPos.x);
    const dy = Math.abs(event.clientY - mouseDownPos.y);
    const isDrag = dx > 5 || dy > 5;

    setMouseDownPos(null);

    if (!isDrag && event.faceIndex !== null && event.faceIndex !== undefined && event.faceIndex < triangleMap.length) {
      const selectedTriangle = triangleMap[event.faceIndex];
      (window as any).selectedTriangle = selectedTriangle;
      onTriangleSelect(selectedTriangle, event.faceIndex);
    }
  };

  const handlePaintingPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || disablePainting) return;
    setPaintingMouseDownPos({ x: event.clientX, y: event.clientY });
    if (mode === 'painting' && typeof event.faceIndex === 'number') {
      const alreadySelected = paintingSelectedTriangles.has(event.faceIndex);
      setPaintingDragStartMode(alreadySelected);
      togglePaintingSelectedTriangle(event.faceIndex, !alreadySelected);
      setPaintingHasToggled(true);
    }
  };

  const handlePaintingPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (disablePainting) return;
    if (!paintingMouseDownPos) return;
    const dx = Math.abs(event.clientX - paintingMouseDownPos.x);
    const dy = Math.abs(event.clientY - paintingMouseDownPos.y);
    if (dx > 5 || dy > 5) {
      setPaintingDragActive(true);
      if (mode === 'painting' && typeof event.faceIndex === 'number' && paintingDragStartMode !== null) {
        const shouldAdd = !paintingDragStartMode;
        togglePaintingSelectedTriangle(event.faceIndex, shouldAdd);
      }
    }
  };

  const handlePaintingClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.button !== 0 || disablePainting) return;
    if (mode === 'painting' && typeof event.faceIndex === 'number') {
      if (!paintingDragActive && !paintingHasToggled) {
        const isSelected = paintingSelectedTriangles.has(event.faceIndex);
        togglePaintingSelectedTriangle(event.faceIndex, !isSelected);
      }
    }
    setPaintingDragActive(false);
    setPaintingDragStartMode(null);
    setPaintingMouseDownPos(null);
    setPaintingHasToggled(false);
  };

  // Use a separate effect to sync our internal ref with the forwarded ref
  useEffect(() => {
    if (meshRef.current && ref) {
      if (typeof ref === 'function') {
        ref(meshRef.current);
      }
    }
  }, [ref, meshRef.current]);

  if (!geometry || !triangleMap) return null;

  return (
    <group>
      <group 
        position={[mapCenter.x, 0, mapCenter.z]}
        rotation={[0, rotation, 0]}
      >
        <group position={[-mapCenter.x, 0, -mapCenter.z]}>
          <mesh 
            ref={meshRef}
            geometry={geometry}
            onPointerDown={mode === 'painting' ? handlePaintingPointerDown : handlePointerDown}
            onPointerMove={mode === 'painting' ? handlePaintingPointerMove : undefined}
            onClick={mode === 'painting' ? handlePaintingClick : handleClick}
            renderOrder={0}
          >
            {renderingMode === "textured" && texture ? (
              <meshBasicMaterial 
                map={texture} 
                side={THREE.DoubleSide}
                transparent={true}
                alphaTest={0.5}
                toneMapped={false}
              />
            ) : (
              <meshPhongMaterial vertexColors side={THREE.DoubleSide} />
            )}
          </mesh>
          <mesh geometry={geometry} renderOrder={8}>
            <meshBasicMaterial 
              color="#000000"
              wireframe={true}
              transparent={true}
              opacity={wireframe ? 0.2 : 0}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          {!showGrid && selectedGeometry && mode !== 'painting' && (
            <lineSegments renderOrder={10}>
              <edgesGeometry attach="geometry" args={[selectedGeometry]} />
              <lineBasicMaterial 
                color="#ff00ff" 
                linewidth={2} 
                depthTest={false} 
                depthWrite={false}
                transparent
              />
            </lineSegments>
          )}
          {showGrid && (
            <GridOverlay 
              worldmapLength={worldmap?.length ?? 0} 
              worldmapWidth={worldmap?.[0]?.length ?? 0} 
            />
          )}
          {mode === 'painting' && paintingSelectedTriangles.size > 0 && triangleMap && (
            Array.from(paintingSelectedTriangles).map(faceIndex => {
              const tri = triangleMap[faceIndex];
              if (!tri) return null;
              const highlightPositions = new Float32Array(9);
              highlightPositions.set([
                tri.transformedVertices.v0[0], tri.transformedVertices.v0[1] + SELECTION_Y_OFFSET, tri.transformedVertices.v0[2],
                tri.transformedVertices.v1[0], tri.transformedVertices.v1[1] + SELECTION_Y_OFFSET, tri.transformedVertices.v1[2],
                tri.transformedVertices.v2[0], tri.transformedVertices.v2[1] + SELECTION_Y_OFFSET, tri.transformedVertices.v2[2]
              ], 0);
              const selectedGeometry = new THREE.BufferGeometry();
              selectedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightPositions, 3));
              selectedGeometry.computeVertexNormals();
              return (
                <group key={faceIndex}>
                  {/* White semi-transparent fill */}
                  <mesh geometry={selectedGeometry} renderOrder={9}>
                    <meshBasicMaterial 
                      color="#ffffff" 
                      transparent={true}
                      opacity={0.33}
                      side={THREE.DoubleSide}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>
                  {/* Magenta outline */}
                  <lineSegments renderOrder={10}>
                    <edgesGeometry attach="geometry" args={[selectedGeometry]} />
                    <lineBasicMaterial 
                      color="#000" 
                      opacity={0.33}
                      depthTest={false} 
                      depthWrite={false}
                      transparent
                    />
                  </lineSegments>
                </group>
              );
            })
          )}
        </group>
      </group>
    </group>
  );
}); 