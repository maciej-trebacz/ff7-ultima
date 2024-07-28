#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ff7;

use tauri::{App, Manager};
use std::slice;
use process_memory::{DataMember, Memory, Pid, TryIntoProcessHandle};
use windows_hotkeys::keys::{ModKey, VKey};
use windows_hotkeys::{HotkeyManager, HotkeyManagerImpl};
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};

struct HotkeyState(Arc<Mutex<HotkeyManager<()>>>);

fn read_memory<T: Copy>(address: u32) -> Result<T, String> {
    match ff7::get_pid() {
        Some(pid) => {
            match (pid.as_u32() as Pid).try_into_process_handle() {
                Ok(handle) => {
                    let mut value = DataMember::<T>::new(handle);
                    value.set_offset(vec![address.try_into().unwrap()]);
                    unsafe { 
                        match value.read() {
                            Ok(read_value) => Ok(read_value),
                            Err(_) => Err("Could not read memory".to_string())
                        }
                    }
                },
                Err(_) => Err("Failed to get process handle".to_string())
            }
        },
        None => Err("Failed to get process ID".to_string())
    }
}

#[tauri::command]
fn read_memory_int(address: u32) -> Result<u32, String> {
    read_memory::<u32>(address)
}

#[tauri::command]
fn read_memory_signed_int(address: u32) -> Result<i32, String> {
    read_memory::<i32>(address)
}

#[tauri::command]
fn read_memory_short(address: u32) -> Result<u16, String> {
    read_memory::<u16>(address)
}

#[tauri::command]
fn read_memory_byte(address: u32) -> Result<u8, String> {
    read_memory::<u8>(address)
}

#[tauri::command]
fn read_memory_float(address: u32) -> Result<f64, String> {
    read_memory::<f64>(address)
}

fn write_memory<T: Copy>(address: u32, new_value: T) -> Result<(), String> {
    if let Some(pid) = ff7::get_pid() {
        let handle = (pid.as_u32() as Pid).try_into_process_handle().unwrap();
        let mut value = DataMember::<T>::new(handle);
        value.set_offset(vec![address.try_into().unwrap()]);
        unsafe { 
            value.write(&new_value);
            Ok(())
        }
    } else {
        Err("No ff7_en.exe process found".to_string())
    }
}

#[tauri::command]
fn write_memory_int(address: u32, new_value: u32) -> Result<(), String> {
    write_memory::<u32>(address, new_value)
}

#[tauri::command]
fn write_memory_short(address: u32, new_value: u16) -> Result<(), String> {
    write_memory::<u16>(address, new_value)
}

#[tauri::command]
fn write_memory_byte(address: u32, new_value: u8) -> Result<(), String> {
    write_memory::<u8>(address, new_value)
}

#[tauri::command]
fn write_memory_float(address: u32, new_value: f64) -> Result<(), String> {
    write_memory::<f64>(address, new_value)
}

#[tauri::command]
fn write_memory_buffer(address: u32, buffer: Vec<u64>) -> Result<(), String> {
    let buffer: Vec<u8> = buffer.into_iter().map(|n| n as u8).collect();
    
    if let Some(pid) = ff7::get_pid() {
        let handle = (pid.as_u32() as Pid).try_into_process_handle().unwrap();
        let mut value = DataMember::<u8>::new(handle);
        
        for (i, &byte) in buffer.iter().enumerate() {
            unsafe {
                value.set_offset(vec![(address as usize) + i]);
                value.write(&byte).map_err(|e| format!("Failed to write byte at offset {}: {}", i, e))?;
            }
        }
        Ok(())
    } else {
        Err("No ff7_en.exe process found".to_string())
    }
}

#[derive(Serialize)]
struct FF7BasicData {
    current_module: u16,
    game_moment: u16,
    field_id: u16,
    field_fps: f64,
    battle_fps: f64,
    world_fps: f64,
    in_game_time: u32,
    disc_id: u8,
    menu_visibility: u16,
    menu_locks: u16,
    field_movement_disabled: u8,
    field_menu_access_enabled: u8,
    party_bitmask: u16,
    gil: u32,
    battle_count: u16,
    battle_escape_count: u16,
    field_battle_check: u32,
    game_obj_ptr: u32,
    battle_swirl_check: u8,
    instant_atb_check: u16,
}

