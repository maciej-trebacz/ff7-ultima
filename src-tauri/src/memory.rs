use process_memory::{DataMember, Memory, Pid, TryIntoProcessHandle};
use crate::process;

fn get_process_handle() -> Result<process_memory::ProcessHandle, String> {
    process::get_pid()
        .ok_or_else(|| "No ff7_en.exe process found".to_string())
        .and_then(|pid| {
            (pid.as_u32() as Pid).try_into_process_handle()
                .map_err(|_| "Failed to get process handle".to_string())
        })
}

fn access_memory<T: Copy, F>(address: u32, operation: F) -> Result<T, String>
where
    F: FnOnce(&mut DataMember<T>) -> Result<T, String>,
{
    let handle = get_process_handle()?;
    let mut value = DataMember::<T>::new(handle);
    value.set_offset(vec![address.try_into().unwrap()]);
    operation(&mut value)
}

fn read_memory<T: Copy>(address: u32) -> Result<T, String> {
    access_memory(address, |value| {
        unsafe {
            value.read().map_err(|_| "Could not read memory".to_string())
        }
    })
}

fn write_memory<T: Copy>(address: u32, new_value: T) -> Result<(), String> {
    access_memory(address, |value| {
        value.write(&new_value);
        Ok(new_value)
    })?;
    Ok(())
}

pub fn write_memory_buffer(address: u32, buffer: Vec<u64>) -> Result<(), String> {
    let buffer: Vec<u8> = buffer.into_iter().map(|n| n as u8).collect();
    let handle = get_process_handle()?;
    let mut value = DataMember::<u8>::new(handle);
    
    for (i, &byte) in buffer.iter().enumerate() {
        value.set_offset(vec![(address as usize) + i]);
        value.write(&byte).map_err(|e| format!("Failed to write byte at offset {}: {}", i, e))?;
    }
    Ok(())
}

pub fn read_memory_int(address: u32) -> Result<u32, String> {
  read_memory::<u32>(address)
}

pub fn read_memory_signed_int(address: u32) -> Result<i32, String> {
  read_memory::<i32>(address)
}

pub fn read_memory_short(address: u32) -> Result<u16, String> {
  read_memory::<u16>(address)
}

pub fn read_memory_byte(address: u32) -> Result<u8, String> {
  read_memory::<u8>(address)
}

pub fn read_memory_float(address: u32) -> Result<f64, String> {
  read_memory::<f64>(address)
}

pub fn write_memory_int(address: u32, new_value: u32) -> Result<(), String> {
  write_memory::<u32>(address, new_value)
}

pub fn write_memory_short(address: u32, new_value: u16) -> Result<(), String> {
  write_memory::<u16>(address, new_value)
}

pub fn write_memory_byte(address: u32, new_value: u8) -> Result<(), String> {
  write_memory::<u8>(address, new_value)
}

pub fn write_memory_float(address: u32, new_value: f64) -> Result<(), String> {
  write_memory::<f64>(address, new_value)
}
