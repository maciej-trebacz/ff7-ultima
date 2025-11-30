import { Parser } from 'binary-parser';

export interface YuffieEncounter {
  cloudLevel: number;
  sceneId: number;
}

export interface ChocoboRating {
  battleSceneId: number;
  rating: number; // 1 (wonderful) .. 8 (terrible)
}

export interface EncounterPair {
  encounterId: number; // 0..1023 (10 bits)
  rate: number; // only lower 6 bits used by the game (0..63)
}

export interface EncounterSet {
  active: boolean;
  encounterRate: number; // 0..255
  normalEncounters: EncounterPair[]; // length 6
  backAttacks: EncounterPair[]; // length 2
  sideAttack: EncounterPair; // length 1
  pincerAttack: EncounterPair; // length 1
  chocoboEncounters: EncounterPair[]; // length 4
}

interface Region {
  sets: EncounterSet[]; // length 4
}

interface RandomEncounters {
  regions: Region[]; // length 16
}

export interface EncWData {
  yuffieEncounters: YuffieEncounter[]; // length 8
  chocoboRatings: ChocoboRating[]; // length 32
  randomEncounters: RandomEncounters; // 16 regions x 4 sets
}

const yuffieEncounterEntry = new Parser()
  .uint16le('cloudLevel')
  .uint16le('sceneId');

const chocoboRatingEntry = new Parser()
  .uint16le('battleSceneId')
  .uint16le('rating');

function decodeEncounterPairPacked(packed: number): EncounterPair {
  return { rate: packed >> 10, encounterId: packed & 0x3ff };
}

function decodeEncounterPairObject(o: any): EncounterPair {
  return decodeEncounterPairPacked(o.packed);
}

function decodeEncounterPairArray(arr: any[]): EncounterPair[] {
  return arr.map(decodeEncounterPairObject);
}

const encounterPair = new Parser().uint16le('packed');

const encounterSet = new Parser()
  .uint8('active')
  .uint8('encounterRate')
  .array('normalEncounters', {
    type: encounterPair,
    length: 6,
    formatter: decodeEncounterPairArray
  })
  .array('backAttacks', {
    type: encounterPair,
    length: 2,
    formatter: decodeEncounterPairArray
  })
  .nest('sideAttack', {
    type: encounterPair,
    formatter: decodeEncounterPairObject
  })
  .nest('pincerAttack', {
    type: encounterPair,
    formatter: decodeEncounterPairObject
  })
  .array('chocoboEncounters', {
    type: encounterPair,
    length: 4,
    formatter: decodeEncounterPairArray
  })
  .skip(2); // padding

const region = new Parser().array('sets', { type: encounterSet, length: 4 });

const randomEncounters = new Parser().array('regions', { type: region, length: 16 });

const encWParser = new Parser()
  .array('yuffieEncounters', { type: yuffieEncounterEntry, length: 8 })
  .array('chocoboRatings', { type: chocoboRatingEntry, length: 32 })
  .nest('randomEncounters', { type: randomEncounters });

export class EncWFile {
  data: EncWData;

  constructor(data: Uint8Array) {
    this.data = encWParser.parse(data);
    // Normalize 'active' to boolean
    for (let r = 0; r < 16; r++) {
      for (let s = 0; s < 4; s++) {
        const set = this.data.randomEncounters.regions[r].sets[s];
        (set as any).active = !!set.active;
      }
    }
  }

  getYuffieEncounter(index: number): YuffieEncounter {
    if (index < 0 || index >= 8) throw Error('Index must be in the range of 0-7.');
    return this.data.yuffieEncounters[index];
  }

  setYuffieEncounter(index: number, value: Partial<YuffieEncounter>) {
    if (index < 0 || index >= 8) throw Error('Index must be in the range of 0-7.');
    this.data.yuffieEncounters[index] = { ...this.data.yuffieEncounters[index], ...value };
  }

  getChocoboRating(index: number): ChocoboRating {
    if (index < 0 || index >= 32) throw Error('Index must be in the range of 0-31.');
    return this.data.chocoboRatings[index];
  }

  setChocoboRating(index: number, value: Partial<ChocoboRating>) {
    if (index < 0 || index >= 32) throw Error('Index must be in the range of 0-31.');
    this.data.chocoboRatings[index] = { ...this.data.chocoboRatings[index], ...value } as ChocoboRating;
  }

  getEncounterSet(regionIndex: number, setIndex: number): EncounterSet {
    if (regionIndex < 0 || regionIndex >= 16) throw Error('Region must be in the range of 0-15.');
    if (setIndex < 0 || setIndex >= 4) throw Error('Set must be in the range of 0-3.');
    return this.data.randomEncounters.regions[regionIndex].sets[setIndex];
  }

  setEncounterSet(regionIndex: number, setIndex: number, value: Partial<EncounterSet>) {
    if (regionIndex < 0 || regionIndex >= 16) throw Error('Region must be in the range of 0-15.');
    if (setIndex < 0 || setIndex >= 4) throw Error('Set must be in the range of 0-3.');
    const prev = this.data.randomEncounters.regions[regionIndex].sets[setIndex];
    this.data.randomEncounters.regions[regionIndex].sets[setIndex] = { ...prev, ...value } as EncounterSet;
  }

  writeFile(): Uint8Array {
    const out = new Uint8Array(0x8a0); // 32 + 128 + 2048
    const view = new DataView(out.buffer);
    let offset = 0;

    // Yuffie encounters
    for (let i = 0; i < 8; i++) {
      const entry = this.data.yuffieEncounters[i];
      view.setUint16(offset, entry.cloudLevel, true);
      view.setUint16(offset + 2, entry.sceneId, true);
      offset += 4;
    }

    // Chocobo ratings
    for (let i = 0; i < 32; i++) {
      const entry = this.data.chocoboRatings[i];
      view.setUint16(offset, entry.battleSceneId, true);
      view.setUint16(offset + 2, entry.rating, true);
      offset += 4;
    }

    // Random encounter table: 16 regions x 4 sets
    for (let regionIndex = 0; regionIndex < 16; regionIndex++) {
      for (let setIndex = 0; setIndex < 4; setIndex++) {
        const set = this.data.randomEncounters.regions[regionIndex].sets[setIndex];
        view.setUint8(offset, set.active ? 1 : 0);
        offset += 1;
        view.setUint8(offset, set.encounterRate ?? 0);
        offset += 1;

        const writePair = (p: EncounterPair) => {
          const packed = (p.rate << 10) | p.encounterId;
          view.setUint16(offset, packed, true);
          offset += 2;
        };

        for (let i = 0; i < 6; i++) writePair(set.normalEncounters[i] || { encounterId: 0, rate: 0 });
        for (let i = 0; i < 2; i++) writePair(set.backAttacks[i] || { encounterId: 0, rate: 0 });
        writePair(set.sideAttack || { encounterId: 0, rate: 0 });
        writePair(set.pincerAttack || { encounterId: 0, rate: 0 });
        for (let i = 0; i < 4; i++) writePair(set.chocoboEncounters[i] || { encounterId: 0, rate: 0 });

        // Padding
        view.setUint16(offset, 0, true);
        offset += 2;
      }
    }

    return out;
  }
}
