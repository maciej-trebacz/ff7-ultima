export interface SceneDestination {
  x: number;
  y: number;
  triangle: number;
  direction?: number;
}

export interface SceneSource {
  id: number;
  fieldName: string;
  type: 'gateway' | 'MAPJUMP';
  destination?: SceneDestination;
}

export interface Scene {
  id: number;
  fieldName: string;
  mapNames: string[];
  sources: SceneSource[];
}

export interface Scenes {
  [key: number]: Scene;
}

// This is the root type for scenes.json
export type ScenesData = Scenes;
