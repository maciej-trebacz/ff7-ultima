#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use ff7_lib::ff7;
use ff7_lib::ff7::addresses::FF7Addresses;
use ff7_lib::ff7::types::{EnemyData, WorldFieldTblItem};
use ff7_lib::utils::memory;
use ff7_lib::utils::process;
use tauri::ipc::Invoke;
use tauri::Manager;

#[tauri::command]
pub fn read_memory_byte(address: u32) -> Result<u8, String> {
    memory::read_memory_byte(address)
}

#[tauri::command]
pub fn read_memory_short(address: u32) -> Result<u16, String> {
    memory::read_memory_short(address)
}

#[tauri::command]
pub fn read_memory_int(address: u32) -> Result<u32, String> {
    memory::read_memory_int(address)
}

#[tauri::command]
pub fn read_memory_float(address: u32) -> Result<f64, String> {
    memory::read_memory_float(address)
}

#[tauri::command]
pub fn read_memory_buffer(address: u32, size: usize) -> Result<Vec<u8>, String> {
    memory::read_memory_buffer(address, size)
}

#[tauri::command]
pub fn read_memory_signed_short(address: u32) -> Result<i16, String> {
    memory::read_memory_signed_short(address)
}

#[tauri::command]
pub fn read_memory_signed_int(address: u32) -> Result<i32, String> {
    memory::read_memory_signed_int(address)
}

#[tauri::command]
pub fn write_memory_byte(address: u32, new_value: u8) -> Result<(), String> {
    memory::write_memory_byte(address, new_value)
}

#[tauri::command]
pub fn write_memory_short(address: u32, new_value: u16) -> Result<(), String> {
    memory::write_memory_short(address, new_value)
}

#[tauri::command]
pub fn write_memory_signed_short(address: u32, new_value: i16) -> Result<(), String> {
    memory::write_memory_signed_short(address, new_value)
}

#[tauri::command]
pub fn write_memory_int(address: u32, new_value: u32) -> Result<(), String> {
    memory::write_memory_int(address, new_value)
}

#[tauri::command]
pub fn write_memory_signed_int(address: u32, new_value: i32) -> Result<(), String> {
    memory::write_memory_signed_int(address, new_value)
}

#[tauri::command]
pub fn write_memory_float(address: u32, new_value: f64) -> Result<(), String> {
    memory::write_memory_float(address, new_value)
}

#[tauri::command]
pub fn write_memory_buffer(address: u32, buffer: Vec<u8>) -> Result<(), String> {
    memory::write_memory_buffer(address, buffer)
}

#[tauri::command]
pub fn read_ff7_data() -> Result<ff7::FF7Data, String> {
    ff7::read_data()
}

#[tauri::command]
pub fn read_enemy_data(id: u32) -> Result<EnemyData, String> {
    ff7::data::read_enemy_data(id)
}

#[tauri::command]
pub fn set_memory_protection(address: u32, size: usize) -> Result<(), String> {
    memory::set_memory_protection(address, size)
}

#[tauri::command]
pub fn get_ff7_addresses() -> FF7Addresses {
    FF7Addresses::new()
}

#[tauri::command]
pub fn get_chocobo_rating_for_scene(scene_id: u32) -> Result<u32, String> {
    ff7::data::get_chocobo_rating_for_scene(scene_id)
}

#[tauri::command]
pub fn read_item_names() -> Result<Vec<String>, String> {
    ff7::data::read_item_names(&FF7Addresses::new())
}

#[tauri::command]
pub fn read_materia_names() -> Result<Vec<String>, String> {
    ff7::data::read_materia_names(&FF7Addresses::new())
}

#[tauri::command]
pub fn read_key_item_names() -> Result<Vec<String>, String> {
    ff7::data::read_key_item_names(&FF7Addresses::new())
}

#[tauri::command]
pub fn read_world_field_tbl_data() -> Result<Vec<WorldFieldTblItem>, String> {
    ff7::data::world::read_world_field_tbl_data(&FF7Addresses::new())
}

#[tauri::command]
pub fn read_variables_bank(bank: u32) -> Result<Vec<u8>, String> {
    ff7::data::general::read_variables_bank(bank, &FF7Addresses::new())
}

#[tauri::command]
pub fn write_variable_8bit(bank: u32, address: u32, value: u8) -> Result<(), String> {
    ff7::data::general::write_variable_8bit(bank, address, value, &FF7Addresses::new())
}

#[tauri::command]
pub fn write_variable_16bit(bank: u32, address: u32, value: u16) -> Result<(), String> {
    ff7::data::general::write_variable_16bit(bank, address, value, &FF7Addresses::new())
}

#[tauri::command]
pub fn get_current_game_directory() -> Result<String, String> {
    process::get_current_dir().ok_or("Failed to get current directory".to_string())
}

#[tauri::command]
fn show_map_window(app: tauri::AppHandle) {
    app.get_webview_window("mapviewer").unwrap().show().unwrap();
}

pub fn generate_handler() -> impl Fn(Invoke<tauri::Wry>) -> bool + Send + Sync {
    tauri::generate_handler![
        read_memory_byte,
        read_memory_short,
        read_memory_int,
        read_memory_float,
        read_memory_buffer,
        read_memory_signed_short,
        read_memory_signed_int,
        write_memory_byte,
        write_memory_short,
        write_memory_signed_short,
        write_memory_int,
        write_memory_signed_int,
        write_memory_float,
        write_memory_buffer,
        set_memory_protection,
        read_ff7_data,
        get_ff7_addresses,
        read_enemy_data,
        get_chocobo_rating_for_scene,
        read_item_names,
        read_materia_names,
        read_key_item_names,
        read_world_field_tbl_data,
        read_variables_bank,
        write_variable_8bit,
        write_variable_16bit,
        get_current_game_directory,
        show_map_window,
    ]
}
