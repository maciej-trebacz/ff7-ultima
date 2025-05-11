# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FF7 Ultima is a real-time game editor for Final Fantasy VII PC. It supports the English Steam version of the game. The application is built using:

- Frontend: React + TypeScript + Vite
- Desktop framework: Tauri (Rust)
- Key libraries: React Three Fiber (for 3D map visualization), Shadcn UI (for components)
- UI styling: TailwindCSS with a dark theme and "slate" base color

The tool allows real-time memory reading/writing to FF7's process to enable various features like editing game state, battle stats, field/world navigation, and more.

FF7 Ultima allows users to modify various aspects of the game while it is running, including character stats, inventory, game variables, and applying various cheats or "hacks". The application provides a user interface to interact with the game's memory, view game data, manage save states, and trigger in-game events or changes.

## Commands

### Development

```bash
# Install dependencies
npm install

# Run the Tauri development environment
npm run tauri dev

# Build the Tauri application
npm run tauri build
```

### Building a Release

Windows PowerShell:
```powershell
# Run the build script (sets up signing key and builds)
./build.ps1
```

## Architecture

### Core Components

1. **Rust Backend (`src-tauri/`)**
   - Handles memory interaction with FF7 process
   - `commands.rs`: Implements Tauri commands to read/write game memory
   - `main.rs`: Tauri application setup, initializes plugins

2. **React Frontend (`src/`)**
   - `FF7Context.tsx`: Central state provider that manages FF7 game state
   - `memory.ts`: TypeScript interface for memory operations
   - `useFF7.ts`: Main hook containing game editing functionality
   - `ff7Addresses.ts`: Contains memory addresses for various game structures
   - `Home.tsx`: Main layout with sidebar and content view

3. **Game Module Structure (`src/modules/`)**
   - `General.tsx`: Manages global game aspects like Party Gil, In-Game Time, Current Disc, Love Points, PHS availability, Game Moment ID, battle statistics, Gold Saucer GP, and menu availability
   - `Battle.tsx`: Focuses on combat scenarios - allows toggling cheats (invincibility, instant ATB), setting multipliers for EXP/AP/Gil, editing character/enemy stats, and viewing detailed enemy data
   - `Field.tsx`: Handles field map interactions including warping between maps, toggling player movement, editing step/encounter values, skipping dialogues, and managing save states
   - `Party.tsx`: Manages party members, character stats, inventory, and equipment
   - `World.tsx`: Deals with the world map - displays coordinates, provides interactive map for teleportation, and options to toggle zoom/tilt and "walk anywhere" mode
   - `Advanced.tsx`: Advanced features (variable editing, etc.)

4. **Map Viewer Component (`src/components/map/`)**
   - 3D visualization of the world map
   - Interactive teleportation by clicking on the map

### Project Structure

The project is organized as follows:

* **`src/`**: Frontend code written in TypeScript using React
   * **`components/`**: Reusable UI components
     * **`modals/`**: Modal dialog components
     * **`map/`**: Components for the detailed map viewer
     * **`ui/`**: Customized shadcn components
   * **`modules/`**: Main UI views for different editor functionalities accessible via the sidebar
   * **`hooks/`**: Custom React hooks for managing stateful logic and side effects
   * **`ff7/`**: Logic for parsing and handling FF7-specific game file formats
   * **`assets/`**: Static image assets like icons and maps
   * **`data/`**: Larger static data files (e.g., scenes.json)
   * **`lib/`**: Utility functions and shared code
   * **`@types/`**: TypeScript type definitions

* **`src-tauri/`**: Rust backend code
   * `tauri.conf.json`: Configures the application's build, windows, and plugin settings

* **`public/`**: Static assets directly accessible by the webview

* **`.github/`**: GitHub-specific configurations for workflows

* **`.vscode/`**: Visual Studio Code editor settings

### Application Flow

1. The Tauri application connects to the FF7 process
2. The React app uses Tauri commands to read/write memory
3. The `FF7Context` provider polls game state on a regular interval
4. UI components render based on the current game state
5. User actions trigger memory writes to modify the game in real-time

## Key Files

- `/src/FF7Context.tsx`: Central state management for game data
- `/src/useFF7.ts`: Core hook with game editing functionality
- `/src/memory.ts`: Memory read/write interface
- `/src/ff7Addresses.ts`: Memory address definitions
- `/src-tauri/src/commands.rs`: Rust implementation of memory operations
- `/src-tauri/src/main.rs`: Tauri application entry point

## Dependencies

Note that this project depends on an external `ff7-lib` Rust crate that's referenced in `Cargo.toml` as a path dependency. This library is not included in the repository and must be available at `../../ff7-lib` relative to the project.

## Development Notes

### Adding shadcn Components

To add a new shadcn component to the project, run the command:

```bash
npx shadcn@latest add [component name here]
```

### Invoking Rust Backend Commands

In Tauri 2.0, invoke backend commands as follows:

```typescript
import { invoke } from '@tauri-apps/api/core';

// Invocation from JavaScript
invoke('my_custom_command', {
  number: 42,
})
```

### Building for Release

To update to a new version:

1. Update the app version number in:
   - `src/Cargo.toml`
   - `package.json`
   - `tauri.conf.json`

2. Run the `build.ps1` script

3. Update the `updater.json` file with:
   - New version number in the `version` field
   - Updated URL field
   - Updated signature using contents from `src-tauri/target/release/bundle/nsis/FF7 Ultima_[version]_x64-setup.exe.sig`