import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from 'react';

export interface FF7Addresses {
  current_module: number;
  game_moment: number;
  field_id: number;
  field_fps: number;
  battle_fps: number;
  world_fps: number;
  in_game_time: number;
  disc_id: number;
  menu_visibility: number;
  menu_locks: number;
  field_movement_disabled: number;
  field_menu_access_enabled: number;
  party_locking_mask: number;
  party_visibility_mask: number;
  gil: number;
  gp: number;
  battle_count: number;
  battle_escape_count: number;
  field_battle_check: number;
  game_obj_ptr: number;
  battle_swirl_check: number;
  instant_atb_check: number;
  unfocus_patch_check: number;
  ffnx_check: number;
  step_id: number;
  step_fraction: number;
  danger_value: number;
  battle_id: number;
  field_models_ptr: number;
  field_data_ptr: number;
  battle_char_base: number;
  ally_limit: number;
  field_name: number;
  field_obj_ptr: number;
  field_battle_disable: number;
  world_battle_disable: number;
  world_battle_enable: number;
  battle_mode: number;
  battle_end_check: number;
  sound_buffer_focus: number;
  movie_is_playing: number;
  movie_skip: number;
  battle_module_field: number;
  battle_id_world: number;
  world_battle_flag1: number;
  world_battle_flag2: number;
  world_battle_flag3: number;
  world_battle_flag4: number;
  battle_swirl_disable1: number;
  battle_swirl_disable2: number;
  instant_atb_set: number;
  battle_atb_base: number;
  intro_skip: number;
  code_cave: number;
  battle_init_chars_fn: number;
  battle_init_chars_call: number;
  battle_exp_calc: number;
  battle_ap_calc: number;
  world_current_obj_ptr: number;
  world_models: number;
  menu_always_enabled: number;
  world_zoom_tilt_enabled: number;
  world_zoom: number;
  world_tilt: number;
  world_speed_multiplier: number;
  field_global_obj: number;
  world_mode: number;
}

export function useFF7Addresses() {
  const [addresses, setAddresses] = useState<FF7Addresses | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAddresses() {
      try {
        const fetchedAddresses: FF7Addresses = await invoke("get_ff7_addresses");
        setAddresses(fetchedAddresses);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    }

    fetchAddresses();
  }, []);

  return { addresses, isLoading, error };
}
