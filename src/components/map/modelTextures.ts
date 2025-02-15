import { Texture } from 'three';
import Model0Pin from '@/assets/map-model-0.png';
import Model3Pin from '@/assets/map-model-3.png';
import Model40Pin from '@/assets/map-model-40.png';
import Model13Pin from '@/assets/map-model-13.png';
import Model6Pin from '@/assets/map-model-6.png';
import Model4Pin from '@/assets/map-model-4.png';
import Model5Pin from '@/assets/map-model-5.png';

export interface ModelTextureConfig {
  id: number;
  texture: string;
  name: string;
}

export const MODEL_TEXTURES: ModelTextureConfig[] = [
  {
    id: 0,
    texture: Model0Pin,
    name: 'Cloud',
  },
  {
    id: 3,
    texture: Model3Pin,
    name: 'Highwind',
  },
  {
    id: 4,
    texture: Model4Pin,
    name: 'Wild Chocobo',
  },
  {
    id: 5,
    texture: Model5Pin,
    name: 'Tiny Bronco',
  },
  {
    id: 6,
    texture: Model6Pin,
    name: 'Buggy',
  },
  {
    id: 13,
    texture: Model13Pin,
    name: 'Submarine',
  },
  {
    id: 19,
    texture: Model4Pin,
    name: 'Chocobo',
  },
  {
    id: 40,
    texture: Model40Pin,
    name: 'Zolom',
  },
];

export const getModelTexture = (modelId: number, textureMap: Record<number, Texture>): Texture | null => {
  return textureMap[modelId] || null;
};

export const createTextureMap = (textures: Record<number, Texture>): Record<number, Texture> => {
  return textures;
}; 