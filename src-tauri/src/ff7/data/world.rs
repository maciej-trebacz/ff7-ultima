use crate::ff7::addresses::FF7Addresses;
use crate::ff7::types::world::WorldModel;
use crate::utils::memory::*;

pub fn read_world_current_model(addresses: &FF7Addresses) -> Result<WorldModel, String> {
    let address = read_memory_int(addresses.world_current_obj_ptr)? as u32;
    if address == 0 {
        return Ok(WorldModel {
            index: 0,
            x: 0,
            y: 0,
            z: 0,
            direction: 0,
            model_id: 0,
            walkmesh_type: 0,
            location_id: 0,
            chocobo_tracks: false,
        });
    }

    let triangle_ptr = read_memory_int(address + 0x60)? as u32;
    let mut location_id = 255;
    if triangle_ptr != 0 {
        location_id = ((read_memory_byte(triangle_ptr + 0xb)? as u8) & 0x7f) >> 1;
    }

    Ok(WorldModel {
        index: 0,
        x: read_memory_int(address + 0xC)?,
        y: read_memory_signed_int(address + 0x10)?,
        z: read_memory_int(address + 0x14)?,
        direction: read_memory_signed_short(address + 0x40)?,
        model_id: read_memory_byte(address + 0x50)?,
        walkmesh_type: read_memory_byte(address + 0x4a)?,
        location_id,
        chocobo_tracks: (read_memory_byte(address + 0x4b)? >> 7 & 1) != 0,
    })
}

pub fn read_world_models(addresses: &FF7Addresses) -> Result<Vec<WorldModel>, String> {
    let mut models: Vec<WorldModel> = Vec::new();
    let model_record_length = 192;

    for i in 0..16 {
        let model_check =
            read_memory_int(addresses.world_models + i * model_record_length + 188)? as u32;
        if model_check == 0 {
            continue;
        }

        let model = WorldModel {
            index: i as u8,
            x: read_memory_int(addresses.world_models + i * model_record_length + 0xC)?,
            y: read_memory_signed_int(addresses.world_models + i * model_record_length + 0x10)?,
            z: read_memory_int(addresses.world_models + i * model_record_length + 0x14)?,
            direction: read_memory_signed_short(
                addresses.world_models + i * model_record_length + 0x40,
            )?,
            model_id: read_memory_byte(addresses.world_models + i * model_record_length + 0x50)?,
            walkmesh_type: 0,
            location_id: 0,
            chocobo_tracks: false,
        };
        models.push(model);
    }
    Ok(models)
}

pub fn get_chocobo_rating_for_scene(scene_id: u32) -> Result<u32, String> {
    let addresses = FF7Addresses::new();
    let chocobo_ratings_base = addresses.world_enc_w_bin_data + 0x20;

    for i in 0..32 {
        let scene_id_from_memory = read_memory_byte(chocobo_ratings_base + i * 4)? as u32;
        if scene_id_from_memory == scene_id {
            return Ok(read_memory_byte(chocobo_ratings_base + i * 4 + 2)? as u32);
        }
    }

    Ok(0)
}
