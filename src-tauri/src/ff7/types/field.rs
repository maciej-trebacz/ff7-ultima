use serde::Serialize;

#[derive(Serialize)]
pub struct FieldModel {
    pub x: i32,
    pub y: i32,
    pub z: i32,
    pub direction: u8,
}

#[derive(Serialize)]
pub struct FieldData {
    pub field_id: u16,
    pub field_name: Vec<u8>,
    pub field_model_count: u16,
    pub field_model_names: Vec<String>,
}
