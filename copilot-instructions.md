# Crystal Overdrive — Copilot Architecture Instructions

## Project Overview
We are building a high-performance, browser-based 2D remake of Pokémon Crystal called **Crystal Overdrive**, built using **TypeScript 5+**, **Vite**, and **PixiJS v8**.
We are following **Approach B (Playable Vertical Slice First)**:
- **Current Scope:** New Bark Town, Route 29, and Cherrygrove City, including wild battles, 1 trainer battle, and the 3 roaming beasts (Raikou, Entei, Suicune).
- **Future Scope:** All JSON schemas in `src/types/game.d.ts` must remain flat and serializable so our Phase 4 automated parser can compile the rest of the world into the exact same format.

## Strict Architectural Rules
1. **Separation of Concerns:**
   - `src/core/`, `src/world/`, and `src/battle/` must contain **PURE TypeScript logic** with ZERO imports from `pixi.js` or the browser DOM.
   - `src/render/` handles all PixiJS v8 WebGL/WebGPU canvas rendering (64x64px upscaled tiles).
   - `src/ui/` handles all HTML5/CSS vector overlays (menus, dialog boxes, Battle HUD).
2. **Decoupled Player Speed (1x / 2x / 3x):**
   - World time always runs at `1.0x` (NPC movement, ambient tile animations).
   - Player movement and animation scale by `playerSpeedMultiplier` (`1 | 2 | 3`).
   - Grid movement must use normalized progress `p` between `0.0` and `1.0` with fractional overflow chaining so 3x speed never overshoots tile collision boundaries.
3. **High-Speed Modernized Battles (1x / 2x / 3x):**
   - All battle tweens, HP bar drains, and text delays divide their base duration by `battleSpeedMultiplier` (`1 | 2 | 3`).
   - Use the **Gen 4+ Physical/Special Split** (`move.category === 'Physical' | 'Special' | 'Status'`).
4. **Pokémon Unbound Type Effectiveness UI:**
   - Every move button in the Battle HUD must calculate real-time type effectiveness against the active defender and display a badge: `4x ULTRA`, `2x SUPER`, `1x NORMAL`, `0.5x / 0.25x NOT VERY`, or `0x IMMUNE`.
5. **Roaming Beasts, Modern Pokéballs & Infinite TMs:**
   - Raikou, Entei, and Suicune roam via a player-weighted adjacency graph (`RoamingManager.ts`) and have a 2-turn grace window before attempting to flee.
   - TMs never break on use (`Infinite TMs`).
   - Poké Marts unlock modern Pokéballs (Quick, Dusk, Net, Timer, Repeat, Fast, Dream) based on badge count.

## 1. Project Vision & Core Pillars
A high-performance, browser-based flat 2D remake of *Pokémon Crystal* built with **TypeScript 5+** and **PixiJS v8**. The project replaces pixelated 8-bit visuals with smooth, high-resolution 2D artwork and crisp vector UI while introducing modern Quality-of-Life (QoL) mechanics designed for speed and strategic clarity.

