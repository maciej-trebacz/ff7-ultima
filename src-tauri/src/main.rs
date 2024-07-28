#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ff7;
mod memory;
mod process;

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

fn main() {
    process::initialize("ff7_en.exe");
    println!("FF7 scanner started");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_memory_byte,
            read_memory_short,
            read_memory_int,
            read_memory_float,
            write_memory_byte,
            write_memory_short,
            write_memory_int,
            write_memory_float,
            write_memory_buffer,
            read_ff7_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}
