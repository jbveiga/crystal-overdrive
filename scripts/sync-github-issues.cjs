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
