# Change Log

## 1.4.8 (2025-04-19)

### General

* Added keyboard shortcuts for Skip Dialogues, Walk Anywhere, Invincibility and Manual Slots toggles
* Performance fix when the app starts with many save states

### Battle

* Gil multiplier option

## 1.4.7 (2025-04-18)

### General

* Auto-updater popup that asks if you want to update instead of performing it automatically
* Rewrote the settings internal code to hopefully be more robust and reliable

### Field

* Loading save states should be more reliable now

### Battle

* Small fixes and improvements to Battle Log

## 1.4.6 (2025-04-15)

### General

* Fixed game locking up on black screen after entering a battle when using 7th Heaven with the 60/30 FPS Gameplay mod enabled

### Battle

* Add Battle Log, displays a list of actions that happened during a battle with their outcomes

### World

* Walk Anywhere toggle that lets you walk, drive and land on all terrain types

## 1.4.5 (2025-04-02)

### General

* Show current battle/field ID in the status bar at all times

### Field

* Changed how step values are shown, added step offset & formation index

### Battle

* Added "Manual Slots" option that stops all slot reels (Tifa's and Cait's limits, and battle arena) and lets you choose slots with arrow keys

## 1.4.4 (2025-03-15)

### Field

* Fixed some additional softlocks when "Skip Dialogues" was enabled
* Added "Speed hack enhancenements" setting that disables the temperature dropping in Great Glacier and disables wind triggering battles in Whirlwind Maze when speed hack is on
* Added additional 5x, 10x and 20x options for AP/Exp boosts

## 1.4.3 (2025-03-07)

### Field

* Fixed several softlocks when "Skip Dialogues" was enabled
* Non-closable windows (button prompts, countdowns, etc.) are now visible when "Skip dialogues" is enabled
* View and set collision, interaction and visibility flags for field models

## 1.4.2 (2025-03-04)

### Field

* Add "Skip Dialogues" option that skips all the dialogue windows (except the ones where you have to pick an answer)

## 1.4.1 (2025-03-04)

### General

* When unfocus patch is applied the music does not stop anymore when game is unfocused
* Fixed several softlocks when skipping FMVs
* Fixed issues with how popovers work for editing certain values (especially Variable Editor)
* Ability to win/lose the submarine minigame when skipping it

### Field

* Fixed model list on certain fields that were showing N/A in the table
* Show triangle IDs for field models

## 1.4.0 (2025-02-20)

### General

* Added a Settings modal for managing keyboard shortcuts and other app settings
* Ultima now creates a log file on disk to make troubleshooting issues easier

### Field

* Save states should be more robust, hopefully no more lost saves now

### Battle

* Edit max HP/MP of allies and enemies during battles 

## 1.3.1 (2025-02-16)

### World

* Reworked map viewer pins, added pins for all controllable models and weapons
* Updated the static world map image

## 1.3.0 (2025-02-15)

### World

* Adds a world map viewer showing a live, zoomable top-down map with ability to toggle section boundaries, triangle boundaries and showing current positions of certain models.

## 1.2.5 (2025-02-14)

### General

* Fixed a crash when using certain features (Skip FMV, Full Party Heal, a few others) on vanilla FF7.

## 1.2.4 (2025-02-12)

### Field

* You can now export and import save states for backup and sharing purposes

## 1.2.3 (2025-02-11)

### Field

* Save states can now be reodered by dragging and dropping the rows

## 1.2.2 (2025-02-11)

### General

* Skip every minigame (for the mandatory chocobo races it counts as a win) with F1 / Skip button
* Fixed a softlock when skipping the FMV during weapon attack in Junon
* Made the app window resizible

### Field

* Improved the speed of warping to another field (or loading a state from another field)

## 1.2.1 (2025-02-10)

### Field

* Quick load will now load the last manually loaded state (so you can pick one from the list and then quickly load it over and over again e.g. for trick practice)
* Fixed crashes during save load
* Save states now also save field RNG state and script line state

## 1.2.0 (2025-02-08)

### Field

* Save state manager - can now store multiple save states (persisted between app launches)
* Saves now work across fields, when loading a state from another field you will get warped there
* Reworked how the app connects to the game, hopefully it will be more stable now

