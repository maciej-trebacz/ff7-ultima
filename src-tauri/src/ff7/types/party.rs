use serde::Serialize;

#[derive(Serialize)]
pub struct PartyMember {
  pub id: u8,
  pub name: String,
  pub status: u8,
  pub hp: u16,
  pub max_hp: u16,
  pub mp: u16,
  pub max_mp: u16,
  pub limit: u8,
  pub exp: u32,
}