### Core Design Pillars
1. **Maximum Browser Performance:** 60+ FPS WebGL/WebGPU batched 2D tilemap and sprite rendering via PixiJS v8, zero-allocation game loops, and pre-packed WebP texture atlases.
2. **Decoupled Player Speed (1x / 2x / 3x):** Toggleable player movement and sprite animation speed multiplier (`1x`, `2x`, `3x`) that accelerates **only** the player character while keeping world NPCs, wandering behavior, and ambient tile animations at `1x` speed.
3. **High-Speed Modernized Battles (1x / 2x / 3x):** Toggleable battle speed multiplier scaling animations, HP bar drains, and text speed; **Gen 4+ Physical/Special Move Split**; and **Pokémon Unbound-style Live Type Effectiveness UI** on move buttons.
4. **Revamped Roaming Beasts & Catching Ecosystem:** *Raikou, Entei,* and *Suicune* all dynamically roam Johto via a player-weighted adjacency graph (capable of moving into adjacent routes or the player's active route on border transitions), supported by **progressive modern Pokéballs** in Poké Marts and **infinite-use TMs** featuring trapping and catching moves.
5. **Vertical Slice First, Automated World Parser Second:** Build and validate all core systems inside a 3-map playable vertical slice (*New Bark Town*, *Route 29*, *Cherrygrove City*), then run an automated Node.js parser against `pret/pokecrystal` and `@pkmn/dex` to populate the rest of Johto and Kanto.

---

## 2. Architecture & Tech Stack

| Layer | Technology | Role & Performance Justification |
| :--- | :--- | :--- |
| **Language & Bundler** | **TypeScript 5.x + Vite** | Strict static typing guarantees GitHub Copilot generates accurate schemas across modules; Vite provides instant HMR. |
| **2D WebGL/WebGPU Engine** | **PixiJS v8 + `@pixi/tilemap`** | Significantly lower memory and GPU overhead than Three.js for flat 2D. Renders entire multi-layer tilemaps and sprite batches in 1–2 draw calls. |
| **UI Overlay Layer** | **HTML5 / CSS3 DOM Overlay** | Renders menus, dialog boxes, health bars, and *Unbound* effectiveness badges over the canvas for razor-sharp vector typography at any screen DPI. |
| **Tweening & Animation** | **GSAP (GreenSock)** | Supports global timeline `.timeScale()`, allowing instant `1x / 2x / 3x` battle animation scaling without manual frame recalculation. |
| **Pokémon & Move Data** | **`@pkmn/dex` (Showdown DB)** | Supplies pre-validated stats, types, learnsets, modern Pokéball data, and Gen 4+ Physical/Special move classifications. |
| **World Layout Source** | **`pret/pokecrystal` Disassembly** | Open-source disassembly used for authentic Johto/Kanto tile coordinates, collision maps, warps, and trainer rosters. |
| **Audio Engine** | **Howler.js** | Hardware-accelerated Web Audio API wrapper for gapless BGM loops and low-latency battle SFX. |
| **Persistence** | **IndexedDB (`idb`)** | Asynchronous browser storage for save states, settings, and JSON save import/export. |

---

## 3. Hybrid Art & Asset Pipeline

To achieve a clean, non-pixelated 2D look without manually redrawing thousands of tiles, the project uses a **Hybrid Overworld + HD Battle Asset Pipeline**:

### 3.1 Overworld Tilesets & Sprites (Offline xBRZ / ScaleFX Pipeline)
1. **Base Extraction:** Pull raw 16x16px tilesets and overworld character sprites from `pret/pokecrystal`.
2. **Tile Border Extrusion (`scripts/upscale-assets.ts`):** Extrude the outer 1px border of each 16x16 tile by 2px prior to upscaling to prevent transparent seams or color bleeding between adjacent tiles.
3. **4x Vector-Smooth Upscaling:** Pass extruded tilesets through an offline `xBRZ` or `ScaleFX` 4x upscaler to transform 16x16 pixel art into smooth, anti-aliased **64x64px** high-resolution tiles.
4. **WebP Atlas Packing:** Pack upscaled tiles and sprites into power-of-two `.webp` texture atlases (`free-tex-packer-core`) for single-draw-call GPU rendering.

### 3.2 Battle Sprites & UI (Modern HD Swap)
1. **Battle Sprites:** High-resolution 2D front and back renders sourced from *Pokémon Showdown* / *Pokémon HOME* 2D asset packs.
2. **Battle Arenas:** Layered 2D vector/painted backgrounds (Tall Grass, Cave, Water, Indoor, Gym) rendered in PixiJS.
3. **Vector UI:** Crisp CSS Grid/Flexbox HUD with SVG elemental type icons, smooth CSS-transitioned HP/EXP bars, and modern sans-serif typography.

### 3.3 Authentic 64x64 Johto Tile Catalog & 9-Frame Character Sprite Sheets
1. **Explicit `tileMap` Rendering (`public/assets/tiles/*.png`):**
   - Each `MapData` JSON file defines an explicit `tileMap?: string[]` array of length `width * height` referencing authentic 4x-upscaled 64x64 tiles (e.g., `grass`, `tall_grass`, `path`, `water`, `tree_tl`/`tr`/`bl`/`br`, `roof_red_*`, `roof_blue_*`, `wall_left`/`mid`/`right`, `wall_window`, `wall_door`, `sign`, `ledge_left`/`mid`/`right`, `flower_1`/`2`, `shore_*`).
   - When `tileMap` is omitted (e.g., procedural or legacy test maps), `OverworldRenderer.ts` falls back deterministically to `collisionGrid` semantics.
2. **9-Frame 32-Bit RGBA Character Sprite Sheet Layout (`144x32px`, nine `16x32px` frames):**
   - Overworld character sprite sheets (`gold_walk.png`, `npc_boy.png`) use 32-bit RGBA PNG encoding with color index `0` set to fully transparent (`alpha = 0`) to prevent WebGL background box artifacts.
   - Frame index mapping in `OverworldRenderer.ts`:
     - `0`: Down Stand (`DOWN` idle)
     - `1`: Up Stand (`UP` idle)
     - `2`: Side Stand (`LEFT` idle; mirrored horizontally with `scale.x = -4` for `RIGHT` idle)
     - `3, 4`: Down Walk cycle (`DOWN` stepping frames)
     - `5, 6`: Up Walk cycle (`UP` stepping frames)
     - `7, 8`: Side Walk cycle (`LEFT` stepping frames; mirrored horizontally with `scale.x = -4` for `RIGHT` stepping frames)

### 3.4 DOM Overlay Layer Isolation & Interactive Building Warps
1. **Dedicated UI Layer Mounts (`#ui-layer`):**
   - To prevent modal dialogs or battle transitions from wiping sibling HUD elements via `innerHTML`, `#ui-layer` partitions into three dedicated sub-containers:
     - `#overworld-hud-container` (`OverworldHUD.ts`: Player `1x/2x/3x` Speed Toggle, Pokégear Roamer Radar with persistent HP/Status bars, Bag & Poké Mart shortcuts, and toast notifications)
     - `#battle-hud-container` (`BattleHUD.ts`: Pokémon Unbound live effectiveness move buttons, SVG Physical/Special/Status split icons, status/trapped pills, speed-scaled typewriter text, and live Pokéball inventory drawer)
     - `#modal-container` (`BagAndMartUI.ts`: Badge-Gated Progressive Poké Mart at `0 / 1 / 3 / 5 / 8` badges and Infinite TMs drawer)
2. **Interactive Building Door Warps:**
   - Building door tiles (`wall_door`) with `WarpEvent` entries are configured with walkable collision (`0`) so stepping into a doorway triggers `onTileEntered` -> `mapManager.checkWarp(coord)`:
     - `cherrygrove_mart`: Opens the Progressive Poké Mart overlay (`BagAndMartUI.open('mart')`).
     - `cherrygrove_poke_center` / `players_house_1f` / `elms_lab`: Restores full party HP, clears status conditions, and displays an overworld toast notification.

---

## 4. Core Gameplay Systems & Mathematical Specifications

### 4.1 Decoupled Game Clock & 1x/2x/3x Player Grid Physics
* **Clock Separation (`src/core/GameClock.ts`):**
  * Each frame delta ($\Delta t$, clamped to $\le 100\text{ ms}$) produces three distinct time steps:
    * $\Delta t_{\text{world}} = \Delta t \times 1.0$ (drives NPC movement, wandering AI, and animated water/flower tiles).
    * $\Delta t_{\text{player}} = \Delta t \times M_{\text{player}}$ where $M_{\text{player}} \in \{1, 2, 3\}$.
    * $\Delta t_{\text{battle}} = \Delta t \times M_{\text{battle}}$ where $M_{\text{battle}} \in \{1, 2, 3\}$.
* **Grid-Safe Fractional Interpolation (`src/world/GridPhysics.ts`):**
  * Base tile traversal time at $1\times$ speed is $T_{\text{base}} = 0.24\text{ seconds}$ ($\approx 4.16\text{ tiles/sec}$).
  * Movement between Tile $A$ and Tile $B$ tracks normalized progress $p \in [0.0, 1.0]$:
    $$p_{t+1} = p_t + \frac{\Delta t_{\text{entity}}}{T_{\text{base}}}$$
  * **Seamless Tile Chaining:** When $p_{t+1} \ge 1.0$, the entity snaps logically to Tile $B$, fires `onTileEntered(coord, tileType)` (for warp and wild encounter checks), and—if the movement input is still held and Tile $C$ is walkable—immediately carries the fractional overflow $p_{\text{overflow}} = p_{t+1} - 1.0$ into the Tile $B \to C$ step. This guarantees zero frame-stutter at $3\times$ speed while preserving exact grid collision boundaries.

### 4.2 High-Speed Battle Engine & Physical/Special Split
* **Speed Scaling ($M_{\text{battle}} \in \{1, 2, 3\}$):**
  * Every GSAP tween duration, particle effect, HP bar drain, and dialog delay divides its base duration by $M_{\text{battle}}$:
    $$D_{\text{effective}} = \frac{D_{\text{base}}}{M_{\text{battle}}}$$
  * Text rendering speed scales from `30ms/char` ($1\times$) to `15ms/char` ($2\times$) to `0ms/instant` ($3\times$).
* **Gen 4+ Physical/Special Split (`src/battle/DamageCalculator.ts`):**
  * Moves are classified individually as `"Physical"`, `"Special"`, or `"Status"` regardless of elemental type:
    * **Physical Moves** (e.g., *Fire Punch, Bite, Shadow Claw, ExtremeSpeed*): Use `attacker.stats.attack` ($A$) and `defender.stats.defense` ($D$).
    * **Special Moves** (e.g., *Flamethrower, Surf, Shadow Ball, Thunderbolt*): Use `attacker.stats.spAttack` ($A$) and `defender.stats.spDefense` ($D$).
  * **Damage Formula:**
    $$\text{Damage} = \left\lfloor \left( \left\lfloor \frac{2 \times \text{Level}}{5} + 2 \right\rfloor \times \text{Power} \times \frac{A}{D} \div 50 + 2 \right) \times \text{STAB} \times E_{\text{type}} \times \text{Random}(0.85, 1.00) \right\rfloor$$
    *(where $\text{STAB} = 1.5$ if `move.type` matches either of `attacker.types`, else $1.0$; if `move.leavesOneHp === true` [False Swipe], $\text{Damage} = \min(\text{Damage}, \text{defender.currentHp} - 1)$).*

### 4.3 "Pokémon Unbound" Live Type Effectiveness Battle UI
When the player opens the **Fight** menu, each move button evaluates `EffectivenessHelper.evaluate(move, defender)` against both of the opposing Pokémon's types:

$$E_{\text{type}} = \text{TypeChart}[\text{move.type}][\text{defender.type1}] \times \left(\text{defender.type2} ? \text{TypeChart}[\text{move.type}][\text{defender.type2}] : 1.0\right)$$

Each move button in the HTML/CSS Battle HUD displays:
1. **Move Name, Elemental Type Pill, and PP Counter**
2. **Split Category Icon:** Physical (Explosion/Starburst SVG), Special (Concentric Rings SVG), or Status (Wave/Shield SVG).
3. **Live Effectiveness Indicator Badge:**
   * $E_{\text{type}} = 4.0$: `4x ULTRA` (Glowing Emerald Badge + Double Up Arrow)
   * $E_{\text{type}} = 2.0$: `2x SUPER` (Bright Green Badge + Up Arrow)
   * $E_{\text{type}} = 1.0$: `1x NORMAL` (Neutral Slate Badge)
   * $E_{\text{type}} = 0.5\text{ or }0.25$: `0.5x / 0.25x RESIST` (Amber/Orange Badge + Down Arrow)
   * $E_{\text{type}} = 0.0$: `0x IMMUNE` (Crimson Badge + Cross Icon — also checks Status immunities such as *Thunder Wave* vs. Ground-types or *Poison Powder* vs. Grass/Steel-types).

### 4.4 Roaming Legendary Beasts System (`src/world/RoamingManager.ts`)
All three Legendary Beasts (*Raikou, Entei,* and *Suicune*) roam Johto via an undirected graph `JohtoRouteGraph` after the Burned Tower awakening event (or immediately in Vertical Slice testing mode).

1. **Player-Biased Route Transitions:**
   * Triggered whenever the player crosses a map border from $R_{\text{prev}}$ to $R_{\text{curr}}$.
   * For each uncaught roaming beast currently on $R_{\text{beast}}$, roll $r \in [0, 1)$:
     * **$r < 0.65$ (65% — Standard Roam):** Move to a random adjacent route in `JohtoRouteGraph[R_beast]`.
     * **$0.65 \le r < 0.90$ (25% — Player Gravity):** Move 1 step along the shortest BFS path toward $R_{\text{curr}}$.
     * **$r \ge 0.90$ (10% — Direct Converge):** Move directly onto $R_{\text{curr}}$ or an immediately adjacent route.
   * *Anti-Frustration Rule:* Flying or warping does **not** scatter beasts to random distant routes; it executes a normal transition roll.
2. **Pokégear Live Tracking & Active Route Alert:**
   * All three beasts are visible on the Pokégear Map immediately upon awakening.
   * Whenever $R_{\text{beast}} === R_{\text{curr}}$, the Overworld HUD displays an arrival banner (*"A powerful aura is present on this route!"*) and injects the beast into the route's wild grass encounter table at a **25% encounter rate**.
3. **Encounter Persistence & 2-Turn Grace Window:**
   * Roaming beasts persist their `currentHp` and `status` (`SLP`, `PAR`, etc.) across encounters.
   * Wild roamers will **not** attempt to flee during **Turns 1 and 2** of an encounter, allowing the player to throw a *Quick Ball*, inflict paralysis/sleep, or lock them in battle with *Mean Look* / *Block*. From Turn 3 onward, they attempt to flee unless `isTrapped === true` or incapacitated by `SLP`/`FRZ`.

### 4.5 Progressive Modern Pokéballs & Infinite-Use TMs

#### Badge-Gated Poké Mart Stock (`src/battle/CatchCalculator.ts`)
All original Gen 2 Apricorn Ball bugs are fixed, and modern Pokéballs unlock automatically in Poké Marts based on `player.badges.length`:

| Badges | Unlocked Pokéballs | Catch Rate Multiplier ($B_{\text{ball}}$) |
| :--- | :--- | :--- |
| **0** | **Poké Ball** | $1.0\times$ |
| **1** | **Great Ball**, **Net Ball**, **Nest Ball** | Great: $1.5\times$ \| Net: **$3.5\times$ if target is Water or Bug** (Suicune) \| Nest: $\max(1.0, \frac{41 - \text{Level}}{10})\times$ |
| **3** | **Ultra Ball**, **Quick Ball**, **Dusk Ball** | Ultra: $2.0\times$ \| Quick: **$5.0\times$ on Turn 1** ($1.0\times$ after) \| Dusk: **$3.0\times$ at Night or in Caves** |
| **5** | **Timer Ball**, **Repeat Ball**, **Fast Ball** | Timer: $\min(4.0, 1 + 0.3 \times \text{Turns})\times$ \| Repeat: $3.5\times$ if species registered \| Fast: **$4.0\times$ if target Base Speed $\ge 100$** (Raikou, Entei, Suicune!) |
| **8** | **Dream Ball** | **$4.0\times$ if target is Asleep (`SLP`)** |

* **Modified Catch Rate Formula:**
  $$X = \min\left(255,\; \left\lfloor \frac{(3 \times \text{HP}_{\max} - 2 \times \text{HP}_{\text{curr}}) \times \text{CatchRate} \times B_{\text{ball}}}{3 \times \text{HP}_{\max}} \times S_{\text{status}} \right\rfloor \right)$$
  *(where $S_{\text{status}} = 2.5$ for `SLP`/`FRZ`, $1.5$ for `PAR`/`BRN`/`PSN`, and $1.0$ otherwise).*

#### Infinite-Use TMs & Hunting Move Pool
* All TMs reside in the `Infinite TMs` pocket and never break when taught.
* Hunting utility TMs are available early in the Vertical Slice / Goldenrod Department Store:
  * **TM54 False Swipe:** 40 Power, Physical, Normal — Cannot reduce target HP below 1 (`leavesOneHp: true`).
  * **TM73 Thunder Wave:** Status, Electric — Paralyzes target ($1.5\times$ catch rate, $-50\%$ Speed).
  * **TM99 Mean Look / Block:** Status, Normal — Sets `defender.isTrapped = true`, preventing roaming beasts from fleeing while the user remains active.

---

## 5. Repository Directory Structure

```text
crystal-overdrive/
├── .github/
│   └── copilot-instructions.md       # Project architecture rules for GitHub Copilot
├── BLUEPRINT.md                      # Master Technical & Game Design Specification
├── scripts/
│   ├── upscale-assets.ts             # Offline 2px extrusion + xBRZ/ScaleFX 4x tile upscaler
│   └── import-pokecrystal.ts         # Phase 4 parser: converts pret/pokecrystal maps to JSON
├── public/
│   └── assets/
│       ├── atlases/                  # 64x64 smoothed overworld tilemaps (.webp + .json)
│       ├── sprites/                  # HD battle sprites & overworld character sprite sheets
│       └── data/                     # Maps, moves, trainers, items (.json)
├── src/
│   ├── types/
│   │   └── game.d.ts                 # Single source of truth for all TypeScript interfaces
│   ├── core/                         # PURE TypeScript Engine Core (Zero Pixi/DOM imports)
│   │   ├── GameClock.ts              # World dt (1x) vs Player dt (1x/2x/3x) vs Battle dt
│   │   ├── EventBus.ts               # Strongly-typed pub/sub event bus
│   │   └── SaveManager.ts            # IndexedDB save/load state persistence
│   ├── world/                        # PURE TypeScript Overworld & Roaming Logic
│   │   ├── GridPhysics.ts            # Fractional tile progress p in [0,1] + overflow chaining
│   │   ├── MapManager.ts             # Map transitions, warps, and grass encounter rolls
│   │   └── RoamingManager.ts         # JohtoRouteGraph + weighted Markov beast transitions
│   ├── battle/                       # PURE TypeScript High-Speed Battle Engine
│   │   ├── BattleStateMachine.ts     # Turn order, action queue, 2-turn roamer grace window
│   │   ├── DamageCalculator.ts       # Gen 4+ Physical/Special split + False Swipe clamp
│   │   ├── EffectivenessHelper.ts    # Computes Unbound UI badge metadata (4x, 2x, 0.5x, 0x)
│   │   └── CatchCalculator.ts        # Modern Pokeball multipliers & shake probability math
│   ├── render/                       # PixiJS v8 WebGL/WebGPU Rendering Layer
│   │   ├── OverworldRenderer.ts      # @pixi/tilemap camera, culling & sprite batching
│   │   └── BattleRenderer.ts         # HD battle sprites + speed-scaled GSAP animations
│   ├── ui/                           # HTML5/CSS3 Vector Overlay Layer
│   │   ├── OverworldHUD.ts           # 1x/2x/3x Player speed button, Pokegear roamer tracker
│   │   ├── BattleHUD.ts              # Unbound move buttons, category icons, 1x/2x/3x toggle
│   │   └── BagAndMartUI.ts           # Progressive Poke Mart & Infinite TM menu
│   └── main.ts                       # Application bootstrap & PixiJS Ticker loop
├── package.json
└── tsconfig.json
```

---

## 6. Core TypeScript Data Contracts (`src/types/game.d.ts`)

All modules and future automated parsers must adhere to these shared interfaces:

```typescript
export type SpeedMultiplier = 1 | 2 | 3;
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic'
  | 'Bug' | 'Rock' | 'Ghost' | 'Dragon' | 'Steel' | 'Dark';

export type MoveCategory = 'Physical' | 'Special' | 'Status';
export type StatusCondition = 'NONE' | 'PAR' | 'SLP' | 'FRZ' | 'BRN' | 'PSN' | 'TOX';

export type PokeballId =
  | 'poke-ball' | 'great-ball' | 'ultra-ball' | 'master-ball'
  | 'quick-ball' | 'dusk-ball' | 'net-ball' | 'nest-ball'
  | 'timer-ball' | 'repeat-ball' | 'fast-ball' | 'dream-ball';

export interface TileCoord {
  x: number;
  y: number;
}

export interface WarpEvent {
  x: number;
  y: number;
  targetMapId: string;
  targetX: number;
  targetY: number;
}

export interface WildEncounterSlot {
  speciesId: string;
  minLevel: number;
  maxLevel: number;
  weight: number;
}

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number; // 64 (16x16 original upscaled 4x)
  tileMap?: string[]; // Explicit 64x64 tile names (length = width * height)
  groundLayer: number[];
  objectLayer: number[];
  collisionGrid: number[]; // 0 = walkable, 1 = solid, 2 = tall grass, 3 = water
  connections: Partial<Record<'NORTH' | 'EAST' | 'SOUTH' | 'WEST', { mapId: string; offset: number }>>;
  warps: WarpEvent[];
  grassEncounters: WildEncounterSlot[];
}

export interface MoveData {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  priority: number;
  trapsTarget?: boolean;
  leavesOneHp?: boolean;
  inflictsStatus?: StatusCondition;
}

export interface EffectivenessBadge {
  multiplier: 0 | 0.25 | 0.5 | 1 | 2 | 4;
  label: string;
  colorClass: string;
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface PokemonInstance {
  uid: string;
  speciesId: string;
  nickname: string;
  level: number;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: BaseStats;
  stats: BaseStats;
  currentHp: number;
  status: StatusCondition;
  isTrapped: boolean;
  moves: Array<{ moveId: string; currentPp: number; maxPp: number }>;
  catchRate: number;
}

export interface RoamerState {
  speciesId: 'raikou' | 'entei' | 'suicune';
  currentMapId: string;
  pokemon: PokemonInstance;
  isAwakened: boolean;
  isCaught: boolean;
  isDefeated: boolean;
}
```

---

## 7. Phased Implementation Roadmap (Approach B: Vertical Slice -> Full World)

### Phase 1: Overworld Core & Decoupled 1x/2x/3x Player Speed
* **Deliverables:**
  1. Scaffold Vite + TypeScript + PixiJS v8 project.
  2. Implement `GameClock.ts` and `GridPhysics.ts` with fractional overflow chaining.
  3. Build `OverworldRenderer.ts` and `OverworldHUD.ts` (with `1x / 2x / 3x` speed toggle and keyboard shortcut `Shift`).
  4. Author Vertical Slice maps (`new_bark_town.json`, `route_29.json`, `cherrygrove_city.json`) with wandering NPCs moving at `1x` while the player runs at `2x` or `3x`.

### Phase 2: High-Speed Battle Engine & "Pokémon Unbound" UI
* **Deliverables:**
  1. Integrate `@pkmn/dex` wrapper to hydrate Gen 2 Pokémon and Gen 4+ Physical/Special moves.
  2. Implement `DamageCalculator.ts`, `EffectivenessHelper.ts`, and `BattleStateMachine.ts`.
  3. Build `BattleRenderer.ts` (GSAP tweens scaled by `battleSpeedMultiplier`) and `BattleHUD.ts` (displaying Physical/Special/Status icons, live `4x / 2x / 1x / 0.5x / 0x` Unbound pills, and the `1x / 2x / 3x` battle speed toggle).

### Phase 3: Roaming Beasts, Modern Pokéballs & Infinite TMs
* **Deliverables:**
  1. Implement `RoamingManager.ts` connecting the Vertical Slice routes (and full Johto graph) with the 65% / 25% / 10% player-weighted transition roll and Pokégear live tracking.
  2. Implement `CatchCalculator.ts` supporting *Quick Ball, Fast Ball, Net Ball, Dusk Ball, Timer Ball, Repeat Ball, Nest Ball,* and *Dream Ball*.
  3. Implement `BagAndMartUI.ts` with badge-gated Poké Mart inventories and the `Infinite TMs` pocket (*False Swipe, Thunder Wave, Mean Look*).

### Phase 4: Automated `pret/pokecrystal` World Importer
* **Deliverables:**
  1. Build `scripts/ upscale-assets.ts` to batch-extrude and 4x upscale all original tilesets into `.webp` atlases.
  2. Build `scripts/import-pokecrystal.ts` to parse `pret/pokecrystal/maps/*.asm` and `.blk` binary layouts into `MapData` JSON files, scaling the Vertical Slice to all of Johto and Kanto automatically.

---

## 8. GitHub Copilot Collaboration Rules
When generating code with GitHub Copilot in this repository, enforce these constraints:
1. **Strict Layer Isolation:** Never import `pixi.js` or `document`/`window` inside `src/core/`, `src/world/`, or `src/battle/`. Communicate between pure logic and `src/render/` or `src/ui/` via `EventBus.ts` or state snapshots.
2. **Context Pinning:** Keep `src/types/game.d.ts` open in an adjacent editor tab whenever prompting Copilot to generate a new module so it uses exact property names.
3. **Zero Frame Allocations:** Do not allocate new objects or arrays inside the `60Hz` PixiJS ticker loop (`OverworldRenderer.update` or `GridPhysics.updateEntity`); mutate existing coordinate structs in place.