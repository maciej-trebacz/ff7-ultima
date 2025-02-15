import { Triangle, Mesh } from '@/ff7/mapfile';
import * as THREE from 'three';

export type MapType = "overworld" | "underwater" | "glacier";
export type RenderingMode = "terrain" | "textured" | "region" | "scripts";

export interface TriangleWithVertices extends Triangle {
  transformedVertices: {
    v0: [number, number, number];
    v1: [number, number, number];
    v2: [number, number, number];
  };
  meshOffsetX: number;
  meshOffsetZ: number;
  vertexIds: [number, number, number];
  trianglePtr: Triangle;  // Direct reference to the triangle in worldmap
}

export interface MapCenter {
  x: number;
  y: number;
  z: number;
}

export interface TextureAtlasResult {
  texture: THREE.Texture | null;
  canvas: HTMLCanvasElement | null;
  texturePositions: Map<number, { x: number, y: number, name: string }>;
}

export interface WorldMeshProps {
  worldmap: Mesh[][];
  mapType: MapType;
  renderingMode: RenderingMode;
  onTriangleSelect?: (triangle: Triangle | null, faceIndex: number | null) => void;
  selectedFaceIndex: number | null;
  debugCanvasRef: React.RefObject<HTMLCanvasElement>;
  mapCenter: MapCenter;
  rotation: number;
} 
