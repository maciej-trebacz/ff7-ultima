use serde::Serialize;

#[derive(Serialize)]
pub struct Elemental {
    pub element: u8,
    pub effect: u8,
}

#[allow(dead_code)]
#[derive(Serialize)]
pub enum ElementalEffect {
    Death = 0,
    DoubleDamage = 2,
    HalfDamage = 4,
    Nullify = 5,
    Absorb = 6,
    FullCure = 7,
    Nothing = 0xFF,
}

#[allow(dead_code)]
#[derive(Serialize)]
pub enum ElementalType {
    Fire = 0,
    Ice,
    Bolt,
    Earth,
    Bio,
    Gravity,
    Water,
    Wind,
    Holy,
    Health,
    Cut,
    Hit,
    Punch,
    Shoot,
    Scream,
    Hidden,
    Nothing = 0xFF,
}
