#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod commands;
mod ff7;
mod updater;
mod utils;

use utils::process;

fn main() {
    let process_names = vec!["ff7.exe".to_string(), "ff7_en.exe".to_string()];
    process::initialize(process_names);
    println!("FF7 scanner started");

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                updater::update(handle).await.unwrap();
            });
            Ok(())
        })
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(commands::generate_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
