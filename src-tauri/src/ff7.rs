use serde::Serialize;
use crate::memory::*;
use crate::addresses::FF7Addresses;
use crate::ff7text::decode_text;

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
    invincibility_check: u16,
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
    name: String,
    status: u32,
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
    field_model_count: u16,
    field_model_names: Vec<String>,
}

#[derive(Serialize)]
pub struct FF7Data {
    basic: FF7BasicData,
    field_models: Vec<FieldModel>,
    battle_allies: Vec<BattleCharObj>,
    battle_enemies: Vec<BattleCharObj>,
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
        invincibility_check: read_memory_short(addresses.battle_init_chars_call)?,
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

fn read_name(address: u32) -> Result<String, String> {
    let mut name = Vec::new();
    let mut i = 0;
    while i < 16 {
        let byte = read_memory_byte(address + i)?;
        if byte == 0xFF {
            break;
        }
        name.push(byte);
        i += 1;
    }
    let decoded_name = decode_text(&name);
    Ok(decoded_name.unwrap_or_else(|_| String::from_utf8(name).unwrap()))
}

fn read_battle_allies(addresses: &FF7Addresses) -> Result<Vec<BattleCharObj>, String> {
    let mut party_ids = Vec::new();
    for i in 0..3 {
        party_ids.push(read_memory_byte(addresses.party_member_ids + i)?);
    }

    let mut party_names = Vec::new();
    for i in 0..3 {
        let name_addr = addresses.party_member_names + party_ids[i as usize] as u32 * 0x84;
        let decoded_name = read_name(name_addr);
        party_names.push(decoded_name.unwrap_or_else(|_| String::from("???")));
    }

    let mut chars: Vec<BattleCharObj> = Vec::new();
    let char_obj_length = 104;
    for i in 0..3 {
        let name = party_names[i as usize].clone();
        let char = BattleCharObj {
            name,
            status: read_memory_int(addresses.ally_ptr_base + i * char_obj_length)?,
            hp: read_memory_short(addresses.ally_ptr_base + i * char_obj_length + 0x2c)?,
            max_hp: read_memory_short(addresses.ally_ptr_base + i * char_obj_length + 0x30)?,
            mp: read_memory_short(addresses.ally_ptr_base + i * char_obj_length + 0x28)?,
            max_mp: read_memory_short(addresses.ally_ptr_base + i * char_obj_length + 0x2a)?,
            atb: read_memory_short(addresses.ally_ptr_base + i * char_obj_length)?,
            limit: read_memory_byte(addresses.ally_limit_ptr_base + i * 52)?,
        };
        chars.push(char);
    }
    Ok(chars)
}

fn read_battle_enemies(addresses: &FF7Addresses) -> Result<Vec<BattleCharObj>, String> {
    let mut chars: Vec<BattleCharObj> = Vec::new();
    let char_obj_length = 104;
    let ally_limit_length = 52;
    let enemy_record_length = 16;
    let enemy_names_length = 184;
    for i in 4..10 {
        let enemy_scene_idx = read_memory_byte(addresses.enemy_obj_base + (i - 4) * enemy_record_length).unwrap_or(0) as u32;
        let enemy_name = read_name(addresses.enemy_names_base + enemy_scene_idx * enemy_names_length);

        let char = BattleCharObj {
            name: enemy_name.unwrap_or_else(|_| String::from("???")),
            status: read_memory_int(addresses.ally_ptr_base + i * char_obj_length)?,
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
    let field_data_addr = read_memory_int(addresses.field_data_ptr)?;
    if field_data_addr == 0 {
        return Ok(FieldData {
            field_id,
            field_name,
            field_model_count: 0,
            field_model_names: Vec::new(),
        });
    }

    let section3_offset = read_memory_int(field_data_addr + 0x0e)?;
    let section3_addr = field_data_addr + section3_offset + 4;
    let field_model_count = read_memory_short(section3_addr + 2)?;
    let models_addr = section3_addr + 6;

    let mut field_model_names = Vec::new();
    let mut offset = 0;
    for i in 0..field_model_count {
        let model_name_size = read_memory_short(models_addr + offset)?;
        let model_name = read_memory_buffer(models_addr + offset + 2, model_name_size as usize)?;
        let model_animation_count = read_memory_short(models_addr + offset + model_name_size as u32 + 16)?;
        field_model_names.push(String::from_utf8(model_name).unwrap_or(String::from("???")));
        offset += model_name_size as u32 + 48;

        for j in 0..model_animation_count {
            let animation_name_size = read_memory_short(models_addr + offset)?;
            offset += animation_name_size as u32 + 4;
        }
    }

    Ok(FieldData {
        field_id,
        field_name,
        field_model_count,
        field_model_names,
    })
}

pub fn read_data() -> Result<FF7Data, String> {
    let addresses = FF7Addresses::new();
    let basic = read_basic_data(&addresses)?;
    let field_models = read_field_models(&addresses)?;
    let battle_allies = read_battle_allies(&addresses)?;
    let battle_enemies = read_battle_enemies(&addresses)?;
    let field_data = read_field_data(&addresses)?;
    
    Ok(FF7Data {
        basic,
        field_models,
        battle_allies,
        battle_enemies,
        field_data,
    })
}