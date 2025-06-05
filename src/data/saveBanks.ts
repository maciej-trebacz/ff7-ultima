export interface BitDefinition {
  mask: number;
  label: string;
}

export type VarType = 'u8' | 'u16' | 'bitmask';

export interface SaveVarDefinition {
  offset: number;
  length: number; // bytes
  type: VarType;
  label: string;
  bits?: BitDefinition[];
}

export const bank1Fields: SaveVarDefinition[] = [
  { offset: 0, length: 2, type: 'u16', label: 'Main progress' },
  { offset: 2, length: 1, type: 'u8', label: "Yuffie's initial level" },
  { offset: 3, length: 1, type: 'u8', label: "Aeris love points" },
  { offset: 4, length: 1, type: 'u8', label: "Tifa love points" },
  { offset: 5, length: 1, type: 'u8', label: "Yuffie love points" },
  { offset: 6, length: 1, type: 'u8', label: "Barret love points" },
  { offset: 7, length: 1, type: 'u8', label: 'Temp party member 1' },
  { offset: 8, length: 1, type: 'u8', label: 'Temp party member 2' },
  { offset: 9, length: 1, type: 'u8', label: 'Temp party member 3' },
  { offset: 16, length: 1, type: 'u8', label: 'Game timer hours' },
  { offset: 17, length: 1, type: 'u8', label: 'Game timer minutes' },
  { offset: 18, length: 1, type: 'u8', label: 'Game timer seconds' },
  { offset: 19, length: 1, type: 'u8', label: 'Game timer frames' },
  { offset: 20, length: 1, type: 'u8', label: 'Countdown hours' },
  { offset: 21, length: 1, type: 'u8', label: 'Countdown minutes' },
  { offset: 22, length: 1, type: 'u8', label: 'Countdown seconds' },
  { offset: 23, length: 1, type: 'u8', label: 'Countdown frames' },
  { offset: 24, length: 2, type: 'u16', label: 'Battles fought' },
  { offset: 26, length: 2, type: 'u16', label: 'Escapes' },
  {
    offset: 28,
    length: 2,
    type: 'bitmask',
    label: 'Menu visibility',
    bits: [
      { mask: 0x1, label: 'Item' },
      { mask: 0x2, label: 'Magic' },
      { mask: 0x4, label: 'Materia' },
      { mask: 0x8, label: 'Equip' },
      { mask: 0x10, label: 'Status' },
      { mask: 0x20, label: 'Order' },
      { mask: 0x40, label: 'Limit' },
      { mask: 0x80, label: 'Config' },
      { mask: 0x100, label: 'PHS' },
      { mask: 0x200, label: 'Save' },
    ],
  },
  {
    offset: 30,
    length: 2,
    type: 'bitmask',
    label: 'Menu lock',
    bits: [
      { mask: 0x1, label: 'Item' },
      { mask: 0x2, label: 'Magic' },
      { mask: 0x4, label: 'Materia' },
      { mask: 0x8, label: 'Equip' },
      { mask: 0x10, label: 'Status' },
      { mask: 0x20, label: 'Order' },
      { mask: 0x40, label: 'Limit' },
      { mask: 0x80, label: 'Config' },
      { mask: 0x100, label: 'PHS' },
      { mask: 0x200, label: 'Save' },
    ],
  },
  {
    offset: 36,
    length: 1,
    type: 'bitmask',
    label: 'Train Graveyard items',
    bits: [
      { mask: 0x01, label: 'Hi-Potion (Barrel 1)' },
      { mask: 0x02, label: 'Echo Screen (Barrel 2)' },
      { mask: 0x04, label: 'Potion (Floor 2)' },
      { mask: 0x08, label: 'Ether (Floor 3)' },
      { mask: 0x10, label: 'Hi-Potion (Roof Train 1)' },
      { mask: 0x20, label: 'Potion (Inside Train 2)' },
      { mask: 0x40, label: 'Potion (Floor 1)' },
      { mask: 0x80, label: 'Hi-Potion (Roof Train 2)' },
    ],
  },
  {
    offset: 37,
    length: 1,
    type: 'bitmask',
    label: 'Field items 1',
    bits: [
      { mask: 0x01, label: 'Elixir' },
      { mask: 0x02, label: 'Potion' },
      { mask: 0x04, label: 'Safety Bit' },
      { mask: 0x08, label: 'Mind Source' },
      { mask: 0x10, label: 'Sneak Glove' },
      { mask: 0x20, label: 'Premium Heart' },
      { mask: 0x40, label: 'Unused 1' },
      { mask: 0x80, label: 'Unused 2' },
    ],
  },
  {
    offset: 48,
    length: 1,
    type: 'bitmask',
    label: 'Field items / materia',
    bits: [
      { mask: 0x01, label: 'Potion' },
      { mask: 0x02, label: 'Potion + Phoenix Down' },
      { mask: 0x04, label: 'Ether' },
      { mask: 0x08, label: 'Cover materia' },
      { mask: 0x10, label: 'Choco-Mog summon' },
      { mask: 0x20, label: 'Sense materia' },
      { mask: 0x40, label: 'Ramuh summon' },
      { mask: 0x80, label: 'Mythril key' },
    ],
  },
  {
    offset: 49,
    length: 1,
    type: 'bitmask',
    label: 'Materia cave items',
    bits: [
      { mask: 0x01, label: 'Mime materia' },
      { mask: 0x02, label: 'HP<->MP materia' },
      { mask: 0x04, label: 'Quadra Magic' },
      { mask: 0x08, label: 'Knights of the Round' },
      { mask: 0x10, label: 'Elixir' },
      { mask: 0x20, label: 'X-Potion' },
      { mask: 0x40, label: 'Turbo Ether' },
      { mask: 0x80, label: 'Vaccine' },
    ],
  },
  {
    offset: 50,
    length: 1,
    type: 'bitmask',
    label: 'Northern Cave items 1',
    bits: [
      { mask: 0x01, label: 'Magic Counter materia' },
      { mask: 0x02, label: 'Speed Source' },
      { mask: 0x04, label: 'Turbo Ether (2)' },
      { mask: 0x08, label: 'X-Potion (2)' },
      { mask: 0x10, label: 'Mega All' },
      { mask: 0x20, label: 'Luck Source' },
      { mask: 0x40, label: 'Remedy' },
      { mask: 0x80, label: 'Bolt Ring' },
    ],
  },
  {
    offset: 51,
    length: 1,
    type: 'bitmask',
    label: 'Northern Cave items 2',
    bits: [
      { mask: 0x01, label: 'Gold Armlet' },
      { mask: 0x02, label: 'Great Gospel' },
      { mask: 0x04, label: 'Umbrella prize' },
      { mask: 0x08, label: 'Flayer prize' },
      { mask: 0x10, label: 'Death Penalty + Chaos' },
      { mask: 0x20, label: 'Elixir (2)' },
      { mask: 0x40, label: 'Enemy Skill animation' },
      { mask: 0x80, label: 'Enemy Skill materia' },
    ],
  },
];

export const banks = {
  1: bank1Fields,
};
