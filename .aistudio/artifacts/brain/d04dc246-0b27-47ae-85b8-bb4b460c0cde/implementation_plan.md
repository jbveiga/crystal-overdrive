# Crystal Overdrive: Dev Server Stabilization, Battle Menu Unfreeze & Next Milestones

Thorough implementation plan to resolve the dev server startup failure, fix the battle freeze when clicking an invalid party member (such as the active Pokémon), and map out the next development milestones for Crystal Overdrive.

***

## 1. Problem Analysis & Diagnostics

### A. Dev Server Startup Failure
- **Root Cause**: During an environment reboot, several source files in `src/core/`, `src/ui/`, `src/audio/`, and build scripts were missing from the local workspace. Because TypeScript (`tsc`) and Vite could not resolve imports (`BattleHUD`, `GameClock`, `GridPhysics`, etc.), the development server failed to compile and crashed.
- **Resolution**:
  - Restored all missing source modules and scripts.
  - Verified `scripts/build-world-maps.cjs` bundle handler.
  - Restarted dev server process on port 3000.

### B. Battle Freeze Bug ("<Pokemon> is already in battle!")
- **Root Cause**: In `src/ui/BattleHUD.ts` (lines 933–945), when the player opens the Party menu during combat and clicks a Pokémon:
  ```ts
  if (isActive) {
    this.showMessage(`${pkmn.nickname} is already in battle!`);
    return;
  }
  ```
  `showMessage()` hides all menus (`fightMenu`, `bagMenu`, `partyMenu`, `actionMenu`), displays `messageBox`, types out the message, and then completes. However, because the click handler was synchronous and never restored `partyMenu` or `actionMenu`, the UI was left with only the message box displayed, completely freezing battle progression.
- **Resolution**:
  - Convert party selection handlers to `async`.
  - When clicking an invalid choice (Active Pokémon, Egg, or Fainted):
    1. Display the notification message.
    2. Await the brief display timeout (or allow user to click/press Space to skip).
    3. Smoothly restore `partyMenu` (or `actionMenu` if returning) so the player can pick another Pokémon or click `← BACK` to return to combat commands.
  - Additionally, add an inline toast / status hint directly on the party member card or top banner, preventing menu flicker.

***

## 2. Next Major Milestones Roadmap

| Area | Feature / Milestone | Value & Details |
| :--- | :--- | :--- |
| **1. Battle UX Polish** | Unfreeze party invalid click + In-battle Shift/Summary modal | Prevents locks when selecting active Pokémon, allows checking moves & stats mid-battle. |
| **2. Phase 9: Ecruteak City & Morty** | Burned Tower, Legendary Beasts awakening, Ecruteak Gym & Fog Badge | Complete Gym 4 progression with Ghost-type Leader Morty, Gengar, TM30 Shadow Ball, and Surf authorization. |
| **3. National Park & Bug-Catching Contest** | Tuesday/Thursday/Saturday Park Contests | Authentic 20-minute timed contest with 20 Sport Balls, Park Grunt scoring, Sun Stone rewards, and Pinsir/Scyther encounters. |
| **4. PokéGear Radio & Phonebook** | Broadcast audio channels & Trainer rematches | Prof. Oak's Pokémon Talk, Pokémon Music Channel, and calls from Joey, Wade, and Elm. |

***

## 3. Implementation Steps for Current Fixes

1. **BattleHUD Unfreeze**:
   - In `src/ui/BattleHUD.ts`, update party selection listener:
     - `await this.showMessage(...)`
     - Restore `this.partyMenu.style.display = 'grid'` and `this.messageBox.style.display = 'none'`
     - Ensure `backBtn` is active so the player is never trapped.
2. **Automated Test Coverage**:
   - Add unit test in `tests/BattleSpeedAndPacing.test.ts` or new test verifying that clicking an active or fainted Pokémon does not leave the battle HUD in a deadlocked state.
3. **Compilation & Verification**:
   - Run `compile_applet` and `npm test` across all 42 test suites.
