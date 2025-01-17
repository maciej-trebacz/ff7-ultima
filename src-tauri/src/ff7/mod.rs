pub mod addresses;
pub mod data;
pub mod ff7text;
pub mod types;

use addresses::FF7Addresses;
use data::*;
use serde::Serialize;
use types::*;

#[derive(Serialize)]
pub struct FF7Data {
    pub basic: FF7BasicData,
    pub field_models: Vec<FieldModel>,
    pub world_models: Vec<WorldModel>,
    pub battle_allies: Vec<BattleCharObj>,
    pub battle_enemies: Vec<BattleCharObj>,
    pub field_data: FieldData,
    pub world_current_model: WorldModel,
    pub party_members: Vec<PartyMember>,
}

pub fn read_data() -> Result<FF7Data, String> {
    let addresses = FF7Addresses::new();
    Ok(FF7Data {
        basic: read_basic_data(&addresses)?,
        field_models: read_field_models(&addresses)?,
        world_models: read_world_models(&addresses)?,
        battle_allies: read_battle_allies(&addresses)?,
        battle_enemies: read_battle_enemies(&addresses)?,
        field_data: read_field_data(&addresses)?,
        world_current_model: read_world_current_model(&addresses)?,
        party_members: read_party_members(&addresses)?,
    })
}
