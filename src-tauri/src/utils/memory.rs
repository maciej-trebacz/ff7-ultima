use crate::process;
use process_memory::{CopyAddress, DataMember, Memory, Pid, PutAddress, TryIntoProcessHandle};
use winapi::um::memoryapi::VirtualProtectEx;
use winapi::um::winnt::{PAGE_READWRITE, PVOID};

fn get_process_handle() -> Result<process_memory::ProcessHandle, String> {
    process::get_pid()
        .ok_or_else(|| "Process not found".to_string())
        .and_then(|pid| {
            (pid.as_u32() as Pid)
                .try_into_process_handle()
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
    access_memory(address, |value| unsafe {
        value
            .read()
            .map_err(|_| format!("Could not read memory at address 0x{:08X}", address))
    })
}

fn write_memory<T: Copy>(address: u32, new_value: T) -> Result<(), String> {
    access_memory(address, |value| {
        let _ = value.write(&new_value);
        Ok(new_value)
    })?;
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

pub fn read_memory_signed_short(address: u32) -> Result<i16, String> {
    read_memory::<i16>(address)
}

pub fn read_memory_byte(address: u32) -> Result<u8, String> {
    read_memory::<u8>(address)
}

pub fn read_memory_float(address: u32) -> Result<f64, String> {
    read_memory::<f64>(address)
}

pub fn read_memory_buffer(address: u32, size: usize) -> Result<Vec<u8>, String> {
    let handle = get_process_handle()?;
    let mut buf = vec![0u8; size];
    handle.copy_address(address as usize, &mut buf)
        .map_err(|_| format!("Could not read {} bytes at address 0x{:08X}", size, address))?;
    Ok(buf)
}

pub fn write_memory_buffer(address: u32, mut buffer: Vec<u8>) -> Result<(), String> {
    let handle = get_process_handle()?;
    handle.put_address(address as usize, &mut buffer);
    Ok(())
}

pub fn write_memory_int(address: u32, new_value: u32) -> Result<(), String> {
    write_memory::<u32>(address, new_value)
}

pub fn write_memory_short(address: u32, new_value: u16) -> Result<(), String> {
    write_memory::<u16>(address, new_value)
}

pub fn write_memory_signed_short(address: u32, new_value: i16) -> Result<(), String> {
    write_memory::<i16>(address, new_value)
}

pub fn write_memory_byte(address: u32, new_value: u8) -> Result<(), String> {
    write_memory::<u8>(address, new_value)
}

pub fn write_memory_float(address: u32, new_value: f64) -> Result<(), String> {
    write_memory::<f64>(address, new_value)
}

pub fn set_memory_protection(address: u32, size: usize) -> Result<(), String> {
    let handle = get_process_handle()?;
    let mut old_protect = 0;

    let result = unsafe {
        VirtualProtectEx(
            handle.0,
            address as PVOID,
            size,
            PAGE_READWRITE,
            &mut old_protect,
        )
    };

    if result == 0 {
        Err("Failed to change memory protection".to_string())
    } else {
        Ok(())
    }
}
