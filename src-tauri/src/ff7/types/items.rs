use serde::Serialize;

#[derive(Serialize)]
pub struct Item {
    pub name: String,
    pub item_type: ItemType,
    pub rate: u8,
}

#[derive(Serialize)]
pub enum ItemType {
    Steal,
    Drop,
}
