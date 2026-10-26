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
