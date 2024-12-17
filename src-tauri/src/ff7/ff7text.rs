use std::collections::HashMap;

struct Chars {
    normal: String,
    field_special: HashMap<u8, &'static str>,
    field_control: HashMap<u8, &'static str>,
    escape: &'static str,
}

impl Chars {
    fn new() -> Self {
        let normal = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~ ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü♥°¢£↔→♪ßα  ´¨≠ÆØ∞±≤≥¥µ∂ΣΠπ⌡ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄ ‹›ﬁﬂ■‧‚„‰ÂÊÁËÈÍÎÏÌÓÔ ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ       ".to_string();

        let mut field_special = HashMap::new();
        field_special.insert(0xE0, "{CHOICE}");
        field_special.insert(0xE1, "\t");
        field_special.insert(0xE2, ", ");
        field_special.insert(0xE3, ".");
        field_special.insert(0xE4, "…");
        field_special.insert(0xE6, "⑬");
        field_special.insert(0xE7, "\n");
        field_special.insert(0xE8, "{NEW}");
        field_special.insert(0xEA, "{CLOUD}");
        field_special.insert(0xEB, "{BARRET}");
        field_special.insert(0xEC, "{TIFA}");
        field_special.insert(0xED, "{AERITH}");
        field_special.insert(0xEE, "{RED XIII}");
        field_special.insert(0xEF, "{YUFFIE}");
        field_special.insert(0xF0, "{CAIT SITH}");
        field_special.insert(0xF1, "{VINCENT}");
        field_special.insert(0xF2, "{CID}");
        field_special.insert(0xF3, "{PARTY #1}");
        field_special.insert(0xF4, "{PARTY #2}");
        field_special.insert(0xF5, "{PARTY #3}");
        field_special.insert(0xF6, "〇");
        field_special.insert(0xF7, "△");
        field_special.insert(0xF8, "☐");
        field_special.insert(0xF9, "✕");

        let mut field_control = HashMap::new();
        field_control.insert(0xD2, "{GRAY}");
        field_control.insert(0xD3, "{BLUE}");
        field_control.insert(0xD4, "{RED}");
        field_control.insert(0xD5, "{PURPLE}");
        field_control.insert(0xD6, "{GREEN}");
        field_control.insert(0xD7, "{CYAN}");
        field_control.insert(0xD8, "{YELLOW}");
        field_control.insert(0xD9, "{WHITE}");
        field_control.insert(0xDA, "{FLASH}");
        field_control.insert(0xDB, "{RAINBOW}");
        field_control.insert(0xDC, "{PAUSE}");
        field_control.insert(0xDE, "{NUM}");
        field_control.insert(0xDF, "{HEX}");
        field_control.insert(0xE0, "{SCROLL}");
        field_control.insert(0xE1, "{RNUM}");
        field_control.insert(0xE9, "{FIXED}");

        Self {
            normal,
            field_special,
            field_control,
            escape: "\\{}",
        }
    }
}

pub fn decode_text(buf: &[u8]) -> Result<String, String> {
    let chars = Chars::new();
    let mut text = String::new();
    let mut i = 0;

    while i < buf.len() {
        let c = buf[i];
        i += 1;

        if c == 0xFF {
            break;
        } else if c < 0xE0 {
            let t = chars.normal.chars().nth(c as usize).unwrap();
            if chars.escape.contains(t) {
                text.push('\\');
            }
            text.push(t);
        } else if c == 0xFE {
            if i >= buf.len() {
                return Err("Spurious control code at end of string".to_string());
            }
            let k = buf[i];
            i += 1;

            if k == 0xDD {
                if i + 1 >= buf.len() {
                    return Err("Not enough bytes for WAIT command".to_string());
                }
                let arg = u16::from_le_bytes([buf[i], buf[i + 1]]);
                i += 2;
                text.push_str(&format!("{{WAIT {}}}", arg));
            } else if k == 0xE2 {
                if i + 3 >= buf.len() {
                    return Err("Not enough bytes for STR command".to_string());
                }
                let offset = u16::from_le_bytes([buf[i], buf[i + 1]]);
                let length = u16::from_le_bytes([buf[i + 2], buf[i + 3]]);
                i += 4;
                text.push_str(&format!("{{STR {} {}}}", offset, length));
            } else {
                text.push_str(
                    chars
                        .field_control
                        .get(&k)
                        .ok_or_else(|| format!("Illegal control code {}", k))?,
                );
            }
        } else {
            text.push_str(
                chars
                    .field_special
                    .get(&c)
                    .ok_or_else(|| format!("Unknown special character {}", c))?,
            );
            if c == 0xE8 {
                text.push('\n');
            }
        }
    }

    Ok(text)
}
