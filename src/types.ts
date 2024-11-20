"use strict";

export enum GameModule {
  None = 0,
  Field = 1,
  Battle = 2,
  World = 3,
  Menu = 5,
  Highway = 6,
  Chocobo = 7,
  SnowBoard = 8,
  Condor = 9,
  Submarine = 10,
  Jet = 11,
  ChangeDisc = 12,
  Quit = 19,
  Start = 20,
  BattleSwirl = 23,
  Ending = 25,
  GameOver = 26,
  Intro = 27,
  Credits = 28,
}

export interface FieldModel {
  name: string,
  x: number,
  y: number,
  z: number,
  direction: number,
}

export interface BattleCharObj {
  status: number,
  hp: number,
  max_hp: number,
  mp: number,
  max_mp: number,
  atb: number,
  limit: number,
  name: string,
}

export interface WorldModel {
  x: number;
  y: number;
  z: number;
  direction: number;
  model_id: number;
  walkmesh_type: number;
  script: number;
}

export enum WorldModelType {
  Cloud = 0,
  Tifa = 1,
  Cid = 2,
  Highwind = 3,
  WildChocobo = 4,
  TinyBronco = 5,
  Buggy = 6,
  Submarine = 13,
  Chocobo = 19,
  RedSubmarine = 28,
}

export enum WorldWalkmeshType {
  Grass = 0,
  Forest = 1,
  Mountain = 2,
  Sea = 3,
  RiverCrossing = 4,
  River = 5,
  Water = 6,
  Swamp = 7,
  Desert = 8,
  Wasteland = 9,
  Snow = 10,
  Riverside = 11,
  Cliff = 12,
  CorelBridge = 13,
  WutaiBridge = 14,
  Unused1 = 15,
  Hillside = 16,
  Beach = 17,
  SubPen = 18,
  Canyon = 19,
  MountainPass = 20,
  UnknownCliff = 21,
  Waterfall = 22,
  Unused2 = 23,
  SaucerDesert = 24,
  Jungle = 25,
  Sea2 = 26,
  NorthernCave = 27,
  DesertBorder = 28,
  Bridgehead = 29,
  BackEntrance = 30,
  Unused3 = 31
}