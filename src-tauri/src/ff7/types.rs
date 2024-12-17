use serde::Serialize;

#[derive(Serialize)]
pub struct FF7BasicData {
    pub current_module: u16,
    pub game_moment: u16,
    pub field_id: u16,
    pub field_fps: f64,
    pub battle_fps: f64,
    pub world_fps: f64,
    pub in_game_time: u32,
    pub disc_id: u8,
    pub menu_visibility: u16,
    pub menu_locks: u16,
    pub field_movement_disabled: u8,
    pub field_menu_access_enabled: u8,
    pub party_bitmask: u16,
    pub gil: u32,
    pub gp: u16,
    pub battle_count: u16,
    pub battle_escape_count: u16,
    pub field_battle_check: u32,
    pub game_obj_ptr: u32,
    pub battle_swirl_check: u8,
    pub instant_atb_check: u16,
    pub unfocus_patch_check: u8,
    pub ffnx_check: u8,
    pub step_id: u32,
    pub step_fraction: u32,
    pub danger_value: u32,
    pub battle_id: u16,
    pub invincibility_check: u16,
}

#[derive(Serialize)]
pub struct FieldModel {
    pub x: i32,
    pub y: i32,
    pub z: i32,
    pub direction: u8,
}

#[derive(Serialize)]
pub struct BattleCharObj {
    pub name: String,
    pub flags: u8,
    pub status: u32,
    pub hp: u16,
    pub max_hp: u16,
    pub mp: u16,
    pub max_mp: u16,
    pub atb: u16,
    pub limit: u8,
    pub scene_id: u8,
}

#[derive(Serialize)]
pub struct FieldData {
    pub field_id: u16,
    pub field_name: Vec<u8>,
    pub field_model_count: u16,
    pub field_model_names: Vec<String>,
}

#[derive(Serialize)]
pub struct WorldModel {
    pub x: u32,
    pub y: u32,
    pub z: u32,
    pub direction: i16,
    pub model_id: u8,
    pub walkmesh_type: u8,
}

#[derive(Serialize)]
pub struct Elemental {
    pub element: u8,
    pub effect: u8,
}

#[allow(dead_code)]
#[derive(Serialize)]
pub enum ElementalEffect {
    Death = 0,
    DoubleDamage = 2,
    HalfDamage = 4,
    Nullify = 5,
    Absorb = 6,
    FullCure = 7,
    Nothing = 0xFF,
}

#[allow(dead_code)]
#[derive(Serialize)]
pub enum ElementalType {
    Fire = 0,
    Ice,
    Bolt,
    Earth,
    Bio,
    Gravity,
    Water,
    Wind,
    Holy,
    Health,
    Cut,
    Hit,
    Punch,
    Shoot,
    Scream,
    Hidden,
    Nothing = 0xFF,
}

#[derive(Serialize)]
pub struct Item {
    pub name: String,
    pub item_type: ItemType,
    pub rate: u8,
}

#[derive(Serialize)]
pub enum ItemType {
    Steal,
    Drop,
}

#[derive(Serialize)]
pub struct EnemyData {
    pub level: u8,
    pub speed: u8,
    pub luck: u8,
    pub evade: u8,
    pub strength: u8,
    pub defense: u16,
    pub magic: u8,
    pub magic_defense: u16,
    pub elements: Vec<Elemental>,
    pub items: Vec<Item>,
    pub status_immunities: u32,
    pub gil: u32,
    pub exp: u32,
    pub ap: u16,
    pub back_damage_multiplier: u8,
    pub morph: Option<String>,
}

#[derive(Serialize)]
pub struct FF7Data {
    pub basic: FF7BasicData,
    pub field_models: Vec<FieldModel>,
    pub battle_allies: Vec<BattleCharObj>,
    pub battle_enemies: Vec<BattleCharObj>,
    pub field_data: FieldData,
    pub world_current_model: WorldModel,
}
