import { Texture } from 'three';
import CloudPin from '@/assets/pin-cloud.png';
import TifaPin from '@/assets/pin-tifa.png';
import CidPin from '@/assets/pin-cid.png';
import DiamondPin from '@/assets/pin-diamond.png';
import EmeraldPin from '@/assets/pin-emerald.png';
import RubyPin from '@/assets/pin-ruby.png';
import UltimatePin from '@/assets/pin-ultimate.png';
import HighwindPin from '@/assets/pin-highwind.png';
import SubmarinePin from '@/assets/pin-submarine.png';
import BuggyPin from '@/assets/pin-buggy.png';
import ChocoboPin from '@/assets/pin-chocobo.png';
import TinyBroncoPin from '@/assets/pin-tinybronco.png';
import ZolomPin from '@/assets/pin-zolom.png';
import RedSubmarinePin from '@/assets/pin-redsubmarine.png';

export interface ModelTextureConfig {
  id: number;
  texture: string;
  name: string;
}

export const MODEL_TEXTURES: ModelTextureConfig[] = [
  {
    id: 0,
    texture: CloudPin,
    name: 'Cloud',
  },
  {
    id: 1,
    texture: TifaPin,
    name: 'Tifa',
  },
  {
    id: 2,
    texture: CidPin,
    name: 'Cid',
  },
  {
    id: 3,
    texture: HighwindPin,
    name: 'Highwind',
  },
  {
    id: 4,
    texture: ChocoboPin,
    name: 'Wild Chocobo',
  },
  {
    id: 5,
    texture: TinyBroncoPin,
    name: 'Tiny Bronco',
  },
  {
    id: 6,
    texture: BuggyPin,
    name: 'Buggy',
  },
  {
    id: 10,
    texture: DiamondPin,
    name: 'Diamond Weapon',
  },
  {
    id: 11,
    texture: UltimatePin,
    name: 'Ultimate Weapon',
  },
  {
    id: 13,
    texture: SubmarinePin,
    name: 'Submarine',
  },
  {
    id: 19,
    texture: ChocoboPin,
    name: 'Chocobo',
  },
  {
    id: 28,
    texture: RedSubmarinePin,
    name: 'Red Submarine',
  },
  {
    id: 29,
    texture: RubyPin,
    name: 'Ruby Weapon',
  },
  {
    id: 30,
    texture: EmeraldPin,
    name: 'Emerald Weapon',
  },
  {
    id: 40,
    texture: ZolomPin,
    name: 'Zolom',
  },
];

export const getModelTexture = (modelId: number, textureMap: Record<number, Texture>): Texture | null => {
  return textureMap[modelId] || null;
};

export const createTextureMap = (textures: Record<number, Texture>): Record<number, Texture> => {
  return textures;
}; 