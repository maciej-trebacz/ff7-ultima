use super::items::Item;
use super::kernel::Elemental;
use serde::Serialize;

#[derive(Serialize)]
pub struct BattleCharObj {
    pub name: String,
    pub flags: u8,
    pub status: u32,
    pub hp: u32,
    pub max_hp: u32,
    pub mp: u16,
    pub max_mp: u16,
    pub atb: u16,
    pub limit: u16,
    pub scene_id: u8,
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
