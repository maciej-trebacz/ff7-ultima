use crate::ff7::addresses::FF7Addresses;
use crate::ff7::types::basic::FF7BasicData;
use crate::utils::memory::*;

pub fn read_basic_data(addresses: &FF7Addresses) -> Result<FF7BasicData, String> {
    let party_member_ids_vec = vec![
        read_memory_byte(addresses.party_member_ids)?,
        read_memory_byte(addresses.party_member_ids + 1)?,
        read_memory_byte(addresses.party_member_ids + 2)?,
    ];

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
        party_locking_mask: read_memory_short(addresses.party_locking_mask)?,
        party_visibility_mask: read_memory_short(addresses.party_visibility_mask)?,
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
        exp_multiplier: read_memory_byte(addresses.battle_exp_calc + 8)?,
        ap_multiplier: read_memory_byte(addresses.battle_ap_calc + 2)?,
        battle_chocobo_rating: read_memory_byte(addresses.battle_chocobo_rating)?,
        menu_always_enabled: read_memory_byte(addresses.menu_always_enabled)?,
        world_zoom_tilt_enabled: read_memory_byte(addresses.world_zoom_tilt_enabled)?,
        world_zoom: read_memory_short(addresses.world_zoom)?,
        world_tilt: read_memory_short(addresses.world_tilt)?,
        world_speed_multiplier: read_memory_byte(addresses.world_speed_multiplier)?,
        party_member_ids: party_member_ids_vec,
        key_items: read_memory_buffer(addresses.key_items, 8)?,
    })
}
