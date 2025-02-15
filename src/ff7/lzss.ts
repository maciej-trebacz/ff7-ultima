// LZSS encoder/decoder
// Ported by mav from Python source by Niema Moshiri
// https://github.com/niemasd/PyFF7

const MIN_REF_LEN = 3;
const MAX_REF_LEN = 18;
const LEFT_NIBBLE_MASK = 0b11110000;
const RIGHT_NIBBLE_MASK = 0b00001111;
const WINDOW_MASK = 0x0FFF;
const WINDOW_SIZE = 0x1000;
const REF_SIZE = 2;

type DictionaryEntry = { [key: string]: number };
type ReverseEntry = { [key: number]: string };

// Helper function to convert Uint8Array to hex string
function toHex(arr: Uint8Array): string {
    return Array.from(arr)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

class Dictionary {
    private ptr: number;
    private d: DictionaryEntry[];
    private r: ReverseEntry[];

    constructor(ptr: number) {
        this.ptr = ptr;
        // Seed dictionary arrays with empty objects
        this.d = new Array(MAX_REF_LEN + 1).fill(null).map(() => ({}));
        this.r = new Array(MAX_REF_LEN + 1).fill(null).map(() => ({}));
    }

    add(bytes: Uint8Array | string, hex: boolean = false): void {
        // Because original source worked on string-like byte arrays we're using hex arrays here
        // This means string lengths are multiplied by 2
        const s = hex ? bytes as string : toHex(bytes as Uint8Array);
        for (let length = MIN_REF_LEN; length < Math.min(s.length / 2, MAX_REF_LEN); length++) {
            const substr = s.substr(0, length * 2);

            if (this.d[length][substr] in this.r[length]) {
                delete this.r[length][this.d[length][substr]];
            }

            if (this.r[length][this.ptr] in this.d[length]) {
                delete this.d[length][this.r[length][this.ptr]];
            }

            this.d[length][substr] = this.ptr;
            this.r[length][this.ptr] = substr;
        }

        this.ptr = (this.ptr + 1) & WINDOW_MASK;
    }

    find(bytes: Uint8Array): [number, number] | null {
        // See the note above about working with hex strings
        const s = toHex(bytes);
        for (let length = Math.min(MAX_REF_LEN, s.length / 2); length > MIN_REF_LEN - 1; length--) {
            const substr = s.substr(0, length * 2);
            if (substr in this.d[length]) {
                const offset = this.d[length][substr];
                if (offset !== this.ptr) {
                    return [offset, length];
                }
            }
        }

        return null;
    }
}

export class Lzss {
    // Converts a control byte to array of boolean values (true - literal byte, false - reference)
    private getFlags(control: number): boolean[] {
        return Array.from({ length: 8 }).map((_, index) => Boolean(control & (1 << index)));
    }

    // Converts a 2-byte reference to [offset, length] pair
    private convertReference(ref: Uint8Array): [number, number] {
        if (ref.length === 1) {
            return [
                (ref[0] & RIGHT_NIBBLE_MASK) + MIN_REF_LEN,
                (ref[0] & LEFT_NIBBLE_MASK) >> 4
            ];
        } else if (ref.length !== REF_SIZE) {
            throw new Error(`Reference must be ${REF_SIZE} bytes, but it was ${ref.length} bytes.`);
        } else {
            const offset = ((ref[1] & LEFT_NIBBLE_MASK) << 4) | ref[0];
            const length = (ref[1] & RIGHT_NIBBLE_MASK) + MIN_REF_LEN;
            return [offset, length];
        }
    }

    // Converts a raw offset to real offset
    private correctOffset(rawOffset: number, tail: number): number {
        return tail - ((tail - MAX_REF_LEN - rawOffset) & WINDOW_MASK);
    }

    decompress(data: Uint8Array): Uint8Array {
        let inpos = 0;
        let out: number[] = [];

        while (inpos < data.length) {
            const flags = this.getFlags(data[inpos++]);
            let chunk: number[] = [];
            for (const flag of flags) {
                if (inpos >= data.length)
                    break;
                if (flag)
                    out.push(data[inpos++]);
                else {
                    const [offset, length] = this.convertReference(data.slice(inpos, inpos + REF_SIZE));
                    inpos += REF_SIZE;
                    let pos = this.correctOffset(offset, out.length);
                    if (pos < 0) {
                        chunk = Array(Math.min(Math.abs(pos), length)).fill(0);
                        pos += chunk.length;
                    } else
                        chunk = [];

                    chunk = chunk.concat(out.slice(pos, pos + length - chunk.length));
                    out = out.concat(chunk);
                    for (let i = chunk.length; i < length; i++) {
                        if (chunk.length === 0)
                            out.push(0);
                        else
                            out.push(chunk[i % chunk.length]);
                    }
                }
            }
        }

        return Uint8Array.from(out);
    }

    compress(data: Uint8Array): Uint8Array {
        const dictionary = new Dictionary(WINDOW_SIZE - 2 * MAX_REF_LEN);

        // Prime the dictionary
        for (let i = 0; i < MAX_REF_LEN; i++) {
            const primeData = new Uint8Array(MAX_REF_LEN - i);
            dictionary.add(new Uint8Array([...primeData, ...data.slice(0, i)]));
        }

        let out: number[] = [];
        let i = 0;
        while (i < data.length) {
            let chunk: number[] = [];
            let flags = 0;
            for (let bit = 0; bit < 8; bit++) {
                if (i >= data.length)
                    break;

                const found = dictionary.find(data.slice(i, i + MAX_REF_LEN));
                if (found) {
                    const [offset, length] = found;
                    chunk = chunk.concat([offset & 0xFF, (((offset >> 4) & 0xF0) | (length - MIN_REF_LEN))]);
                    for (let j = 0; j < length; j++) {
                        dictionary.add(data.slice(i + j, i + j + MAX_REF_LEN));
                    }
                    i += length;
                } else {
                    chunk.push(data[i]);
                    flags |= (1 << bit);
                    dictionary.add(data.slice(i, i + MAX_REF_LEN));
                    i += 1;
                }
            }
            out.push(flags);
            out = out.concat(chunk);
        }

        return Uint8Array.from(out);
    }
}
