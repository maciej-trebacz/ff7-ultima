#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod commands;
mod updater;
mod logging;

use ff7_lib::utils::process;
use tauri_plugin_window_state::StateFlags;

fn main() {
    let process_names = vec!["ff7.exe".to_string(), "ff7_en.exe".to_string()];
    process::initialize(process_names);
    println!("FF7 scanner started");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().with_state_flags(StateFlags::all() & !StateFlags::VISIBLE).build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            logging::setup_logging(&handle)?;
            log::info!(target: "app::init", "Application started");
            Ok(())
        })
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(commands::generate_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
