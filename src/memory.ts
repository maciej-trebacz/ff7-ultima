"use strict";

import { invoke } from "@tauri-apps/api/core";

export enum DataType {
  Byte = 0,
  Short = 1,
  Int = 2,
  Float = 3,
  Buffer = 4,
}

export function readMemory(address: number, type: DataType): Promise<number> {
  return new Promise((resolve) => {
    const fns = ["read_memory_byte", "read_memory_short", "read_memory_int", "read_memory_float"];
    const fn = fns[type];
    invoke(fn, { address }).then((state) => {
      resolve(state as number);
    });
  });
}

export function writeMemory(address: number, newValue: number | number[], type: DataType): Promise<void> {
  return new Promise((resolve) => {
    const fns = ["write_memory_byte", "write_memory_short", "write_memory_int", "write_memory_float", "write_memory_buffer"];
    const fn = fns[type];
    const params: any = { address };
    if (type === DataType.Buffer) {
      params.buffer = newValue;
    } else {
      params.newValue = newValue;
    }
    invoke(fn, params).then(() => {
      resolve();
    });
  });
}
