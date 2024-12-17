pub mod addresses;
pub mod ff7text;
pub mod types;

use addresses::FF7Addresses;
use ff7text::decode_text;
use types::*;

use crate::utils::memory::*;

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
            status: read_memory_int(addresses.battle_char_base + i * char_obj_length)?,
            flags: read_memory_byte(addresses.battle_char_base + i * char_obj_length + 0x5)?,
            hp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x2c)?,
            max_hp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x30)?,
            mp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x28)?,
            max_mp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x2a)?,
            atb: read_memory_short(addresses.battle_atb_base + i * 68 + 0x2)?,
            limit: read_memory_byte(addresses.ally_limit + i * 52)?,
            scene_id: 0,
        };
        chars.push(char);
    }
    Ok(chars)
}

fn read_battle_enemies(addresses: &FF7Addresses) -> Result<Vec<BattleCharObj>, String> {
    let mut chars: Vec<BattleCharObj> = Vec::new();
    let char_obj_length = 104;
    let enemy_record_length = 16;
    let enemy_data_length = 184;
    for i in 4..10 {
        let enemy_scene_idx =
            read_memory_byte(addresses.enemy_obj_base + (i - 4) * enemy_record_length).unwrap_or(0);
        let enemy_name =
            read_name(addresses.enemy_data_base + u32::from(enemy_scene_idx) * enemy_data_length);

        let char = BattleCharObj {
            name: enemy_name.unwrap_or_else(|_| String::from("???")),
            status: read_memory_int(addresses.battle_char_base + i * char_obj_length)?,
            flags: read_memory_byte(addresses.battle_char_base + i * char_obj_length + 0x5)?,
            hp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x2c)?,
            max_hp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x30)?,
            mp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x28)?,
            max_mp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x2a)?,
            atb: read_memory_short(addresses.battle_atb_base + i * 68 + 0x2)?,
            limit: 0,
            scene_id: enemy_scene_idx,
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
    for _i in 0..field_model_count {
        let model_name_size = read_memory_short(models_addr + offset)?;
        let model_name = read_memory_buffer(models_addr + offset + 2, model_name_size as usize)?;
        let model_animation_count =
            read_memory_short(models_addr + offset + model_name_size as u32 + 16)?;
        field_model_names.push(String::from_utf8(model_name).unwrap_or(String::from("???")));
        offset += model_name_size as u32 + 48;

        for _j in 0..model_animation_count {
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

fn read_world_current_model(addresses: &FF7Addresses) -> Result<WorldModel, String> {
    let address = read_memory_int(addresses.world_current_obj_ptr)? as u32;
    if address == 0 {
        return Ok(WorldModel {
            x: 0,
            y: 0,
            z: 0,
            direction: 0,
            model_id: 0,
            walkmesh_type: 0,
        });
    }

    Ok(WorldModel {
        x: read_memory_int(address + 0xC)?,
        y: read_memory_int(address + 0x14)?,
        z: read_memory_int(address + 0x10)?,
        direction: read_memory_signed_short(address + 0x40)?,
        model_id: read_memory_byte(address + 0x50)?,
        walkmesh_type: read_memory_byte(address + 0x4a)?,
    })
}

pub fn read_data() -> Result<FF7Data, String> {
    let addresses = FF7Addresses::new();
    let basic = read_basic_data(&addresses)?;
    let field_models = read_field_models(&addresses)?;
    let battle_allies = read_battle_allies(&addresses)?;
    let battle_enemies = read_battle_enemies(&addresses)?;
    let field_data = read_field_data(&addresses)?;
    let world_current_model = read_world_current_model(&addresses)?;

    Ok(FF7Data {
        basic,
        field_models,
        battle_allies,
        battle_enemies,
        field_data,
        world_current_model,
    })
}

fn read_item_names_section(
    items: &mut Vec<String>,
    base_address: u32,
    count: u32,
) -> Result<u32, String> {
    let mut pos = 0;
    for i in 0..count {
        let offset = read_memory_short(base_address + i * 2)? as u16;
        let address = base_address + offset as u32;
        let name = read_name(address).unwrap_or_else(|_| String::from("???"));
        pos = address + name.len() as u32 + 1;
        items.push(name);
    }
    Ok(pos)
}

fn read_item_names(addresses: &FF7Addresses) -> Result<Vec<String>, String> {
    let mut items: Vec<String> = Vec::new();
    let mut addr = addresses.item_names_base;

    let ffnx_check = read_memory_int(addresses.item_names_base)? as u32;
    let mut kernel_sections_tbl: u32 = 0;
    if ffnx_check == 0 {
        let kernel_read_fn_addr = read_memory_int(addresses.kernel_read_fn_call)? as u32
            + addresses.kernel_read_fn_call
            + 4;
        kernel_sections_tbl = read_memory_int(kernel_read_fn_addr + 0x1B)? as u32;
        addr = read_memory_int(kernel_sections_tbl + (4 * 10))? as u32;
    }

    // Items
    addr = read_item_names_section(&mut items, addr, 128)?;

    // Weapons
    if ffnx_check == 0 {
        addr = read_memory_int(kernel_sections_tbl + (4 * 11))? as u32;
    }
    addr = read_item_names_section(&mut items, addr, 128)?;

    // Armors
    if ffnx_check == 0 {
        addr = read_memory_int(kernel_sections_tbl + (4 * 12))? as u32;
    }
    addr = read_item_names_section(&mut items, addr, 32)?;

    // Accessories
    if ffnx_check == 0 {
        addr = read_memory_int(kernel_sections_tbl + (4 * 13))? as u32;
    }
    read_item_names_section(&mut items, addr, 32)?;

    Ok(items)
}

pub fn read_enemy_data(id: u32) -> Result<EnemyData, String> {
    let addresses = FF7Addresses::new();
    let enemy_data_length = 184;
    let enemy_data_addr = addresses.enemy_data_base + id * enemy_data_length;

    let level = read_memory_byte(enemy_data_addr + 0x20)? as u8;
    let speed = read_memory_byte(enemy_data_addr + 0x21)? as u8;
    let luck = read_memory_byte(enemy_data_addr + 0x22)? as u8;
    let evade = read_memory_byte(enemy_data_addr + 0x23)? as u8;
    let strength = read_memory_byte(enemy_data_addr + 0x24)? as u8;
    let magic = read_memory_byte(enemy_data_addr + 0x26)? as u8;

    // Defense and magic defense are multiplied by 2 to get the actual value that the game uses
    let defense = read_memory_byte(enemy_data_addr + 0x25)? as u16 * 2;
    let magic_defense = read_memory_byte(enemy_data_addr + 0x27)? as u16 * 2;

    let gil = read_memory_int(enemy_data_addr + 0xAC)?;
    let exp = read_memory_int(enemy_data_addr + 0xA8)?;
    let ap = read_memory_short(enemy_data_addr + 0x9E)?;
    let back_damage_multiplier = read_memory_byte(enemy_data_addr + 0xA2)? / 8;

    let mut elements: Vec<Elemental> = Vec::new();
    for i in 0..8 {
        let element = read_memory_byte(enemy_data_addr + 0x28 + i)?;
        elements.push(Elemental {
            element,
            effect: read_memory_byte(enemy_data_addr + 0x30 + i)?,
        });
    }

    let status_immunities: u32 = read_memory_int(enemy_data_addr + 0xb0)?;

    let item_names = read_item_names(&addresses)?;
    let mut items: Vec<Item> = Vec::new();
    for i in 0..4 {
        let rate = read_memory_byte(enemy_data_addr + 0x88 + i)? as u8;
        let id = read_memory_short(enemy_data_addr + 0x8c + i * 2)? as u32;

        if id == 0xFFFF {
            break;
        }

        let name = item_names[id as usize].clone();

        // Type is Drop when rate is lower than 128
        let item_type = if rate < 128 {
            ItemType::Drop
        } else {
            ItemType::Steal
        };

        items.push(Item {
            rate: rate % 128,
            name,
            item_type,
        });
    }

    let morph_id = read_memory_short(enemy_data_addr + 0xA0)? as u16;
    let morph = if morph_id == 0xFFFF {
        None
    } else {
        Some(item_names[morph_id as usize].clone())
    };

    Ok(EnemyData {
        level,
        speed,
        luck,
        evade,
        strength,
        defense,
        magic,
        magic_defense,
        gil,
        exp,
        ap,
        back_damage_multiplier,
        elements,
        status_immunities,
        items,
        morph,
    })
}