### Battle

* Fixed an issue with editing enemy details / killing enemies

## 1.1.10 (2025-02-08)

### General

* Fix a crash when FFNx is installed

## 1.1.9 (2025-01-27)

### General

* Skip FMV properly plays the Opening Bombing Mission theme when skipping the intro FMV
* Skip FMV now also skips bike, submarine and snowboard minigames
* Save states now also work inside the snowboard minigame (useful for speedrun practice)

## 1.1.8 (2025-01-24)

### General

* added Variable Editor in the General tab to view & edit Field/World variables

## 1.1.7 (2025-01-24)

### General

* keyboard shortcuts didn't work when shortcuts window was open

### Battle

* small UI tweaks to allies & enemies sections making the tables more streamer-friendly

## 1.1.6 (2025-01-24)

### General

* added keyboard shortcut remapping
* remember last used hacks between app launches
* automatically apply hacks between game restarts

## 1.1.5 (2025-01-20)

### General

* fixed toggling the limit bars outside battles

### Field

* display field id properly for wm* fields
* show field names for wm* destinations in the Warp to Field dialog
* add a "world map" destination when warping to fields that have entry points from the world map

## 1.1.4 (2025-01-19)

### General

* fixed the display of party member names in the party dropdowns when they're too long
* when changing party members while in the menu it will now refresh automatically to show the new member portrait and their stats

## 1.1.3 (2025-01-17)

### General

* fixed an issue with PHS dropdown
* PHS and Party slot selectors now show actual character names from game's memory
* toggle limit bars to be either full or empty

## 1.1.2 (2025-01-14)

### General

* keyboard shortcuts (list available by clicking on the Shortcuts button in the status bar)
* full cure and remove bad status effects (both in and out of battle)

## 1.1.1 (2025-01-13)

### General

* key item management

### Field

* fixed an issue with looping sounds when warping from specific fields

## 1.1.0 (2025-01-12)

### General

* add/remove any item to the party (works with custom modded items)
* add any materia to the party (works with custom modded materias)

## 1.0.9 (2025-01-08)

### General

* ability to change current party members
* editing in-game time now accepts time in format `[HH:][MM:]SS`

### World

* fixed editing world model coordinates

## 1.0.8 (2025-01-07)

### General

* fixed a couple of UI bugs and made it clearer when a value can be clicked to edit
* added a picker with a list of game moments to choose from

### Battle

* chocobo rating is now set up correctly when starting a chocobo battle
* added a picker for battle music when starting a battle from the field

### Field

* you can now edit field model coordinates and direction

## 1.0.7 (2025-01-02)

### General

* added version number to the status bar and a simple About dialog

### Field

* fixed some UI bugs in the Warp to Field dialog
* "Warp to Field" now also works from the world map

### World Map

* added "Super Speed" option for 6x the normal movement speed

### Battle

* fixed a bunch of battle descriptions in the Start Battle dialog

## 1.0.6 (2025-01-01)

### World Map

* added an indicator when currently on chocobo tracks
* added zoom/tilt controls using game's built-in camera mechanics

### Battle

* fixed chocobo rating display (the ratings were inverted)

## 1.0.5 (2024-12-30)

### Battle

* show chocobo rating when fighting a chocobo
* button to instantly kill a character

### World

* show current location name

## 1.0.4 (2024-12-29)

### Field

* Warp to Field - click on the Field ID to warp to any field, optionally adjusting the destination
* Experimental Save states feature (very buggy and only works inside one field level)

## 1.0.3 (2024-12-26)

### World Map

* Displays a world map with all relevant models marked on it
* Ability to click on the world map to teleport to that position
* View a list of all loaded world models and edit the coordinates

## 1.0.2 (2024-12-22)

### Fixes

* Setting HP for enemies with more HP than 65k now works correctly

### Improvements

* Rewrote some UI components for a consistent look across the app

## 1.0.1 (2024-12-20)

### Fixes

* Enemies with more HP than 65k now show their HP correctly

## 1.0.0 (2024-12-19)

Initial public release