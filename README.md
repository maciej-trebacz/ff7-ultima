# FF7 Real-time Game Editor

Real-time editor for Final Fantasy VII PC. Currently supports English Steam version only, contact me if you need to support other versions.

[![Screenshot](https://raw.githubusercontent.com/maciej-trebacz/ff7-ultima/main/ultima-1.0-screenshot.png)](https://raw.githubusercontent.com/maciej-trebacz/ff7-ultima/main/ultima-1.0-screenshot.png)

## Current features
* Display and adit basic game information
  - game moment
  - party GP
  - current disc
  - party Gil
  - battle count
  - battle escape count
  - in game time
* Edit PHS and Menu locks/visibility
* Change game speed
* Skip intros (SquareEnix & Eidos logos)
* Option to not pause the game when unfocused
* Skip battle swirl
* Disable random encounters or make them happen constantly
* Start an arbitrary battle both from the field and the world map
* Skip FMVs
* Game over from anywhere
* Field module
  - show current field ID, step ID, step fraction, danger value
  - enable/disable character movement
  - show field models with their coordinates
* World module
  - show current model's position and triangle information
  - show the world map with your current position on it
  - click on the world map to teleport to that position
* Battle module
  - show current battle ID
  - invincibility mode (sets physical and magic immunity)
  - instant ATB mode
  - EXP/AP multipliers
  - show and edit ally and enemy information (HP, MP, statuses, ATB)
  - show enemy stats, elemental affinities and item drop/steal rates

## Planned features
* Field
  - Random encounter table
  - Countdown timer
  - Love points
  - Fort condor - battles fought, won, lost, rank, funds
* Great Glacier step counter
* World map
  - show world map models with their coordinates
* Chocobos
  - fenced chocobos (with their rating: wonderful, great, good, etc.)
  - chocobos at the stable - gender, color, rating, races won
  - indicate whether you can breed a chocobo
* RNG info (seed, joker, animation index, etc.)
* Battle log (display a log of attacks, status changes, etc.)
* One Hit Kill hack
* Remember last used hacks
* Auto-apply hacks on game start
* Teleport to specific field
* Save/load game state
  - player coordinates & direction
  - game time
  - game moment
  - field id
  - rng state
  - step count info
  - whole savemap
* Global hotkeys

## Acknowledgements

* **DLPB** - author of Ochu editor, the inspiration for this app
* **Phantasm** - testing and ideas
* **FF7 Wiki authors** - invaluable resource for learning about FF7 internals