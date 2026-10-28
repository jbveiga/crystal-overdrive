/**
 * scripts/sync-github-issues.cjs
 * Headless CLI tool to synchronize and close addressed GitHub tickets on jbveiga/crystal-overdrive.
 */

const { ISSUE_RESOLUTIONS } = (() => {
  return {
    ISSUE_RESOLUTIONS: {
      8: `### Resolution Details for Issue #8
- **Root Cause**: Defeated line-of-sight trainers in Azalea Gym (Twins Amy & May) retained their forward-walked corridor positions directly in the runtime NPC map registry.
- **Fix**:
  1. Updated \`GridEntity\` and \`makeNpc\` in \`src/world/GridPhysics.ts\` and \`src/world/npcData.ts\` to preserve original coordinates (\`originX\`, \`originY\`, \`originDirection\`).
  2. Implemented \`resetMapNpcsToOrigin(mapId)\` in \`src/main.ts\` which automatically resets all non-event NPCs to their origin coordinates upon entering or warping between maps.
  3. Added immediate origin reset in \`handleTrainerDefeatRewards\` so the central corridor is instantly cleared upon battle completion.`,
      9: `### Resolution Details for Issue #9
- **Root Cause**: Farfetch'd was assigned the human \`bird_keeper\` sprite sheet in \`src/world/npcData.ts\`.
- **Fix**:
  1. Extracted and formatted authentic Gen 2 144x32 overworld sprite sheet in \`public/assets/sprites/characters/farfetchd.png\`.
  2. Registered \`farfetchd\` in \`NpcSpriteType\` (\`src/world/GridPhysics.ts\`) and \`NPC_SHEET_PATHS\` (\`src/render/OverworldRenderer.ts\`).
  3. Updated \`forest_farfetchd\` and \`kiln_farfetchd\` to use \`spriteType: 'farfetchd'\`.`,
      10: `### Resolution Details for Issue #10
- **Root Cause**:
  1. \`EvolutionSceneUI.play()\` defaulted \`mutatePokemon: false\`, preventing \`EvolutionManager.executeEvolution()\` from mutating the Pokémon's \`speciesId\`.
  2. Sprite URLs were configured with absolute root paths (\`/assets/sprites/...\`), failing under Vite's relative base path (\`./\`).
- **Fix**:
  1. Set \`mutatePokemon: true\` by default in \`EvolutionSceneOptions\` in \`src/ui/EvolutionSceneUI.ts\`.
  2. Ensured \`completeEvolution()\` and \`enterTriumphPhase()\` explicitly mutate the Pokémon instance into the target species.
  3. In \`src/main.ts\`, verified \`member.speciesId\` is updated to the evolved species, learnable moves are granted, and save state is persisted.
  4. Switched sprite URLs to relative paths (\`./assets/sprites/pokemon/..._front.png\`).`,
      11: `### Resolution Details for Issue #11
- **Root Cause**: Slowpokes in Slowpoke Well and Azalea Town were mapped to the human \`fat_man\` sprite sheet in \`src/world/npcData.ts\`.
- **Fix**:
  1. Extracted and formatted authentic Gen 2 144x32 overworld sprite sheet in \`public/assets/sprites/characters/slowpoke.png\`.
  2. Registered \`slowpoke\` in \`NpcSpriteType\` and \`NPC_SHEET_PATHS\`.
  3. Updated \`well_slowpoke\`, \`well_slowpoke_2\`, \`azalea_slowpoke\`, and \`azalea_slowpoke_2\` to use \`spriteType: 'slowpoke'\`.`,
      12: `### Resolution Details for Issue #12
- **Root Cause**: On narrow mobile screens (< 480px), the battle log panel experienced layout squishing, poor contrast against canvas backgrounds, and clipped overflow.
- **Fix**:
  1. Redesigned \`#battle-log-panel\` in \`src/ui/BattleLogUI.ts\` with absolute overlay positioning (\`z-index: 60\`), obsidian backdrop (\`rgba(15, 23, 42, 0.98)\`), and responsive width (\`width: min(340px, calc(100vw - 28px))\`).
  2. Increased text size to 12px with high contrast (\`#f1f5f9\`), clear turn dividers, and tactile close button.
  3. Updated \`enemy-card\` and \`player-card\` min-widths in \`src/ui/BattleHUD.ts\` to prevent mobile flex squishing.`,
      15: `### Resolution Details for Issue #15
- **Root Cause**: When using HM01 Cut on the tree blocking the path at Ilex Forest (8, 25), the replacement tile in \`src/main.ts\` was hardcoded to \`'jt_07_07_07_07'\` (a Johto town cobblestone/brick tile), causing an out-of-place brick tile to appear in the forest grass.
- **Fix**:
  1. Implemented \`resolveCutReplacementTile(map, x, y, currentTile)\` helper in \`src/main.ts\` which dynamically checks the current map and adjacent walkable ground tiles.
  2. For \`ilex_forest\` or any tile starting with \`in_forest_\`, returns \`'in_forest_05_05_05_05'\` (authentic walkable forest grass ground).
  3. Ensured both cut interaction and persistent state reload in \`syncMapOverworldItems\` restore \`'in_forest_05_05_05_05'\` at (8, 25) and (8, 22).`,
      16: `### Resolution Details for Issue #16
- **Root Cause**: Tapping the in-game bug report button automatically fired a \`setTimeout\` redirect to GitHub after 1000ms. On mobile browsers (viewport 443x864), web clipboard image paste into GitHub issue forms is not supported, and the automatic redirect prevented users from downloading the captured PNG screenshot first.
- **Fix**:
  1. Removed the automatic \`setTimeout\` / \`directLink?.click()\` redirect in \`mountGitHubReportButton\` in \`src/main.ts\`.
  2. The dialog now stays open, giving players clear step-by-step actions:
     - **💾 SAVE SCREENSHOT PNG**: Downloads the captured screen canvas to device storage.
     - **🚀 OPEN GITHUB ISSUE ↗**: Opens the pre-filled issue form in a new tab when the player is ready to attach the downloaded screenshot.
  3. Updated the issue description template to instruct players to attach their saved screenshot file.`,
      17: `### Resolution Details for Issue #17
- **Root Cause**: In \`public/assets/data/maps/ilex_forest.json\`, coordinate \`(8, 22)\` had \`collision = 0\` and was mistakenly cleared as a cut tree in \`src/main.ts\`, allowing players to walk across the Ilex Forest shrine roof.
- **Fix**:
  1. Updated \`public/assets/data/maps/ilex_forest.json\` so that shrine tiles \`(7, 22)\`, \`(8, 22)\`, \`(9, 22)\`, and \`(8, 23)\` are solid (\`collision = 1\`).
  2. Registered the \`⛩️ ILEX FOREST SHRINE\` bgEvent at \`(8, 23)\` facing UP from \`(8, 24)\`.
  3. Removed \`(8, 22)\` from \`applyMapStoryMutations\` and cut logic in \`src/main.ts\` so the shrine roof is never made walkable.`,
      18: `### Resolution Details for Issue #18
- **Root Cause**: The NPC \`forest_lass\` was placed at \`(3, 24)\` in \`src/world/npcData.ts\`, which occupied the single-tile-wide corridor between trees and trapped players traveling west towards the shrine.
- **Fix**:
  1. Relocated \`forest_lass\` in \`src/world/npcData.ts\` from \`(3, 24)\` to \`(7, 23)\` facing \`DOWN\` in the open clearing beside the shrine.
  2. The single-tile passage at \`(3, 24)\` is now completely unobstructed while her lore dialogue remains accessible.`,
      19: `### Resolution Details for Issue #19
- **Root Cause**: Cut-tree detection in \`src/main.ts\` tested \`facingTileName.includes('_5f')\`, which broadly matched tile \`jt_m_4e_4f_5e_5f\` (the Ilex Forest gate sign at \`3, 9\` in Azalea Town), triggering false "This tree looks like it can be CUT down!" prompts.
- **Fix**:
  1. Added the missing \`🪧 ILEX FOREST GATE\` bgEvent at \`(3, 9)\` in \`public/assets/data/maps/azalea_town.json\`.
  2. Removed ambiguous substrings (\`_5f\` and \`_5b\`) from cut-tree tile checks in \`src/main.ts\` and restricted Cut to authentic cut-tree tile identifiers.`,
      20: `### Resolution Details for Issue #20
- **Root Cause**: When loading a save with \`ilex_tree_cut\`, \`overworldRenderer.renderMap()\` drew the map tile array before \`syncMapOverworldItems\` mutated tile \`(8, 25)\`, causing the cut tree to be rendered on screen.
- **Fix**:
  1. Extracted \`applyMapStoryMutations(map)\` in \`src/main.ts\` which synchronously replaces \`(8, 25)\` with \`in_forest_05_05_05_05\` and sets collision to \`0\`.
  2. Wired \`applyMapStoryMutations\` into boot initialization, map border transitions (West, East, North, South), and \`executeWarpTransition\` immediately before \`overworldRenderer.renderMap()\`.`,
      21: `### Resolution Details for Issue #21
- **Root Cause**: The cut tree replacement logic in \`src/main.ts\` originally cleared coordinate \`(8, 22)\` on every cut tree action and save load, cutting the upper half of the Ilex Forest shrine structure in half.
- **Fix**:
  1. Removed coordinate \`(8, 22)\` completely from cut tree mutation logic in \`src/main.ts\` and \`applyMapStoryMutations\`.
  2. The cut path is strictly confined to \`(8, 25)\`, preserving the intact 3x2 shrine structure at \`y=22-23\` with solid collision.`,
      22: `### Resolution Details for Issue #22
- **Root Cause**:
  1. \`MapManager.isCarpetWarp\` evaluated all outdoor-facing indoor exits as carpet warps regardless of edge position, causing North-facing door warps at \`y=0\` to require \`player.direction === 'DOWN'\`, which blocked players walking North or pressing \`UP\`.
  2. Idle carpet check only tested for \`heldDir === 'DOWN'\`, preventing players parked on \`(4, 0)\` from triggering the exit upon pressing \`UP\`.
  3. Outdoor doorstep landing assumed South exits (\`targetY + 1\`), whereas North gate exits must spawn on the northern apron (\`targetY - 1\` facing \`UP\`).
- **Fix**:
  1. Implemented \`MapManager.getRequiredWarpDirection(warp, currentMap)\` which accurately determines required cardinal direction (\`UP\` for North \`y<=1\`, \`DOWN\` for South, \`LEFT\` for West, \`RIGHT\` for East).
  2. Updated \`MapManager.isCarpetWarp\` to strictly check bottom doorway threshold.
  3. Updated \`resolveWarpTransition\` to spawn North gate exits at \`(targetX, targetY - 1)\` facing \`UP\`.
  4. Updated \`src/main.ts\` idle held-direction check to trigger egress when pressing toward any boundary threshold warp tile.`,
      23: `### Resolution Details for Issue #23
- **Root Cause**: \`scripts/generate-authentic-tiles.cjs\` only generated 4-step shimmer animation frames (\`__w1.png\`, \`__w2.png\`) for outdoor (\`jt_*\`) and cave (\`in_cave_*\`) tilesets, excluding forest tiles (\`in_forest_*\`). Furthermore, \`ANIMATED_WATER_TILES\` in \`src/render/tileConstants.ts\` omitted Ilex Forest water tiles.
- **Fix**:
  1. Updated \`scripts/generate-authentic-tiles.cjs\` to include \`ts.tsName === 'forest'\` in water shimmer frame generation.
  2. Generated all 12 authentic \`__w1.png\` and \`__w2.png\` shimmer frame PNGs for Ilex Forest pond tiles.
  3. Registered \`in_forest_14_14_14_14\`, \`in_forest_09_2a_1b_14\`, \`in_forest_2a_2a_14_14\`, \`in_forest_2a_0b_14_19\`, \`in_forest_1b_14_1b_14\`, and \`in_forest_14_19_14_19\` in \`ANIMATED_WATER_TILES\` (\`src/render/tileConstants.ts\`).`,
      24: `### Resolution Details for Issue #24
- **Root Cause**: \`scripts/generate-authentic-tiles.cjs\` omitted \`TILESETS.johto_modern\` and assigned \`tileset: 'johto'\` to \`route_34\` (as well as \`goldenrod_city\`, \`azalea_town\`, and \`route_33\`). In \`Route34.blk\`, metatile \`0x32\` represents walkable paved road in \`johto_modern\`, but under \`johto\` it decoded to water buoys (\`collision: 3\` / \`1\`) across \`y=22..35\`, trapping the player at \`(15, 36)\` just north of the Ilex Forest Gate.
- **Fix**:
  1. Registered \`johto_modern: loadTileset('johto_modern', true)\` in \`scripts/generate-authentic-tiles.cjs\` with \`jt_m\` tile prefixing.
  2. Configured all 4 canonical \`TILESET_JOHTO_MODERN\` maps (\`route_34\`, \`goldenrod_city\`, \`azalea_town\`, and \`route_33\`) to build with \`tileset: 'johto_modern'\`.
  3. Regenerated all 129 authentic \`jt_m_*.png\` 64x64 quadrant tiles, rebuilt \`route_34.json\` and \`world_maps.json\`, and verified seamless walkable road navigation (\`collision: 0\`) from \`(13, 37)\` / \`(15, 36)\` all the way north into Goldenrod City.`,
      25: `### Resolution Details for Issue #25
- **Root Cause**: In \`src/main.ts\`, step-based wild encounter checks evaluated \`isCaveOrRuins\` using only \`MapManager.isCaveMap(latestMap.id) || latestMap.id.includes('ruins_of_alph')\`. Because \`ilex_forest\` walkable paths use floor tiles (\`tileType === 0\`) rather than tall grass (\`tileType === 2\`), \`canEncounter\` always evaluated to \`false\` in \`src/main.ts\`, preventing \`mapManager.rollWildEncounter()\` from ever being called in Ilex Forest (as well as Sprout Tower, Burned Tower, Tin Tower, and Mt. Mortar).
- **Fix**:
  1. Added unified static helpers \`MapManager.isDungeonOrCaveMap(mapId)\` and \`MapManager.canTriggerWildEncounter(mapId, tileType)\` in \`src/world/MapManager.ts\`.
  2. Updated both \`src/main.ts\` and \`MapManager.rollWildEncounter()\` to use \`MapManager.canTriggerWildEncounter(mapId, tileType)\`, enabling authentic Morning/Day/Night floor and pond wild encounters throughout \`ilex_forest\`.`,
      26: `### Resolution Details for Issue #26
- **Root Cause**: Starter selection logic in \`src/main.ts\` and Elm's Lab table interactions had conflicting starter poke ball coordinates and event flag state checks.
- **Fix**:
  1. Synchronized starter ball coordinates in Elm's Lab to authentic positions: Cyndaquil (6, 3), Totodile (7, 3), Chikorita (8, 3).
  2. Enforced single-starter selection invariant, disabling remaining balls once a starter is chosen.
  3. Added verified unit and integration tests in \`tests/Issue26StarterReconciliation.test.ts\`.`,
      27: `### Resolution Details for Issue #27
- **Commit**: 642fbc3
- **Root Cause**: \`goldenrod_underground_switch_room_entrances.json\` was compiled with incorrect block dimensions (10x18) and omitted 6 of the 9 authentic pret warps, trapping players at (23, 3) or leading to void boundaries.
- **Fix**:
  1. Recompiled map from authentic \`pokecrystal\` disassembly with correct \`blocksW: 15, blocksH: 18\` (width 30, height 36 step tiles).
  2. Populated all 9 canonical warps: (22, 3), (23, 3) -> Goldenrod City (35, 31); (22, 33), (23, 33) -> Warehouse (4, 1); (17, 27) -> Switch Room (11, 8); (28, 19) -> Switch Room (4, 15); (29, 19) -> Switch Room (5, 15); (28, 29) -> Switch Room (4, 25); (29, 29) -> Switch Room (5, 25).
  3. Added verified integration tests in \`tests/bugfixes/githubIssues27Through34.test.ts\`.`,
      28: `### Resolution Details for Issue #28
- **Commit**: 642fbc3
- **Root Cause**: Route 34 Day-Care building entrance door at (12, 15) had solid collision (\`1\`) in \`route_34.json\`, preventing player entry. In addition, \`day_care.json\` exit warps lacked reciprocal threshold alignment with the Route 34 landing tile.
- **Fix**:
  1. Updated \`public/assets/data/maps/route_34.json\` coordinate (12, 15) to walkable \`0\` with door warp targeting \`day_care (2, 7)\`. Set step tile (12, 16) to walkable \`0\`.
  2. Updated \`day_care.json\` front door warps at (2, 7) and (3, 7) to reciprocally return to Route 34 (12, 16).
  3. Configured side yard warps at (0, 5) and (0, 6) to exit to Route 34 fenced yard at (13, 15).`,
      29: `### Resolution Details for Issue #29
- **Commit**: 642fbc3
- **Root Cause**: Goldenrod Dept Store 1F door warp at (2, 0) targeted non-existent elevator map, causing player transition into unmapped memory.
- **Fix**:
  1. Created authentic 6x6 \`goldenrod_dept_store_elevator.json\` with door exit warp at (2, 5) and (3, 5) returning to Dept Store floors.
  2. Added elevator panel bgEvent \`DEPT_ELEVATOR_PANEL\` at (4, 1) and elevator attendant NPC \`dept_elevator_attendant\` at (2, 1).
  3. Connected all Dept Store floors (1F through 6F) door warps at (2, 0) to \`goldenrod_dept_store_elevator (2, 5)\`.`,
      30: `### Resolution Details for Issue #30
- **Commit**: 642fbc3
- **Root Cause**: Receptionist \`dept_rec\` on Goldenrod Dept Store 1F was placed at (10, 2), occupying the counter collision tile and causing player collision conflicts.
- **Fix**:
  1. Repositioned receptionist behind the counter to coordinate (10, 1) facing \`DOWN\` with \`talkAcrossCounter: true\`.
  2. Talking to (10, 1) from across the counter at (10, 2) cleanly opens the 6-floor store directory dialogue.`,
      31: `### Resolution Details for Issue #31
- **Commit**: 642fbc3
- **Root Cause**: Camper Mike NPC was missing from Goldenrod Dept Store 5F at (7, 3), preventing the authentic in-game trade for Machop ("CHRIS").
- **Fix**:
  1. Added Camper Mike NPC \`dept_5f_mike\` at (7, 3) facing \`LEFT\` with action \`DEPT_STORE_TRADE_MIKE\`.
  2. Implemented authentic Gen 2 trade workflow: player trades Drowzee for Machop (Lv. 15, Nickname "CHRIS", OT "MIKE", ID 25740, moves \`['karatechop', 'lowkick', 'leer', 'focusenergy']\`, holding Gold Berry).
  3. Trade sets persistent event flag \`traded_machop_chris\` and updates dialog to post-trade gratitude.`,
      32: `### Resolution Details for Issue #32
- **Commit**: 642fbc3
- **Root Cause**: Dept Store 6F vending machines were blocked by an out-of-place fat man NPC placed at (10, 1), and machines at (8, 1), (9, 1), and (10, 1) lacked interactive bgEvent bindings.
- **Fix**:
  1. Removed misplaced NPC from (10, 1).
  2. Registered all 3 vending machines at (8, 1), (9, 1), and (10, 1) as \`bgEvents\` with action \`'VENDING_MACHINE'\`.
  3. Vending machines dispense Fresh Water (¥200), Soda Pop (¥300), and Lemonade (¥350) with currency validation and inventory insertion.`,
      33: `### Resolution Details for Issue #33
- **Commit**: 642fbc3
- **Root Cause**: Elevator UI included the Roof (ROOF) option, violating authentic Gen 2 Crystal layout where the Dept Store elevator strictly services B1F through 6F (Roof is accessed exclusively by 6F stairs).
- **Fix**:
  1. Updated \`DEPT_STORE_FLOORS\` in \`src/ui/DeptStoreElevatorUI.ts\` to strictly B1F through 6F (7 floors), permanently removing Roof access from elevator floor select.
  2. Verified roof navigation remains accessible solely via authentic 6F stairs.`,
      34: `### Resolution Details for Issue #34
- **Commit**: 642fbc3
- **Root Cause**: Goldenrod Magnet Train Station (\`goldenrod_magnet_train_station.json\`) was compiled using standard \`indoor\` tileset, resulting in missing train track textures, mismatched platform boundaries, and incorrect collision.
- **Fix**:
  1. Updated \`scripts/generate-authentic-tiles.cjs\` to map \`goldenrod_magnet_train_station\` to authentic \`tileset: 'train_station'\`.
  2. Recompiled map with authentic station platform tiles, boarding gates, tracks, and reciprocal station warps.
  3. Verified collision grid: platforms are walkable \`0\` while train tracks are solid \`1\` boundary.`,
    },
  };
})();

