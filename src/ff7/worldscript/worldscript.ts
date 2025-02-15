export class WorldScript {
    private opcodes: number[];

    constructor(opcodes: number[]) {
        this.opcodes = opcodes;
    }

    getOpcodes(): number[] {
        return this.opcodes;
    }
} 