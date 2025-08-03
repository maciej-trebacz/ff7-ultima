"use strict";

export enum Tabs {
  General = "general",
  Field = "field",
  World = "world",
  Battle = "battle",
  Party = "party",
  Chocobos = "chocobos",
  Variables = "variables",
}

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
  Snowboard2 = 14,
  Quit = 19,
  Start = 20,
  BattleSwirl = 23,
  Ending = 25,
  GameOver = 26,
  Intro = 27,
  Credits = 28,
}

// export type RandomEncounters = "off" | "normal" | "max";
export enum RandomEncounters {
  Off = 0,
  Normal = 1,
  Max = 2,
}

export interface Light {
  color: [number, number, number]; // RGB
  x: number;
  y: number;
  z: number;
}

export interface FieldLights {
  global_light_color: [number, number, number]; // RGB
  light1: Light;
  light2: Light;
  light3: Light;
}

export interface FieldModel {
  name: string,
  x: number,
  y: number,
  z: number,
  direction: number,
  triangle: number,
  collision: number,
  interaction: number,
  visible: number,
  lights: FieldLights,
}

export interface FieldLine {
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
  enabled: number,
  entity: number,
}


export interface BattleCharObj {
  index: number,
  status: number,
  flags: number,
  hp: number,
  max_hp: number,
  mp: number,
  max_mp: number,
  atb: number,
  limit: number,
  name: string,
  scene_id: number,
}
export interface MateriaSlot {
  id: number,
  ap: number,
}

export interface PartyMember {
  id: number,
  name: string,
  level: number,
  strength: number,
  vitality: number,
  magic: number,
  spirit: number,
  dexterity: number,
  luck: number,
  strength_bonus: number,
  vitality_bonus: number,
  magic_bonus: number,
  spirit_bonus: number,
  dexterity_bonus: number,
  luck_bonus: number,
  limit_level: number,
  order: number,
  status: number,
  hp: number,
  base_hp: number,
  max_hp: number,
  mp: number,
  base_mp: number,
  max_mp: number,
  limit: number,
  exp: number,
  weapon: number,
  armor: number,
  accessory: number,
  limit_skills: number,
  kills: number,
  limit_1_1_uses: number,
  limit_2_1_uses: number,
  limit_3_1_uses: number,
  weapon_materia: MateriaSlot[],
  armor_materia: MateriaSlot[],
  exp_to_next_level: number,
}

export interface WorldModel {
  index: number;
  x: number;
  y: number;
  z: number;
  direction: number;
  model_id: number;
  walkmesh_type: number;
  script: number;
  location_id?: number;
  chocobo_tracks: boolean;
}

export interface WorldFieldTblItem {
  x: number;
  y: number;
  field_id: number;
  triangle_id: number;
  direction: number;
}

