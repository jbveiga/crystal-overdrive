# Implementation Plan: GitHub CI Fix & Ecruteak City / Burned Tower / Morty Sequence

Thorough plan addressing:
1. Fixing the GitHub Actions `build-and-deploy` workflow failure.
2. Implementing the complete Ecruteak City sequence (Burned Tower Rival battle, Legendary Beasts awakening cutscene, and Ecruteak Gym invisible floor pitfall puzzle with Leader Morty).

***

## 1. Diagnostics: GitHub Actions `build-and-deploy` Failure

### Root Cause Analysis
- We queried the GitHub Actions API for run `40095175350` (`Deploy to GitHub Pages`):
  - Job `build-and-deploy` failed at step **"Install Dependencies"** running `npm ci`.
  - Local reproduction revealed error:
    ```
    npm error code EUSAGE
    npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
    npm error Missing: @types/pngjs@6.0.5 from lock file
    npm error Missing: pngjs@7.0.0 from lock file
    ```
  - When `pngjs` and `@types/pngjs` were added to `package.json`, `package-lock.json` was not regenerated and pushed, causing GitHub's strict `npm ci` check to reject the build immediately.

### CI Resolution
- Synchronize `package-lock.json` with `package.json`.
- Verified locally: `npm ci` completes with code 0 (`added 70 packages, and audited 71 packages in 8s`).
- Commit and push `package-lock.json` to GitHub so GitHub Actions runs cleanly.

***

## 2. Feature Implementation: Ecruteak City & Burned Tower Sequence

### A. Burned Tower 1F — Rival Silver Ambush
- **Map**: `burned_tower_1f` (20x18 grid)
- **NPCs**:
  - `silver_burned` at coordinates `(10, 10)`, facing `DOWN`.
  - `eusine` at `(10, 12)`, facing `UP` or `DOWN`.
  - `morty_burned` at `(12, 12)`.
- **Logic**:
  - Interacting with `silver_burned` or stepping onto the corridor towards `(10, 9)` triggers Silver's challenge:
    *"SILVER: …Hmph! What are you doing here? Only weak trainers babble about legendaries. I only care about strong, ruthless POKéMON! Let me show you what that means!"*
  - **Starter-Scaled Rival Team**:
    - If Player picked Cyndaquil: Croconaw Lv. 22, Magnemite Lv. 18, Zubat Lv. 20, Haunter Lv. 20
    - If Player picked Totodile: Bayleef Lv. 22, Magnemite Lv. 18, Zubat Lv. 20, Haunter Lv. 20
    - If Player picked Chikorita: Quilava Lv. 22, Magnemite Lv. 18, Zubat Lv. 20, Haunter Lv. 20
  - On defeat, Silver steps aside and sets `EVENT_BEAT_BURNED_TOWER_SILVER`, clearing access to the hole at `(10, 9)`.

### B. Burned Tower B1F — Legendary Beasts Awakening
- **Map**: `burned_tower_b1f`
- **Cutscene Trigger**: Player drops through the hole at `(10, 9)` and approaches the stone statues at `(10, 3)`:
  - Freeze player movement during event (`isCutsceneLocked = true`).
  - Screen shake and flash sequence.
  - Authentic cries: Raikou, Entei, and Suicune.
  - Dialogue sequence:
    1. *"Three legendary beasts stand frozen like statues…"*
    2. *"The stone glows with ancient celestial brilliance!"*
    3. *"RAIKOU and ENTEI roar and leap from the cavern, scattering across the Johto overworld!"*
    4. *"SUICUNE steps forward, stares deep into your eyes, and gracefully bounds into the mist!"*
  - Activation:
    - Sets `storyFlags.add('beasts_awakened')` and `storyFlags.add('EVENT_RELEASED_THE_BEASTS')`.
    - Activates Raikou and Entei into `RoamingManager`.
    - Eusine descends to express his awe at Suicune's interaction with the player.
    - Morty returns to Ecruteak Gym to await the player's challenge.

### C. Ecruteak Gym — Invisible Floor Pitfall Maze
- **Map**: `ecruteak_gym` (10x18 grid)
- **Gating**:
  - If `!storyFlags.has('beasts_awakened')`:
    - Gym Guide informs the player that Leader Morty is meditating at the Burned Tower.
- **Maze Safe Coordinates**:
  - Spanning y: 4 through y: 15.
  - Definitive safe path connecting the entrance landing `(4, 16)/(5, 16)` through Medium Martha `(2, 7)` and Sage Ping `(7, 9)` to Leader Morty `(4, 3)`.
  - Stepping onto any non-safe floor tile triggers pitfall physics:
    - Screen shake + `BUMP` sound effect.
    - Warps the player back to `(4, 16)` facing `UP`.
    - Toast: *"Whoa! Stepped off the invisible path!"*

### D. Gym Leader Morty Battle & Rewards
- **Morty's Team**:
  - Gastly Lv. 21 (Lick, Spite, Curse, Mean Look)
  - Haunter Lv. 21 (Hypnosis, Dream Eater, Curse, Night Shade)
  - Gengar Lv. 25 (Shadow Ball, Hypnosis, Dream Eater, Mean Look)
  - Haunter Lv. 23 (Spite, Curse, Night Shade, Confuse Ray)
- **Victory Rewards**:
  - `FOG BADGE` awarded to `inventory.badges` (all Pokémon up to Lv. 50 obey).
  - Authorizes overworld field usage of `HM03 SURF`.
  - Awards `TM30 SHADOW BALL` (infinite TM).
  - Updates Trainer Card and sets `storyFlags.add('morty_defeated')`.

***

## 3. Verification Plan

1. **Automated Unit Tests**:
   - Create `tests/EcruteakCityAndMorty.test.ts`:
     - Test Silver Burned Tower 1F encounter and starter scaling.
     - Test Legendary Beasts awakening flags and RoamingManager registration.
     - Test Ecruteak Gym invisible floor safe path matrix and pitfall warp trigger.
     - Test Leader Morty victory rewards (Fog Badge, TM30, Surf unlock).
   - Run full suite: `npm test` (all 451+ tests passing).
2. **Build & CI Verification**:
   - `compile_applet` clean build.
   - Commit and push to GitHub repository with synced `package-lock.json`.
   - Verify GitHub Actions workflow run passes.
