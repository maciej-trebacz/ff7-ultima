"use strict";

export enum GameModule {
  None = 0,
  Field = 1,
  Battle = 2,
  World = 3,
  Menu = 5,
}

export interface FieldModel {
  x: number,
  y: number,
  z: number,
  direction: number,
}

export interface BattleCharObj {
  hp: number,
  max_hp: number,
  mp: number,
  max_mp: number,
  atb: number,
  limit: number,
}