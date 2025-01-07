#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod ff7;
mod utils;

use utils::memory;
use utils::process;

use ff7::addresses::FF7Addresses;
use ff7::types::EnemyData;

use tauri_plugin_updater::UpdaterExt;

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
fn write_memory_signed_short(address: u32, new_value: i16) -> Result<(), String> {
    memory::write_memory_signed_short(address, new_value)
}

#[tauri::command]
fn write_memory_int(address: u32, new_value: u32) -> Result<(), String> {
    memory::write_memory_int(address, new_value)
}

#[tauri::command]
fn write_memory_signed_int(address: u32, new_value: i32) -> Result<(), String> {
    memory::write_memory_signed_int(address, new_value)
}

#[tauri::command]
fn write_memory_float(address: u32, new_value: f64) -> Result<(), String> {
    memory::write_memory_float(address, new_value)
}

#[tauri::command]
fn write_memory_buffer(address: u32, buffer: Vec<u8>) -> Result<(), String> {
    memory::write_memory_buffer(address, buffer)
}

#[tauri::command]
fn read_ff7_data() -> Result<ff7::types::FF7Data, String> {
    ff7::read_data()
}

#[tauri::command]
fn read_enemy_data(id: u32) -> Result<EnemyData, String> {
    ff7::read_enemy_data(id)
}

#[tauri::command]
fn set_memory_protection(address: u32, size: usize) -> Result<(), String> {
    memory::set_memory_protection(address, size)
}

#[tauri::command]
fn get_ff7_addresses() -> FF7Addresses {
    FF7Addresses::new()
}

#[tauri::command]
fn get_chocobo_rating_for_scene(scene_id: u32) -> Result<u32, String> {
    ff7::get_chocobo_rating_for_scene(scene_id)
}

fn main() {
    let process_names = vec!["ff7.exe".to_string(), "ff7_en.exe".to_string()];
    process::initialize(process_names);
    println!("FF7 scanner started");

    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                update(handle).await.unwrap();
            });
            Ok(())
        })
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_memory_byte,
            read_memory_short,
            read_memory_int,
            read_memory_float,
            read_memory_buffer,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        let mut downloaded = 0;
        let version = update.version.clone();

        println!("[Updater] update to version {version} available, downloading...");

        update
            .download_and_install(
                |chunk_length, _content_length| {
                    downloaded += chunk_length;
                },
                || {
                    println!("[Updater] download finished");
                },
            )
            .await?;

        println!("[Updater] update installed");
        app.restart();
    } else {
        println!("[Updater] no update available");
    }

    Ok(())
}