async function syncIssues() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('ERROR: GITHUB_TOKEN environment variable is required.');
    process.exit(1);
  }

  const owner = 'jbveiga';
  const repo = 'crystal-overdrive';
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
  };

  console.log(`Checking open issues for ${owner}/${repo}...`);
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open`, {
    headers,
  });

  if (!res.ok) {
    console.error(`GitHub API error ${res.status}: ${res.statusText}`);
    process.exit(1);
  }

  const issues = await res.json();
  console.log(`Found ${issues.length} open issues.`);

  for (const issue of issues) {
    const resolution = ISSUE_RESOLUTIONS[issue.number];
    if (!resolution) {
      console.log(`[-] Skipping issue #${issue.number} ("${issue.title}"): No automated resolution mapping.`);
      continue;
    }

    console.log(`[*] Addressing issue #${issue.number}: "${issue.title}"...`);

    // Post comment
    const commentRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issue.number}/comments`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ body: resolution }),
      }
    );

    if (!commentRes.ok) {
      console.error(`Failed to post comment on #${issue.number}: ${commentRes.statusText}`);
      continue;
    }
    console.log(`    + Posted resolution comment.`);

    // Close issue
    const closeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issue.number}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
      }
    );

    if (!closeRes.ok) {
      console.error(`Failed to close issue #${issue.number}: ${closeRes.statusText}`);
      continue;
    }
    console.log(`    + Closed issue #${issue.number} successfully!`);
  }

  console.log('GitHub sync completed successfully.');
}

syncIssues().catch((err) => {
  console.error(err);
  process.exit(1);
});
