use serde::Serialize;
use crate::memory::*;

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

macro_rules! read_memory {
    ($($field:ident: $read_fn:ident($addr:expr)),* $(,)?) => {
        {
            let mut data = FF7BasicData {
                $($field: 0 as _,)*
            };
            $(
                data.$field = $read_fn($addr)
                    .map_err(|e| format!("Failed to read {}: {}", stringify!($field), e))?;
            )*
            data
        }
    };
}

fn read_field_models() -> Result<Vec<FieldModel>, String> {
    let mut models: Vec<FieldModel> = Vec::new();
    for i in 0..16 {
        let model_ptr = read_memory_int(0xcff738);
        if let Ok(model_ptr) = model_ptr {
            let base_address = model_ptr + i * 400;
            let x = read_memory_signed_int(base_address + 4);
            let y = read_memory_signed_int(base_address + 8);
            let z = read_memory_signed_int(base_address + 0xc);
            let direction = read_memory_byte(base_address + 0x1c);
            let model = FieldModel {
                x: x.unwrap_or(0),
                y: y.unwrap_or(0),
                z: z.unwrap_or(0),
                direction: direction.unwrap_or(0),
            };
            models.push(model);
        }
    }

    Ok(models)
}

fn read_battle_chars() -> Result<Vec<BattleCharObj>, String> {
    let mut chars: Vec<BattleCharObj> = Vec::new();
    let ally_ptr_base = 0x9ab0dc;
    let char_obj_length = 104;
    let ally_limit_ptr_base = 0x9a8dc2;
    let ally_limit_length = 52;
    for i in 0..3 {
        let char = BattleCharObj {
            hp: read_memory_short(ally_ptr_base + i * char_obj_length + 0x2c)?,
            max_hp: read_memory_short(ally_ptr_base + i * char_obj_length + 0x30)?,
            mp: read_memory_short(ally_ptr_base + i * char_obj_length + 0x28)?,
            max_mp: read_memory_short(ally_ptr_base + i * char_obj_length + 0x2a)?,
            atb: read_memory_short(ally_ptr_base + i * char_obj_length)?,
            limit: read_memory_byte(ally_limit_ptr_base + i * ally_limit_length)?,
        };
        chars.push(char);
    }
    Ok(chars)
}

pub fn read_field_data() -> Result<FieldData, String> {
    let field_id = read_memory_short(0xcc15d0)?;
    let field_name = read_memory_buffer(0xcc1ef0, 16)?;
    let data = FieldData {
        field_id,
        field_name,
    };

    Ok(data)
}

pub fn read_data() -> Result<FF7Data, String> {
    let basic = read_memory!(
        current_module: read_memory_short(0xcbf9dc),
        game_moment: read_memory_short(0xdc08dc),
        field_id: read_memory_short(0xcc15d0),
        field_fps: read_memory_float(0xcff890),
        battle_fps: read_memory_float(0x9ab090),
        world_fps: read_memory_float(0xde6938),
        in_game_time: read_memory_int(0xdc08b8),
        disc_id: read_memory_byte(0xdc0bdc),
        menu_visibility: read_memory_short(0xdc08f8),
        menu_locks: read_memory_short(0xdc08fa),
        field_movement_disabled: read_memory_byte(0xcc0dba),
        field_menu_access_enabled: read_memory_byte(0xcc0dbc),
        party_bitmask: read_memory_short(0xdc0dde),
        gil: read_memory_int(0xdc08b4),
        gp: read_memory_short(0xdc0a26),
        battle_count: read_memory_short(0xdc08f4),
        battle_escape_count: read_memory_short(0xdc08f6),
        field_battle_check: read_memory_int(0x60b40a),
        game_obj_ptr: read_memory_int(0xdb2bb8),
        battle_swirl_check: read_memory_byte(0x4027e5),
        instant_atb_check: read_memory_short(0x433abd),
        unfocus_patch_check: read_memory_byte(0x74a561),
        ffnx_check: read_memory_byte(0x41b965),
        step_id: read_memory_int(0xcc165c),
        step_fraction: read_memory_int(0xcc1664),
        danger_value: read_memory_int(0xcc1668),
        battle_id: read_memory_short(0x9aad3c),
    );
    let field_models = read_field_models()?;
    let battle_chars = read_battle_chars()?;
    let field_data = read_field_data()?;
    let data = FF7Data {
        basic,
        field_models,
        battle_chars,
        field_data,
    };

    Ok(data)
}
