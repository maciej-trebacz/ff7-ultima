import { MapType } from './types';

export const SHOW_DEBUG = false;
export const PIXELATED_TEXTURES = false;

export const CAMERA_HEIGHT: Record<MapType, number> = {
  overworld: 10200,
  underwater: 5800,
  glacier: 2900
};

export const LOCATION_COLORS: Record<MapType, Record<number, string>> = {
  overworld: {
    0: '#4c3', 1: '#3a3', 2: '#977', 3: '#00a', 4: '#2bad9f', 5: '#00d', 6: '#14f', 7: '#898',
    8: '#ee7', 9: '#aa5', 10: '#eee', 11: '#ff0', 12: '#aa0', 13: '#0d0', 14: '#0e0', 15: '#0f0',
    16: '#a98', 17: '#ffa', 18: '#668', 19: '#aa7', 20: '#bba', 21: '#a88', 22: '#0af', 23: '#000',
    24: '#ee7', 25: '#282', 26: '#008', 27: '#fbb', 28: '#ffc', 29: '#b99', 30: '#c99'
  },
  underwater: {
    0: '#258',
    3: '#69a',
    15: '#479'
  },
  glacier: {
    1: '#aaa',
    2: '#cce',
    9: '#eee',
    10: '#fff'
  }
};

export const REGION_COLORS: Record<MapType, Record<number, string>> = {
  overworld: {
    0: '#605a5a', 1: '#5c3', 2: '#69c', 3: '#988', 4: '#d0a040', 5: '#492', 6: '#aa6039', 7: '#809080',
    8: '#6a7', 9: '#e65', 10: '#5e5', 11: '#fff', 12: '#a86', 13: '#c97', 14: '#0d0', 15: '#8f0',
    16: '#f9a', 17: '#00a'
  },
  underwater: {
     0: '#258',
     18: '#69a'
  },
  glacier: {
    11: '#fff',
  }
};

export const SCRIPT_COLORS = {
  none: '#6a6a6a',      // Gray for no script
  chocobo: '#ffff00',   // Yellow for chocobo areas
  script: {
    1: '#555555',       // Light gray
    2: '#000000',       // Unused
    3: '#ff4a00',       // Light red
    4: '#ff0000',       // Red-orange
    5: '#ff5500',       // Bright red
    6: '#ff8800',       // Pure red
    7: '#ffaa00',       // Dark red
    8: '#cc0000'        // Darker red
  }
} as const;

export const MESH_SIZE = 8192;
export const SCALE = 0.05;
export const ATLAS_SIZE = 2048;
export const TEXTURE_PADDING = 4;
export const SELECTION_Y_OFFSET = 0.01; 