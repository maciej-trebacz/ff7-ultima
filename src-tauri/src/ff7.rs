use serde::Serialize;
use crate::memory::*;
use crate::addresses::FF7Addresses;

#[derive(Serialize)]
struct FF7BasicData {
    current_module: u16,
    game_moment: u16,
    field_id: u16,
    field_fps: f64,
    battle_fps: f64,
    world_fps: f64,
    in_game_time: u32,
    disc_id: u8,
    menu_visibility: u16,
    menu_locks: u16,
    field_movement_disabled: u8,
    field_menu_access_enabled: u8,
    party_bitmask: u16,
    gil: u32,
    gp: u16,
    battle_count: u16,
    battle_escape_count: u16,
    field_battle_check: u32,
    game_obj_ptr: u32,
    battle_swirl_check: u8,
    instant_atb_check: u16,
    unfocus_patch_check: u8,
    ffnx_check: u8,
    step_id: u32,
    step_fraction: u32,
    danger_value: u32,
    battle_id: u16,
}

#[derive(Serialize)]
struct FieldModel {
    x: i32,
    y: i32,
    z: i32,
    direction: u8,
}

#[derive(Serialize)]
struct BattleCharObj {
    hp: u16,
    max_hp: u16,
    mp: u16,
    max_mp: u16,
    atb: u16,
    limit: u8,
}

#[derive(Serialize)]
pub struct FieldData {
    field_id: u16,
    field_name: Vec<u8>,
}

#[derive(Serialize)]
pub struct FF7Data {
    basic: FF7BasicData,
    field_models: Vec<FieldModel>,
    battle_chars: Vec<BattleCharObj>,
    field_data: FieldData,
}

fn read_basic_data(addresses: &FF7Addresses) -> Result<FF7BasicData, String> {
    Ok(FF7BasicData {
        current_module: read_memory_short(addresses.current_module)?,
        game_moment: read_memory_short(addresses.game_moment)?,
        field_id: read_memory_short(addresses.field_id)?,
        field_fps: read_memory_float(addresses.field_fps)?,
        battle_fps: read_memory_float(addresses.battle_fps)?,
        world_fps: read_memory_float(addresses.world_fps)?,
        in_game_time: read_memory_int(addresses.in_game_time)?,
        disc_id: read_memory_byte(addresses.disc_id)?,
        menu_visibility: read_memory_short(addresses.menu_visibility)?,
        menu_locks: read_memory_short(addresses.menu_locks)?,
        field_movement_disabled: read_memory_byte(addresses.field_movement_disabled)?,
        field_menu_access_enabled: read_memory_byte(addresses.field_menu_access_enabled)?,
        party_bitmask: read_memory_short(addresses.party_bitmask)?,
        gil: read_memory_int(addresses.gil)?,
        gp: read_memory_short(addresses.gp)?,
        battle_count: read_memory_short(addresses.battle_count)?,
        battle_escape_count: read_memory_short(addresses.battle_escape_count)?,
        field_battle_check: read_memory_int(addresses.field_battle_check)?,
        game_obj_ptr: read_memory_int(addresses.game_obj_ptr)?,
        battle_swirl_check: read_memory_byte(addresses.battle_swirl_check)?,
        instant_atb_check: read_memory_short(addresses.instant_atb_check)?,
        unfocus_patch_check: read_memory_byte(addresses.unfocus_patch_check)?,
        ffnx_check: read_memory_byte(addresses.ffnx_check)?,
        step_id: read_memory_int(addresses.step_id)?,
        step_fraction: read_memory_int(addresses.step_fraction)?,
        danger_value: read_memory_int(addresses.danger_value)?,
        battle_id: read_memory_short(addresses.battle_id)?,
    })
}

fn read_field_models(addresses: &FF7Addresses) -> Result<Vec<FieldModel>, String> {
    let mut models: Vec<FieldModel> = Vec::new();
    
    let model_ptr = read_memory_int(addresses.field_models_ptr)?;
    if model_ptr == 0 {
        return Ok(models);
    }

    for i in 0..16 {
        let base_address = model_ptr + i * 400;
        let model = FieldModel {
            x: read_memory_signed_int(base_address + 4)?,
            y: read_memory_signed_int(base_address + 8)?,
            z: read_memory_signed_int(base_address + 0xc)?,
            direction: read_memory_byte(base_address + 0x1c)?,
        };
        models.push(model);
    }
    Ok(models)
}

fn read_battle_chars(addresses: &FF7Addresses) -> Result<Vec<BattleCharObj>, String> {
    let mut chars: Vec<BattleCharObj> = Vec::new();
    let char_obj_length = 104;
    let ally_limit_length = 52;
    for i in 0..3 {
        let char = BattleCharObj {
            hp: read_memory_short(addresses.ally_ptr_base + i * char_obj_length + 0x2c)?,
            max_hp: read_memory_short(addresses.ally_ptr_base + i * char_obj_length + 0x30)?,
            mp: read_memory_short(addresses.ally_ptr_base + i * char_obj_length + 0x28)?,
            max_mp: read_memory_short(addresses.ally_ptr_base + i * char_obj_length + 0x2a)?,
            atb: read_memory_short(addresses.ally_ptr_base + i * char_obj_length)?,
            limit: read_memory_byte(addresses.ally_limit_ptr_base + i * ally_limit_length)?,
        };
        chars.push(char);
    }
    Ok(chars)
}

fn read_field_data(addresses: &FF7Addresses) -> Result<FieldData, String> {
    let field_id = read_memory_short(addresses.field_id)?;
    let field_name = read_memory_buffer(addresses.field_name, 16)?;
    Ok(FieldData {
        field_id,
        field_name,
    })
}

pub fn read_data() -> Result<FF7Data, String> {
    let addresses = FF7Addresses::new();
    let basic = read_basic_data(&addresses)?;
    let field_models = read_field_models(&addresses)?;
    let battle_chars = read_battle_chars(&addresses)?;
    let field_data = read_field_data(&addresses)?;
    
    Ok(FF7Data {
        basic,
        field_models,
        battle_chars,
        field_data,
    })
}