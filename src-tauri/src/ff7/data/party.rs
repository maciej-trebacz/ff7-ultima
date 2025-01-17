use crate::ff7::addresses::FF7Addresses;
use crate::ff7::types::party::PartyMember;
use crate::ff7::data::kernel::read_name;
use crate::utils::memory::*;

pub fn read_party_members(addresses: &FF7Addresses) -> Result<Vec<PartyMember>, String> {
  let mut party_members = Vec::new();
  const CHAR_RECORD_LENGTH: u32 = 0x84;
  for i in 0..9 {
    let base_addr = addresses.character_records + i as u32 * CHAR_RECORD_LENGTH;
    let name_addr = base_addr + 0x10;
    let decoded_name = read_name(name_addr)?;
    party_members.push(PartyMember { 
      id: read_memory_byte(base_addr)?, 
      name: decoded_name,
      status: read_memory_byte(base_addr + 0x1f)?,
      hp: read_memory_short(base_addr + 0x2c)?,
      max_hp: read_memory_short(base_addr + 0x38)?,
      mp: read_memory_short(base_addr + 0x30)?,
      max_mp: read_memory_short(base_addr + 0x3a)?,
      limit: read_memory_byte(base_addr + 0xf)?,
      exp: read_memory_int(base_addr + 0x3c)?,
    });
  }

  Ok(party_members)
}