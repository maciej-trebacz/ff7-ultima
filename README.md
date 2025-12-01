# FF7 Real-time Game Editor

Real-time editor for Final Fantasy VII PC. Currently supports English Steam version only, contact me if you need to support other versions.

[![Screenshot](https://raw.githubusercontent.com/maciej-trebacz/ff7-ultima/main/ultima-1.8-screenshot.png)](https://raw.githubusercontent.com/maciej-trebacz/ff7-ultima/main/ultima-1.8-screenshot.png)

## Having issues? Want other features?

You can file issues directly using the [Issues](https://github.com/maciej-trebacz/ff7-ultima/issues) tab if you have a GitHub account. Otherwise, you can also join my Discord server: [https://discord.gg/YyecaMa7Wf](https://discord.gg/YyecaMa7Wf).

Or come and chat with me [live on Twitch](https://twitch.tv/m4v3k) where I often code this app (and other FF7 related projects) live!

## Current features

* Display and edit basic game information
  - game moment (using a handy list of possible game moments)
  - party GP
  - current disc
  - party Gil
  - battle count
  - battle escape count
  - in game time
* Edit PHS and Menu locks/visibility
* Change party members
* Change game speed
* Skip intros (SquareEnix & Eidos logos)
* Option to not pause the game when unfocused
* Skip battle swirl
* Disable random encounters or make them happen constantly
* Start an arbitrary battle both from the field and the world map, optionally setting the music
* Skip FMVs
* Game over from anywhere
* Global hotkeys (keyboard shortcuts)
* Remembers last used hacks, auto-applies hacks on game start
* Field module
  - show current field ID, step ID, step fraction, danger value
  - enable/disable character movement
  - view a list of all loaded field models and edit the coordinates
  - warp to any field, optionally setting the destination coordinates
  - view a list of encounters for current field, start any battle with one click
  - save states: create multiple save states and access them from any field
  - skip dialogues - removes all blocking dialogue windows (keeps the ask prompts)
  - run by default
* World module
  - show current model's position and triangle information, and current region name
  - show an indicator when walking over chocobo tracks
  - view the world map with all relevant models marked on it
  - ability to click on the world map to teleport to that position
  - view a list of all loaded world models and edit the coordinates
  - view a list of encounters for current region & terrain, start any battle with one click
  - custom zoom/tilt camera controls
  - walk/land anywhere option
* Battle module
  - show current battle ID
  - invincibility mode (sets physical and magic immunity)
  - instant ATB mode
  - EXP/AP/Gil multipliers
  - show and edit ally and enemy information (HP, MP, statuses, ATB), instant kill
  - show enemy stats, elemental affinities and item drop/steal rates
  - view chocobo rating during battle
  - auto sense - always show enemy HP in the battle help bar
  - battle log - shows all actions performed by any battle entity
* Party module (view & edit stats, equipment and status flags)
* Chocobo module (manage your stables and chocobos, view & edit their stats)
* Save States manager
* ... and more that I probably forgot about

## Acknowledgements

* **DLPB** - author of Ochu editor, the inspiration for this app, and for the list of battle formations
* **Phantasm** - testing and ideas
* **petfriendamy** - ideas, support and the list of game moments
* **picklejar76** - for the Kujata project, using which the scenes data was extracted
* **myst6re** - for creating and open sourcing Makou Reactor
* **NFITC1** - for creating WallMarket and ProudClod which I use extensively for research
* **FF7 Wiki authors** - invaluable resource for learning about FF7 internals
* **AI coding tools** - most of the code was written with the help of AI (Claude, GPT-5, Cursor Composer and others)
