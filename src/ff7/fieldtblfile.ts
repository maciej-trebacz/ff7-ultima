import {Parser} from 'binary-parser';

const fieldEntryInfo = new Parser()
    .uint16le('x')
    .uint16le('y')
    .uint16le('triangle')
    .uint16le('fieldId')
    .uint8('direction')
    .array('padding', {type: 'uint8', length: 3})
    
const fieldEntry = new Parser()
    .nest('default', {type: fieldEntryInfo})
    .nest('alternative', {type: fieldEntryInfo})

const fieldTblParser = new Parser()
    .array('entries', {
        type: fieldEntry,
        length: 64
    })

export class FieldTblFile {
    data: any;

    constructor(data: Uint8Array) {
        this.data = fieldTblParser.parse(data);
    }

    getEntry(id: number) {
        if (id < 1 || id > 64) throw Error('ID must be in the range of 1–64.')
        return this.data[id - 1];
    }

    setEntry(id: number, data: any) {
        if (id < 1 || id > 64) throw Error('ID must be in the range of 1–64.')
        this.data[id - 1] = data;
    }

    writeFile() {
        const out = new Uint8Array(0x600);
        const view = new DataView(out.buffer);

        function writeEntry(view: DataView, offset: number, entry: any) {
            view.setUint16(offset, entry.x, true);
            view.setUint16(offset + 2, entry.y, true);
            view.setUint16(offset + 4, entry.triangle, true);
            view.setUint16(offset + 6, entry.fieldId, true);
            view.setUint8(offset + 8, entry.direction);
            view.setUint8(offset + 9, entry.direction); // original game files repeat the direction 4 times
            view.setUint8(offset + 10, entry.direction);
            view.setUint8(offset + 11, entry.direction);
        }

        for (let i = 0; i < 64; i++) {
            const entry = this.data[i];
            writeEntry(view, i * 24, entry.default);
            writeEntry(view, i * 24 + 12, entry.alternative);
        }

        return out;
    }
}