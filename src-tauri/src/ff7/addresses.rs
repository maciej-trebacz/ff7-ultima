use serde::Serialize;

#[derive(Serialize)]
pub struct FF7Addresses {
    pub current_module: u32,
    pub game_moment: u32,
    pub field_id: u32,
    pub field_fps: u32,
    pub battle_fps: u32,
    pub world_fps: u32,
    pub in_game_time: u32,
    pub disc_id: u32,
    pub menu_visibility: u32,
    pub menu_locks: u32,
    pub field_movement_disabled: u32,
    pub field_menu_access_enabled: u32,
    pub party_locking_mask: u32,
    pub party_visibility_mask: u32,
    pub gil: u32,
    pub gp: u32,
    pub battle_count: u32,
    pub battle_escape_count: u32,
    pub field_battle_check: u32,
    pub game_obj_ptr: u32,
    pub battle_swirl_check: u32,
    pub instant_atb_check: u32,
    pub unfocus_patch_check: u32,
    pub ffnx_check: u32,
    pub step_id: u32,
    pub step_fraction: u32,
    pub danger_value: u32,
    pub battle_id: u32,
    pub field_num_models: u32,
    pub field_models_ptr: u32,
    pub field_data_ptr: u32,
    pub battle_char_base: u32,
    pub battle_atb_base: u32,
    pub ally_limit: u32,
    pub field_name: u32,
    pub party_member_ids: u32,
    pub party_member_names: u32,
    pub code_cave: u32,
    pub battle_init_chars_fn: u32,
    pub battle_init_chars_call: u32,
    pub enemy_obj_base: u32,
    pub enemy_data_base: u32,
    pub world_current_obj_ptr: u32,
    pub item_names_base: u32,
    pub kernel_read_fn_call: u32,
    pub world_models: u32,
    pub battle_chocobo_rating: u32,

    // Frontend fields
    pub field_obj_ptr: u32,
    pub field_battle_disable: u32,
    pub world_battle_disable: u32,
    pub world_battle_enable: u32,
    pub battle_mode: u32,
    pub battle_end_check: u32,
    pub sound_buffer_focus: u32,
    pub movie_is_playing: u32,
    pub movie_skip: u32,
    pub battle_module_field: u32,
    pub battle_id_world: u32,
    pub world_battle_flag1: u32,
    pub world_battle_flag2: u32,
    pub world_battle_flag3: u32,
    pub world_battle_flag4: u32,
    pub battle_swirl_disable1: u32,
    pub battle_swirl_disable2: u32,
    pub instant_atb_set: u32,
    pub intro_skip: u32,
    pub battle_exp_calc: u32,
    pub battle_ap_calc: u32,
    pub menu_always_enabled: u32,
}

impl FF7Addresses {
    pub fn new() -> Self {
        FF7Addresses {
            current_module: 0xcbf9dc,
            game_moment: 0xdc08dc,
            field_id: 0xcc15d0,
            field_fps: 0xcff890,
            battle_fps: 0x9ab090,
            world_fps: 0xde6938,
            in_game_time: 0xdc08b8,
            disc_id: 0xdc0bdc,
            menu_visibility: 0xdc08f8,
            menu_locks: 0xdc08fa,
            field_movement_disabled: 0xcc0dba,
            field_menu_access_enabled: 0xcc0dbc,
            party_locking_mask: 0xdc0ddc,
            party_visibility_mask: 0xdc0dde,
            gil: 0xdc08b4,
            gp: 0xdc0a26,
            battle_count: 0xdc08f4,
            battle_escape_count: 0xdc08f6,
            field_battle_check: 0x60b40a,
            game_obj_ptr: 0xdb2bb8,
            battle_swirl_check: 0x4027e5,
            instant_atb_check: 0x433abd,
            unfocus_patch_check: 0x74a561,
            ffnx_check: 0x41b965,
            step_id: 0xcc165c,
            step_fraction: 0xcc1664,
            danger_value: 0xcc1668,
            battle_id: 0x9aad3c,
            field_num_models: 0xcff73e,
            field_models_ptr: 0xcff738,
            field_data_ptr: 0xcff594,
            battle_char_base: 0x9ab0dc,
            battle_atb_base: 0x9a8b12,
            ally_limit: 0x9a8dc2,
            field_name: 0xcc1ef0,
            party_member_ids: 0xdc0230,
            party_member_names: 0xdbfd9c,
            code_cave: 0x41be87,
            battle_init_chars_fn: 0x5cf650,
            battle_init_chars_call: 0x437efe,
            enemy_obj_base: 0x9a8794,
            enemy_data_base: 0x9a8e9c,
            world_current_obj_ptr: 0xe3a7d0,
            item_names_base: 0x9a5e54,
            kernel_read_fn_call: 0x419458,
            world_models: 0xe39bc8,
            battle_chocobo_rating: 0xdc0cd8,

            // Frontend fields
            field_obj_ptr: 0xcbf9d8,
            field_battle_disable: 0x60b40a,
            world_battle_disable: 0x7675f6,
            world_battle_enable: 0x767758,
            battle_mode: 0x9aad64,
            battle_end_check: 0x9ab0c2,
            sound_buffer_focus: 0x74a561,
            movie_is_playing: 0x9a1010,
            movie_skip: 0x9a1014,
            battle_module_field: 0xcbf6b8,
            battle_id_world: 0xe3a88c,
            world_battle_flag1: 0xe2bbc8,
            world_battle_flag2: 0x969950,
            world_battle_flag3: 0xe3a884,
            world_battle_flag4: 0xe045e4,
            battle_swirl_disable1: 0x402712,
            battle_swirl_disable2: 0x4027e5,
            instant_atb_set: 0x433abd,
            intro_skip: 0xf4f448,
            battle_exp_calc: 0x43153f,
            battle_ap_calc: 0x431576,
            menu_always_enabled: 0x6ca38c,
        }
    }
}
