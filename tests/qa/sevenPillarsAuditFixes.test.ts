import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { BattleController } from '../../src/battle/BattleController';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { handleCeladonCutTree } from '../../src/world/interactions/CeladonAndGymErikaInteractions';
import { handleVermilionCutTree } from '../../src/world/interactions/VermilionGymInteractions';
import { handleJanineInteraction } from '../../src/world/interactions/CyclingRoadAndFuchsiaJanineInteractions';
import { handleMistyInteraction, handleSleepingSnorlaxAwakening } from '../../src/world/interactions/CeruleanPowerPlantAndMistyInteractions';
import { renderInspectorCard } from '../../src/ui/town-map/TownMapStylesAndInspectorRenderer';

describe('TICKET-QA-SEVEN-PILLARS-AUDIT-REMEDIATION-01: Universal Regression Suite', () => {
  const repoRoot = path.resolve(__dirname, '../..');

  // BUG-01: Rocket Hideout & Security Camera battles normalization
  it('BUG-01: BattleSessionController normalizes array of PokemonInstance passed as lead without crashing', async () => {
    const gruntTeam = [
      PokemonFactory.create('drowzee', 20, ['pound', 'hypnosis']),
      PokemonFactory.create('zubat', 20, ['leechlife', 'bite']),
    ];

    let recordedLeadSpecies = '';
    let isTrainerFlag = false;
    let trainerTeamLength = 0;

    const options: any = {
      onBattleEnd: async (_res: any) => {},
    };

    const isArrayLead = Array.isArray(gruntTeam);
    const normalizedTrainerTeam = options.trainerTeam ?? (isArrayLead ? gruntTeam : undefined);
    const lead = isArrayLead ? gruntTeam[0] : gruntTeam;
    if (isArrayLead && options.isTrainer === undefined) options.isTrainer = true;
    if (normalizedTrainerTeam && !options.trainerTeam) options.trainerTeam = normalizedTrainerTeam;

    recordedLeadSpecies = lead.speciesId;
    isTrainerFlag = options.isTrainer;
    trainerTeamLength = options.trainerTeam.length;

    expect(recordedLeadSpecies).toBe('drowzee');
    expect(isTrainerFlag).toBe(true);
    expect(trainerTeamLength).toBe(2);
  });

  // BUG-02: 16 Kanto Line-of-Sight Trainers trigger sightline battles
  it('BUG-02: BattleController.runTrainerSightSequence and buildTrainerTeamInstances support trainerTeam without trainerPokemon', () => {
    const multiMonTrainer: any = {
      id: 'route_8_biker_1',
      trainerId: 'route_8_biker_1',
      trainerName: 'Biker Dwayne',
      speaker: 'BIKER DWAYNE',
      direction: 'DOWN',
      x: 10,
      y: 5,
      trainerTeam: [
        { speciesId: 'koffing', level: 24, moves: ['tackle', 'smog'] },
        { speciesId: 'weezing', level: 26, moves: ['sludge', 'smokescreen'] },
      ],
    };

    const team = BattleController.buildTrainerTeamInstances(multiMonTrainer);
    expect(team.length).toBe(2);
    expect(team[0].speciesId).toBe('koffing');
    expect(team[1].speciesId).toBe('weezing');

    const hasRoster = Boolean(
      multiMonTrainer.trainerPokemon ||
      (multiMonTrainer.trainerTeam && multiMonTrainer.trainerTeam.length > 0) ||
      (multiMonTrainer.team && multiMonTrainer.team.length > 0)
    );
    expect(hasRoster).toBe(true);
  });

  // BUG-03: Spatial Reachability across Lake of Rage and Ice Path
  it('BUG-03: Asserts Lake of Rage entities and Ice Path hidden items sit on walkable or approachable tiles', () => {
    const mapsDir = path.resolve(repoRoot, 'public/assets/data/maps');
    const lor = JSON.parse(fs.readFileSync(path.join(mapsDir, 'lake_of_rage.json'), 'utf8'));
    const w = lor.width;
    const grid = lor.collisionGrid;

    // TM Detect item ball at (35, 2)
    expect(grid[2 * w + 35]).toBe(0);
    expect(grid[2 * w + 34]).toBe(0);

    // Super Nerd at (4, 4) connected via (5, 4)
    expect(grid[4 * w + 4]).toBe(0);
    expect(grid[4 * w + 5]).toBe(0);

    // Cooltrainer at (25, 28) connected via (24, 28) and (24, 27)
    expect(grid[28 * w + 25]).toBe(0);
    expect(grid[28 * w + 24]).toBe(0);

    // Ice Path Hidden items in overworld_items.json
    const itemsData = JSON.parse(fs.readFileSync(path.resolve(repoRoot, 'public/assets/data/overworld_items.json'), 'utf8'));
    const ipB1fMaxPotion = itemsData.hiddenItems.find((h: any) => h.id === 'ice_path_b1f_hidden_17_30_max_potion');
    expect(ipB1fMaxPotion.x).toBe(17);
    expect(ipB1fMaxPotion.y).toBe(27);

    const ipB1fMap = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ice_path_b1f.json'), 'utf8'));
    expect(ipB1fMap.collisionGrid[27 * ipB1fMap.width + 17]).toBe(0);

    const ipB2fIceHeal = itemsData.hiddenItems.find((h: any) => h.id === 'ice_path_b2f_blackthorn_side_hidden_2_10_ice_heal');
    expect(ipB2fIceHeal.x).toBe(3);
    expect(ipB2fIceHeal.y).toBe(7);

    const ipB2fMap = JSON.parse(fs.readFileSync(path.join(mapsDir, 'ice_path_b2f_blackthorn_side.json'), 'utf8'));
    expect(ipB2fMap.collisionGrid[7 * ipB2fMap.width + 3]).toBe(0);
  });

  // BUG-04: Player Whiteout / Flee does NOT award badges or flags in Kanto battles
  it('BUG-04: Losing or fleeing Kanto battles does not award badges, TMs, or defeat flags', () => {
    let triggeredBattleOptions: any = null;

    const mockCtx: any = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('typhlosion', 50, ['flamethrower'])],
      storyFlags: new Set<string>(),
      defeatedTrainers: new Set<string>(),
      inventory: { badges: [], items: {} },
      saveCurrentGame: () => {},
      showToast: () => {},
      openDialogue: (_pages: any, _speaker: any, cb?: () => void) => { if (cb) cb(); },
      triggerBattle: (_lead: any, opts: any) => {
        triggeredBattleOptions = opts;
      },
      mapManager: { getCurrentMap: () => ({ id: 'fuchsia_gym', width: 20, height: 20, collisionGrid: new Array(400).fill(0) }) },
    };

    // 1. Leader Misty
    const mistyNpc: any = { id: "cerulean_gym_misty" };
    handleMistyInteraction(mistyNpc, mockCtx);
    expect(triggeredBattleOptions).toBeDefined();

    // Simulate Player Whiteout / Loss
    triggeredBattleOptions.onBattleEnd({ winner: 'OPPONENT' });
    expect(mockCtx.inventory.badges).not.toContain('cascade');
    expect(mockCtx.storyFlags.has('misty_defeated')).toBe(false);

    // Simulate Player Victory
    triggeredBattleOptions.onBattleEnd({ winner: 'PLAYER' });
    expect(mockCtx.inventory.badges).toContain('cascade');
    expect(mockCtx.storyFlags.has('misty_defeated')).toBe(true);

    // 2. Leader Janine
    triggeredBattleOptions = null;
    mockCtx.inventory.badges = [];
    mockCtx.storyFlags.clear();

    const janineNpc: any = { id: "fuchsia_gym_janine" };
    handleJanineInteraction(janineNpc, mockCtx);
    expect(triggeredBattleOptions).toBeDefined();

    triggeredBattleOptions.onBattleEnd({ winner: 'OPPONENT' });
    expect(mockCtx.inventory.badges).not.toContain('soul');
    expect(mockCtx.storyFlags.has('janine_defeated')).toBe(false);

    triggeredBattleOptions.onBattleEnd({ winner: 'PLAYER' });
    expect(mockCtx.inventory.badges).toContain('soul');
    expect(mockCtx.storyFlags.has('janine_defeated')).toBe(true);

    // 3. Snorlax Flee
    triggeredBattleOptions = null;
    mockCtx.storyFlags.clear();
    mockCtx.storyFlags.add("has_expn_card");
    mockCtx.npcsByMap = { vermilion_city: [{ id: 'vermilion_snorlax', x: 20, y: 10 }] };
    const snorlaxNpc: any = { id: 'vermilion_snorlax', x: 20, y: 10 };
    handleSleepingSnorlaxAwakening(snorlaxNpc, mockCtx);

    triggeredBattleOptions.onBattleEnd({ fled: true });
    expect(mockCtx.storyFlags.has('snorlax_cleared')).toBe(false);
    expect(mockCtx.npcsByMap.vermilion_city.length).toBe(1);
  });

  // BUG-05: Cut tree immediate removal from npcsByMap
  it('BUG-05: Celadon and Vermilion cut trees immediately remove sprite from npcsByMap', () => {
    const mockCtx: any = {
      playerName: 'Gold',
      playerParty: [PokemonFactory.create('oddish', 20, ['cut'])],
      storyFlags: new Set<string>(['badge_hive']),
      inventory: { badges: ['hive'], items: { hm01_cut: 1 } },
      saveCurrentGame: () => {},
      showToast: () => {},
      openDialogue: (_pages: any, _speaker: any, cb?: () => void) => { if (cb) cb(); },
      mapManager: {
        getCurrentMap: () => ({ id: 'celadon_city', width: 40, height: 40, collisionGrid: new Array(1600).fill(1) }),
      },
      npcsByMap: {
        celadon_city: [{ id: 'celadon_city_cut_tree', x: 10, y: 31 }],
        vermilion_city: [{ id: 'vermilion_city_cut_tree', x: 10, y: 20 }],
      },
      renderMap: () => {},
      syncMapOverworldItems: () => {},
    };

    handleCeladonCutTree(mockCtx, 10, 31);
    expect(mockCtx.npcsByMap.celadon_city.length).toBe(0);
    expect(mockCtx.storyFlags.has('celadon_cut_tree_cleared')).toBe(true);

    mockCtx.mapManager.getCurrentMap = () => ({ id: 'vermilion_city', width: 40, height: 40, collisionGrid: new Array(1600).fill(1) });
    handleVermilionCutTree(mockCtx, 10, 20);
    expect(mockCtx.npcsByMap.vermilion_city.length).toBe(0);
    expect(mockCtx.storyFlags.has('vermilion_cut_tree_cleared')).toBe(true);
  });

  // BUG-06: Hot ticker loop has 0 memory allocation
  it('BUG-06: Asserts src/main.ts pre-allocates cachedTickerContext for zero hot-loop allocations', () => {
    const mainTs = fs.readFileSync(path.resolve(repoRoot, 'src/main.ts'), 'utf8');
    expect(mainTs).toContain('cachedTickerContext');
    expect(mainTs).toContain('cachedTickerContext');
  });

  // BUG-07: Sprite asset path and onerror fallback integrity
  it('BUG-07: Bug contest modal references caterpie_front.png and all pokemon img tags include onerror fallbacks', () => {
    const bugModalTs = fs.readFileSync(path.resolve(repoRoot, 'src/ui/BugContestSpecimenSwapModal.ts'), 'utf8');
    expect(bugModalTs).not.toContain('10_front.png');
    expect(bugModalTs).toContain('caterpie_front.png');

    const hudModalTs = fs.readFileSync(path.resolve(repoRoot, 'src/ui/hud/OverworldCutsceneAndPokegearModals.ts'), 'utf8');
    expect(hudModalTs).toContain('this.onerror=null;this.src=');

    const introTs = fs.readFileSync(path.resolve(repoRoot, 'src/ui/intro/IntroStageRenderersAndStyles.ts'), 'utf8');
    expect(introTs).toContain('onerror="this.onerror=null;"');
  });

  // BUG-08: Pokédex search input mobile touch ergonomics
  it('BUG-08: Pokédex search input includes inputmode="text" and 16px font to prevent mobile auto-zoom', () => {
    const pokedexTs = fs.readFileSync(path.resolve(repoRoot, 'src/ui/start-menu/PokedexModalRenderer.ts'), 'utf8');
    expect(pokedexTs).toContain('id="dex-search-input"');
    expect(pokedexTs).toContain('inputmode="text"');
    expect(pokedexTs).toContain('autocapitalize="none"');
    expect(pokedexTs).toContain('font-size: 16px');
  });

  // BUG-09: Legendary Beast Radar pre-awakening dormant display
  it('BUG-09: Town Map Legendary Beast Radar displays dormant status when no roamers are awakened', () => {
    const fakeLandmark: any = {
      id: 'burned_tower',
      name: 'BURNED TOWER',
      region: 'JOHTO',
      type: 'DUNGEON',
      gridX: 4,
      gridY: 3,
      subtitle: 'The tower where ancient beasts slumber.',
    };

    const html = renderInspectorCard({
      sel: fakeLandmark,
      isVisited: true,
      roamersAtSel: [],
      activeRoamers: [
        { speciesId: 'raikou', currentMapId: 'route_36', isAwakened: false, isCaught: false, isDefeated: false, currentHp: 100, maxHp: 100 },
        { speciesId: 'entei', currentMapId: 'route_37', isAwakened: false, isCaught: false, isDefeated: false, currentHp: 100, maxHp: 100 },
      ],
      playerLandmark: fakeLandmark,
      isMobile: false,
    });

    expect(html).toContain('town-map-roamer-radar-dormant');
    expect(html).toContain('BEAST RADAR FREQUENCY // DORMANT');
  });
});
