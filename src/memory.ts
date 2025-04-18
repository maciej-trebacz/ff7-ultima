"use strict";

import { invoke } from "@tauri-apps/api/core";

export enum DataType {
  Byte = 0,
  Short = 1,
  Int = 2,
  Float = 3,
  Buffer = 4,
  SignedShort = 5,
  SignedInt = 6
}

export function readMemory(address: number, type: DataType): Promise<number> {
  return new Promise((resolve, reject) => {
    const fns = ["read_memory_byte", "read_memory_short", "read_memory_int", "read_memory_float", "read_memory_buffer", "read_memory_signed_short", "read_memory_signed_int"];
    const fn = fns[type];
    invoke(fn, { address }).then((state) => {
      resolve(state as number);
    }).catch((error) => {
      console.error("Error reading memory", error);
      reject(error);
    });
  });
}

export function readMemoryBuffer(address: number, size: number): Promise<number[]> {
  return new Promise((resolve, reject) => {
    invoke("read_memory_buffer", { address, size }).then((state) => {
      resolve(state as number[]);
    }).catch((error) => {
      console.error("Error reading memory buffer", error);
      reject(error);
    });
  });
}

export function writeMemory(address: number, newValue: number | number[], type: DataType): Promise<void> {
  return new Promise((resolve, reject) => {
    const fns = ["write_memory_byte", "write_memory_short", "write_memory_int", "write_memory_float", "write_memory_buffer", "write_memory_signed_short", "write_memory_signed_int"];
    const fn = fns[type];
    const params: any = { address };
    if (type === DataType.Buffer) {
      params.buffer = newValue;
    } else {
      params.newValue = newValue;
    }
    invoke(fn, params).then(() => {
      resolve();
    }).catch((error) => {
      console.error("Error writing memory", error);
      reject(error);
    });
  });
}

export function setMemoryProtection(address: number, size: number): Promise<void> {
  return new Promise((resolve, reject) => {
    invoke("set_memory_protection", { address, size }).then(() => {
      resolve();
    }).catch((error) => {
      console.error("Error setting memory protection", error);
      reject(error);
    });
  });
}
