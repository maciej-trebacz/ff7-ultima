import { swap16 } from "./endian";

// FF Text encoder/decoder
// Partially ported by mav from Python source by Niema Moshiri
// https://github.com/niemasd/PyFF7

const CHARS = {
    'NORMAL': 
        " !\"#$%&'()*+,-./01234" +
        "56789:;<=>?@ABCDEFGHI" +
        "JKLMNOPQRSTUVWXYZ[\\]^" +
        "_`abcdefghijklmnopqrs" +
        "tuvwxyz{|}~ ÄÅÇÉÑÖÜáà" +
        "âäãåçéèêëíìîïñóòôöõúù" +
        "ûü♥°¢£↔→♪ßα  ´¨≠ÆØ∞±≤" +
        "≥¥µ∂ΣΠπ⌡ªºΩæø¿¡¬√ƒ≈∆«" +
        "»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄ ‹" +
        "›ﬁﬂ■‧‚„‰ÂÊÁËÈÍÎÏÌÓÔ Ò" +
        "ÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ       ",
    'FIELD_SPECIAL': {
        0xE0: "{CHOICE}",
        0xE1: "\t",
        0xE2: ", ",
        0xE3: '."',
        0xE4: '…"',
        0xE6: "⑬",
        0xE7: "\n",
        0xE8: "{NEWPAGE}",
        0xEA: "{CLOUD}",
        0xEB: "{BARRET}",
        0xEC: "{TIFA}",
        0xED: "{AERITH}",
        0xEE: "{RED XIII}",
        0xEF: "{YUFFIE}",
        0xF0: "{CAIT SITH}",
        0xF1: "{VINCENT}",
        0xF2: "{CID}",
        0xF3: "{PARTY #1}",
        0xF4: "{PARTY #2}",
        0xF5: "{PARTY #3}",
        0xF6: "〇", 
        0xF7: "△", 
        0xF8: "☐", 
        0xF9: "✕", 
    },
    'FIELD_CONTROL': {
        0xD2: "{GRAY}",
        0xD3: "{BLUE}",
        0xD4: "{RED}",
        0xD5: "{PURPLE}",
        0xD6: "{GREEN}",
        0xD7: "{CYAN}",
        0xD8: "{YELLOW}",
        0xD9: "{WHITE}",
        0xDA: "{FLASH}",
        0xDB: "{RAINBOW}",
        0xDC: "{PAUSE}",
        0xDE: "{NUM}",  
        0xDF: "{HEX}",  
        0xE0: "{SCROLL}",
        0xE1: "{RNUM}",  
        0xE9: "{FIXED}", 
    },
    'ESCAPE': '\\{}'
}

const fieldCommands = Object.assign({}, ...Object.entries({...CHARS.FIELD_CONTROL, ...CHARS.FIELD_SPECIAL}).map(([a,b]) => ({ [b]: a })))

export const decodeText = function(buf: Uint8Array): Uint8Array {
    let text = '';
    let i = 0;

    while (i < buf.length) {
        const c = buf[i];
        i++;

        // End of string
        if (c === 0xFF) break;
        
        // Printable character
        else if (c < 0xE0) {
            const t = CHARS.NORMAL[c];
            if (CHARS.ESCAPE.includes(t)) text += '\\';
            text += t;
        }

        // Field control code
        else if (c === 0xFE) {
            if (i > buf.length) throw Error("Spurious control code at end of string");
            const k = buf[i];
            i++;

            // WAIT <arg> command
            if (k === 0xDD) {
                const arg = new DataView(buf.buffer).getUint16(i, true);
                i += 2;
                text += `{WAIT ${arg}}`
            }

            // STR {offset} {length} command
            else if (k === 0xE2) {
                const offset = new DataView(buf.buffer).getUint16(i, true);
                i += 2;
                const length = new DataView(buf.buffer).getUint16(i, true);
                i += 2;
                text += `{STR ${offset} ${length}}`
            }

            // Other control codes
            else {
                if (!CHARS.FIELD_CONTROL[k as keyof typeof CHARS.FIELD_CONTROL]) throw Error (`Illegal control code ${k}`)
                text += CHARS.FIELD_CONTROL[k as keyof typeof CHARS.FIELD_CONTROL]
            }
        }

        // Field special character
        else {
            text += CHARS.FIELD_SPECIAL[c as keyof typeof CHARS.FIELD_SPECIAL];
            if (c === 0xE8) text += "\n";
        }
    }

    return new TextEncoder().encode(text);
}

export const encodeText = function(text: string): Uint8Array {
    let data: number[] = [];
    let i = 0;

    while (i < text.length) {
        let c = text[i++];

        // escape sequence
        if (c == '\\') {
            if (i >= text.length) throw Error ('Spurious \'\\\' at the end of string: ' + text);
            c = text[i++];
            data.push(CHARS.NORMAL.indexOf(c));
        }

        // command sequence
        else if (c === '{') {
            const end = text.indexOf('}', i)
            if (end === -1) throw Error ('Mismatched {} in string: ' + text)
            const command = text.substring(i, end)
            const keyword = command.split(" ")[0]
            i = end + 1
            if (keyword === 'WAIT') {
                const m = /WAIT (\d+)/.exec(command)
                if (!m) throw Error (`Syntax error in command ${command} in string: ${text}`)
                const arg = parseInt(m[1])
                if (arg < 0 || arg > 0xFFFF) throw Error (`Invalid value for WAIT argument in command ${command}, has to be in range 0-65535 in string: ${text}`)
                data.push(0xFE, 0xDD, ...new Uint8Array(new Uint16Array([swap16(arg)]).buffer))
            }
            else if (keyword === 'STR') {
                const m = /STR ([a-fA-F0-9]{4}) ([a-fA-F0-9]{4})/.exec(command)
                if (!m) throw Error (`Syntax error in command ${command} in string: ${text}`)
                const offset = parseInt(m[1], 16)
                const length = parseInt(m[2], 16)
                data.push(0xFE, 0xE2, ...new Uint8Array(new Uint16Array([swap16(offset), swap16(length)]).buffer))
            }
            else {
                const code = fieldCommands[`{${command}}`];
                if (code) {
                    if (Object.values(CHARS.FIELD_CONTROL).includes(`{${command}}`)) data.push(0xFE);
                    data.push(code);
                    // Skip extra newline character after NEW command
                    if (command === 'NEWPAGE') {
                        if (i < text.length && text[i] === '\n') i++;
                    }
                } else throw Error (`Unknown command ${command} in string: ${text}`)
            }
        }

        else {
            if (c in fieldCommands) {
                const code = fieldCommands[c];
                data.push(code);
            } else if (CHARS.NORMAL.indexOf(c) >= 0) {
                data.push(CHARS.NORMAL.indexOf(c));
            } else throw Error (`Unencodable character '${c}' in string: ${text}`)
        }
    }

    data.push(0xFF)
    return new Uint8Array(data);
}