#[derive(Serialize)]
struct FieldModel {
    x: i32,
    y: i32,
    z: i32,
    direction: u8,
}

#[derive(Serialize)]
struct BattleCharObj {
    hp: u16,
    max_hp: u16,
    mp: u16,
    max_mp: u16,
    atb: u16,
    limit: u8,
}

#[derive(Serialize)]
struct FF7Data {
    basic: FF7BasicData,
    field_models: Vec<FieldModel>,
    battle_chars: Vec<BattleCharObj>,
}

macro_rules! read_memory {
    ($($field:ident: $read_fn:ident($addr:expr)),* $(,)?) => {
        {
            let mut data = FF7BasicData {
                $($field: 0 as _,)*
            };
            $(
                data.$field = $read_fn($addr)
                    .map_err(|e| format!("Failed to read {}: {}", stringify!($field), e))?;
            )*
            data
        }
    };
}

fn read_field_models() -> Result<Vec<FieldModel>, String> {
    let mut models: Vec<FieldModel> = Vec::new();
    for i in 0..16 {
        let model_ptr = read_memory_int(0xcff738);
        if let Ok(model_ptr) = model_ptr {
            let base_address = model_ptr + i * 400;
            let x = read_memory_signed_int(base_address + 4);
            let y = read_memory_signed_int(base_address + 8);
            let z = read_memory_signed_int(base_address + 0xc);
            let direction = read_memory_byte(base_address + 0x1c);
            let model = FieldModel {
                x: x.unwrap_or(0),
                y: y.unwrap_or(0),
                z: z.unwrap_or(0),
                direction: direction.unwrap_or(0),
            };
            models.push(model);
        }
    }

    Ok(models)
}

fn read_battle_chars() -> Result<Vec<BattleCharObj>, String> {
    let mut chars: Vec<BattleCharObj> = Vec::new();
    let ally_ptr_base = 0x9ab0dc;
    let char_obj_length = 104;
    let ally_limit_ptr_base = 0x9a8dc2;
    let ally_limit_length = 52;
    for i in 0..3 {
        let char = BattleCharObj {
            hp: read_memory_short(ally_ptr_base + i * char_obj_length + 0x2c)?,
            max_hp: read_memory_short(ally_ptr_base + i * char_obj_length + 0x30)?,
            mp: read_memory_short(ally_ptr_base + i * char_obj_length + 0x28)?,
            max_mp: read_memory_short(ally_ptr_base + i * char_obj_length + 0x2a)?,
            atb: read_memory_short(ally_ptr_base + i * char_obj_length)?,
            limit: read_memory_byte(ally_limit_ptr_base + i * ally_limit_length)?,
        };
        chars.push(char);
    }
    Ok(chars)
}

#[tauri::command]
fn read_ff7_data() -> Result<FF7Data, String> {
    let basic = read_memory!(
        current_module: read_memory_short(0xcbf9dc),
        game_moment: read_memory_short(0xdc08dc),
        field_id: read_memory_short(0xcc15d0),
        field_fps: read_memory_float(0xcff890),
        battle_fps: read_memory_float(0x9ab090),
        world_fps: read_memory_float(0xde6938),
        in_game_time: read_memory_int(0xdc08b8),
        disc_id: read_memory_byte(0xdc08dc),
        menu_visibility: read_memory_short(0xdc08f8),
        menu_locks: read_memory_short(0xdc08fa),
        field_movement_disabled: read_memory_byte(0xcc0dba),
        field_menu_access_enabled: read_memory_byte(0xcc0dbc),
        party_bitmask: read_memory_short(0xdc0dde),
        gil: read_memory_int(0xdc08b4),
        battle_count: read_memory_short(0xdc08f4),
        battle_escape_count: read_memory_short(0xdc08f6),
        field_battle_check: read_memory_int(0x60b40a),
        game_obj_ptr: read_memory_int(0xdb2bb8),
        battle_swirl_check: read_memory_byte(0x4027e5),
        instant_atb_check: read_memory_short(0x433abd),

    );
    let field_models = read_field_models()?;
    let battle_chars = read_battle_chars()?;
    let data = FF7Data {
        basic,
        field_models,
        battle_chars,
    };

    Ok(data)
}


fn main() {
    ff7::initialize();
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