export enum WorldModelIds {
  Cloud = 0,
  Tifa = 1,
  Cid = 2,
  Highwind = 3,
  WildChocobo = 4,
  TinyBronco = 5,
  Buggy = 6,
  JunonCanon = 7,
  CargoShip = 8,
  HighwindPropellers = 9,
  DiamondWeapon = 10,
  UltimateWeapon = 11,
  FortCondor = 12,
  Submarine = 13,
  GoldSaucer = 14,
  RocketTownRocket = 15,
  RocketTownPad = 16,
  SunkenGelnika = 17,
  UnderwaterReactor = 18,
  Chocobo = 19,
  MidgarCanon = 20,
  Unknown1 = 21,
  Unknown2 = 22,
  Unknown3 = 23,
  NorthCraterBarrier = 24,
  AncientForest = 25,
  KeyOfTheAncients = 26,
  Unknown4 = 27,
  RedSubmarine = 28,
  RubyWeapon = 29,
  EmeraldWeapon = 30,
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

export enum ElementalType {
  Fire = 0,
  Ice = 1,
  Lightning = 2,
  Earth = 3,
  Poison = 4,
  Gravity = 5,
  Water = 6,
  Wind = 7,
  Holy = 8,
  Restorative = 9,
  Cut = 10,
  Hit = 11,
  Punch = 12,
  Shoot = 13,
  Scream = 14,
  Hidden = 15,
  Nothing = 0xFF,
}

export enum ElementalEffect {
  Death = 0,
  AutoHit = 1,
  DoubleDamage = 2,
  HalfDamage = 4,
  Nullify = 5,
  Absorb = 6,
  FullCure = 7,
  Nothing = 0xFF,
}

export interface Elemental {
  element: ElementalType,
  effect: ElementalEffect
}

export enum ItemType {
  Steal = 0,
  Drop = 1
}

export interface Item {
  name: string,
  item_type: ItemType,
  rate: number
}

export interface EnemyData {
  level: number,
  speed: number,
  luck: number,
  evade: number,
  strength: number,
  defense: number,
  magic: number,
  magic_defense: number,
  gil: number,
  exp: number,
  ap: number,
  back_damage_multiplier: number,
  elements: Elemental[],
  status_immunities: number,
  items: Item[],
  morph: String | null,
}

export enum LocationName {
  "Midgar Area" = 0,
  "Grasslands Area" = 1,
  "Junon Area" = 2,
  "Corel Area" = 3,
  "Gold Saucer Area" = 4,
  "Gongaga Area" = 5,
  "Cosmo Area" = 6,
  "Nibel Area" = 7,
  "Rocket Launch Pad Area" = 8,
  "Wutai Area" = 9,
  "Woodlands Area" = 10,
  "Icicle Area" = 11,
  "Mideel Area" = 12,
  "North Corel Area" = 13,
  "Cactus Island" = 14,
  "Goblin Island" = 15,
  "Round Island" = 16,
  "Sea" = 17,
  "Bottom of the Sea" = 18,
  "Glacier" = 19
}

export enum ChocoboRating {
  "wonderful" = 1,
  "great" = 2,
  "good" = 3,
  "so-so" = 4,
  "average" = 5,
  "not bad" = 6,
  "bad" = 7,
  "terrible" = 8,
}

export type Destination = {
  x: number;
  y: number;
  triangle: number;
  direction?: number;
}

export type UpdateInfo = {
  version: string;
  date: string | null;
  body: string | null;
};

export interface SceneCameraPosition {
  x_pos: number;
  y_pos: number;
  z_pos: number;
  x_dir: number;
  y_dir: number;
  z_dir: number;
}

export interface SceneBattleSetup {
  battle_location: number;
  next_formation_id_on_win: number;
  escape_counter: number;
  next_battle_arena_candidates: number[];
  flags: number;
  battle_layout_type: number;
  pre_battle_camera_pos_index: number;
}

export interface SceneCameraPlacement {
  primary_idle_camera: SceneCameraPosition;
  other_camera_positions: SceneCameraPosition[];
}

export interface SceneBattleFormationEntry {
  enemy_id: number;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  row: number;
  cover_flags: number;
  initial_condition_flags: number;
}

export interface SceneElementRate {
  element_type: number;
  rate: number;
}

export interface SceneEnemyItem {
  rate: number;
  item_id: number;
}

export interface SceneEnemy {
  id: number;
  name: string;
  level: number;
  speed: number;
  luck: number;
  evade: number;
  strength: number;
  defense: number;
  magic: number;
  magic_defense: number;
  element_rates: SceneElementRate[];
  enemy_attack_ids: number[];
  enemy_attack_camera_movement_ids: number[];
  items: SceneEnemyItem[];
  manipulated_berserk_attack_indexes: number[];
  mp: number;
  ap: number;
  morph_item_id: number;
  back_damage_multiplier: number;
  hp: number;
  exp: number;
  gil: number;
  status_immunities: number;
}

export interface SceneAttack {
  id: number;
  name: string;
}

export interface SceneFormation {
  setup: SceneBattleSetup;
  camera_placement: SceneCameraPlacement;
  enemies: SceneBattleFormationEntry[];
}

export interface BattleScene {
  enemies: SceneEnemy[];
  formations: SceneFormation[];
  attacks: SceneAttack[];
}

// Chocobo types
export interface ChocoboSlot {
  sprint_speed: number;
  max_sprint_speed: number;
  speed: number;
  max_speed: number;
  acceleration: number;
  cooperation: number;
  intelligence: number;
  personality: number;
  pcount: number;
  races_won: number;
  sex: number; // 1 = female, 0 = male
  color: number; // 0=Yellow, 1=Green, 2=Blue, 3=Black, 4=Gold
}

export interface FencedChocobo {
  rating: number; // 1=Wonderful, 2=Great, 3=Good, 4=Average, 5=Poor, 6=So-So, 7=?, 8=Worst
}

export interface ChocoboData {
  fenced_chocobos: FencedChocobo[]; // Penned chocobo ratings (4 slots)
  stables_owned: number; // Number of chocobo stables owned
  occupied_stables: number; // Number of occupied stables
  stables_occupied_mask: number; // Bitmask for occupied stables
  cant_mate_mask: number; // Bitmask for chocobos that can't mate
  stable_chocobos: (ChocoboSlot | null)[]; // 6 stable slots, some may be empty
  chocobo_names: string[]; // Names for each stable chocobo (6 slots)
  chocobo_stamina: number[]; // Stamina values for each stable chocobo (6 slots)
  chocobo_target_battle_counts: number[]; // Target battle counts for mating eligibility (6 slots)
}
