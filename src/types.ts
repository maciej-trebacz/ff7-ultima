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