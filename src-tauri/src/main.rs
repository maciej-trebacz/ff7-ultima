#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ff7;
mod memory;
mod process;
mod addresses;

#[tauri::command]
fn read_memory_byte(address: u32) -> Result<u8, String> {
    memory::read_memory_byte(address)
}

#[tauri::command]
fn read_memory_short(address: u32) -> Result<u16, String> {
    memory::read_memory_short(address)
}

#[tauri::command]
fn read_memory_int(address: u32) -> Result<u32, String> {
    memory::read_memory_int(address)
}

#[tauri::command]
fn read_memory_float(address: u32) -> Result<f64, String> {
    memory::read_memory_float(address)
}

#[tauri::command]
fn read_memory_buffer(address: u32, size: usize) -> Result<Vec<u8>, String> {
    memory::read_memory_buffer(address, size)
}

#[tauri::command]
fn write_memory_byte(address: u32, new_value: u8) -> Result<(), String> {
    memory::write_memory_byte(address, new_value)
}

#[tauri::command]
fn write_memory_short(address: u32, new_value: u16) -> Result<(), String> {
    memory::write_memory_short(address, new_value)
}

#[tauri::command]
fn write_memory_int(address: u32, new_value: u32) -> Result<(), String> {
    memory::write_memory_int(address, new_value)
}

#[tauri::command]
fn write_memory_float(address: u32, new_value: f64) -> Result<(), String> {
    memory::write_memory_float(address, new_value)
}

#[tauri::command]
fn write_memory_buffer(address: u32, buffer: Vec<u64>) -> Result<(), String> {
    memory::write_memory_buffer(address, buffer)
}

#[tauri::command]
fn read_ff7_data() -> Result<ff7::FF7Data, String> {
    ff7::read_data()
}

#[tauri::command]
fn set_memory_protection(address: u32, size: usize) -> Result<(), String> {
    memory::set_memory_protection(address, size)
}

#[tauri::command]
fn get_ff7_addresses() -> addresses::FF7Addresses {
    addresses::FF7Addresses::new()
}

fn main() {
    let process_names = vec!["ff7.exe".to_string(), "ff7_en.exe".to_string()];
    process::initialize(process_names);
    println!("FF7 scanner started");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_memory_byte,
            read_memory_short,
            read_memory_int,
            read_memory_float,
            read_memory_buffer,
            write_memory_byte,
            write_memory_short,
            write_memory_int,
            write_memory_float,
            write_memory_buffer,
            set_memory_protection,
            read_ff7_data,
            get_ff7_addresses
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}
