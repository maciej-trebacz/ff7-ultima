# FF7 Real-time Game Editor

Real-time editor for Final Fantasy VII

## TODO

* [x] Test Rust's ability to connect to a process and read/write its memory
* Read basic game state information
  * [x] Game Moment
  * [x] Battle / escape counts
  * [x] Field model coordinates
  * [ ] World map coordinates
  * [x] Step count info
  * Battles
    * [x] Party stats
    * [ ] Enemy stats
    * [ ] Status flags
  * [ ] RNG info (seed, joker, animation index, etc.)
* Speedhack
  * [x] Field
  * [x] World
  * [x] Battle
* [x] Save/PHS anywhere
* [x] Enable/disable player movement
* [x] Enable/disable menu access
* [x] Enable all party members
* [x] End battle 
  * [ ] set specific battle flags
* [x] No battles / max battles for both field and world
* [x] Enter battle for specific battle formation id
  * [x] Field
  * [ ] World
* [x] Disable battle swirl
* [ ] Remember last used hacks
* [ ] Auto-apply hacks on game start
* [ ] Teleport to specific field
* [ ] Teleport to specific place on the world map ?
* [x] Skip FMVs
* [x] Skip intro
* [ ] No EXP gain
* [x] Disable pause when unfocused
* [ ] Save/load game state
        - player coordinates & direction
        - game time
        - game moment
        - field id
        - rng state
        - step count info
        - whole savemap
* [ ] Global hotkeys