import { Parser } from 'binary-parser';
import { WorldScript } from './worldscript/worldscript';

const opcodes = new Parser()
    .array('', {
        type: 'uint16le',
        readUntil: function(byte: number): boolean {
            return byte === 0x203;
        }        
    });

const fn = new Parser()
    .uint16le('header')
    .uint16le('offset')
    .pointer('opcodes', {
        type: opcodes,
        offset: function(item): number {
            return 0x400 + (item.offset * 2);
        }
    });

const evParser = new Parser()
    .uint32le('dummyfn')
    .array('functions', {
        type: fn,
        length: 0x1ff
    });

interface AbstractFunction {
    header: number;
    offset: number;
    id?: number;
    opcodes?: number[];
    script: WorldScript;
}

interface SystemFunction extends AbstractFunction {
    type: 'system';
}

interface ModelFunction extends AbstractFunction {
    type: 'model';
    modelId: number;
}

interface MeshFunction extends AbstractFunction {
    type: 'mesh';
    x: number;
    y: number;
}

type FF7Function = SystemFunction | ModelFunction | MeshFunction;

enum FunctionType {
    System = 0,
    Model = 1,
    Mesh = 2,
}

export class EvFile {
    functions: FF7Function[];

    constructor(data: Uint8Array) {
        const parsedData = evParser.parse(data);
        this.functions = [];

        const addFn = (data: Partial<FF7Function>): void => {
            const originalFn = this.functions.find(func => func.offset === data.offset);
            if (originalFn) {
                data.offset = originalFn.offset;
                delete data.opcodes;
            } else {
                data.script = new WorldScript(data.opcodes!);
                delete data.opcodes;
            }
            this.functions.push(data as FF7Function);
        }

        parsedData.functions.forEach((fn: FF7Function) => {
            const type: FunctionType = fn.header >> 14;
            if (type === FunctionType.System) {
                addFn({
                    type: 'system',
                    id: fn.header & 0xFF,
                    offset: fn.offset,
                    opcodes: fn.opcodes,
                });
            }
            else if (type === FunctionType.Model) {
                addFn({
                    type: 'model',
                    id: fn.header & 0xFF,
                    modelId: (fn.header >> 8) & 0x3F,
                    offset: fn.offset,
                    opcodes: fn.opcodes,
                });
            }
            else if (type === FunctionType.Mesh) {
                const meshCoords = (fn.header >> 4) & 0x3FF;
                addFn({
                    type: 'mesh',
                    id: fn.header & 0xF,
                    x: meshCoords / 36,
                    y: meshCoords % 36,
                    offset: fn.offset,
                    opcodes: fn.opcodes,
                });
            }
        });
    }

    getSystemFunctions(): SystemFunction[] {
        return this.functions.filter((fn): fn is SystemFunction => fn.type === "system");
    }

    getModelFunctions(): ModelFunction[] {
        return this.functions.filter((fn): fn is ModelFunction => fn.type === "model");
    }

    getMeshFunctions(): MeshFunction[] {
        return this.functions.filter((fn): fn is MeshFunction => fn.type === "mesh");
    }
}