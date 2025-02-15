export function swap16(val: number) {
    return ((val & 0xFF) << 8)
           | ((val >> 8) & 0xFF);
}

export function swap32(val: number) {
    return ((val & 0xFF) << 24)
           | ((val & 0xFF00) << 8)
           | ((val >> 8) & 0xFF00)
           | ((val >> 24) & 0xFF);
}