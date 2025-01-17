use crate::ff7::addresses::FF7Addresses;
use crate::ff7::data::kernel::read_name;
use crate::ff7::types::battle::{BattleCharObj, EnemyData};
use crate::ff7::types::items::{Item, ItemType};
use crate::ff7::types::kernel::Elemental;
use crate::utils::memory::*;

pub fn read_battle_allies(addresses: &FF7Addresses) -> Result<Vec<BattleCharObj>, String> {
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
            hp: read_memory_int(addresses.battle_char_base + i * char_obj_length + 0x2c)?,
            max_hp: read_memory_int(addresses.battle_char_base + i * char_obj_length + 0x30)?,
            mp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x28)?,
            max_mp: read_memory_short(addresses.battle_char_base + i * char_obj_length + 0x2a)?,
            atb: read_memory_short(addresses.battle_atb_base + i * 68 + 0x2)?,
            limit: read_memory_short(addresses.battle_char_array + i * 0x34 + 0x8)?,
            scene_id: 0,
        };
        chars.push(char);
    }
    Ok(chars)
}

pub fn read_battle_enemies(addresses: &FF7Addresses) -> Result<Vec<BattleCharObj>, String> {
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
            hp: read_memory_int(addresses.battle_char_base + i * char_obj_length + 0x2c)?,
            max_hp: read_memory_int(addresses.battle_char_base + i * char_obj_length + 0x30)?,
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

    let item_names = crate::ff7::data::kernel::read_item_names(&addresses)?;
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
