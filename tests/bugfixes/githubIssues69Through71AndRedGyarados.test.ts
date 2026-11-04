// Mock minimal browser globals for PixiJS environment hydration in node
if (typeof navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', maxTouchPoints: 0 },
    configurable: true,
    writable: true,
  });
}
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNpcsByMap } from '../../src/world/npcData';
import { NPC_SHEET_PATHS } from '../../src/render/OverworldNpcAndItemSprites';
import { PokemonFactory } from '../../src/battle/PokemonFactory';
import { isNpcActiveForStoryFlags } from '../../src/world/npcs/npcShared';
import { handleRedGyarados, handleLakeLance } from '../../src/world/interactions/MahoganyTownAndLakeInteractions';
import { getEarlyJohtoQuestInteractions } from '../../src/world/interactions/EarlyJohtoQuestInteractions';
import type { MapData } from '../../src/types/game';

describe('GitHub Issues #69 through #71 & Red Gyarados Features Verification Suite', () => {
  const mapsDir = path.resolve(__dirname, '../../public/assets/data/maps');
  const bundlePath = path.resolve(__dirname, '../../public/assets/data/world_maps.json');
  const charDir = path.resolve(__dirname, '../../public/assets/sprites/characters');
  const pokeDir = path.resolve(__dirname, '../../public/assets/sprites/pokemon');

  it('Issue #69: Mahogany Town Rocket Grunt is positioned at (11, 8) outside Souvenir Shop on a walkable tile', () => {
    const npcs = createNpcsByMap();
    const mtNpcs = npcs.mahogany_town || [];
    const rocket = mtNpcs.find((n) => n.id === 'mahogany_town_rocket_1');

    expect(rocket).toBeDefined();
    expect(rocket?.x).toBe(11);
    expect(rocket?.y).toBe(8);
    expect(rocket?.spriteType).toBe('rocket_grunt_m');

    // Verify tile at (11, 8) is walkable (0) in mahogany_town.json
    const mt: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'mahogany_town.json'), 'utf8'));
    expect(mt.collisionGrid[8 * mt.width + 11]).toBe(0);

    // Verify grunt lifecycle: present before clearing base, disappears after
    const flagsBefore = new Set<string>();
    expect(isNpcActiveForStoryFlags('mahogany_town_rocket_1', flagsBefore)).toBe(true);

    const flagsAfter = new Set<string>(['rocket_base_generator_cleared']);
    expect(isNpcActiveForStoryFlags('mahogany_town_rocket_1', flagsAfter)).toBe(false);
  });

  it('Issue #70 & #71: Lake of Rage map is canonical Gen 2 layout with tree maze and no beta buildings', () => {
    const lor: MapData = JSON.parse(fs.readFileSync(path.join(mapsDir, 'lake_of_rage.json'), 'utf8'));

    // 1. Dimensions: 40x36 step tiles (20x18 blocks)
    expect(lor.width).toBe(40);
    expect(lor.height).toBe(36);

    // 2. No beta buildings (Poke Center, Mart, Gym) in tileMap
    const hasBetaBuildingTiles = lor.tileMap.some(
      (t) => t && (t.includes('mart') || t.includes('center') || t.includes('gym'))
    );
    expect(hasBetaBuildingTiles).toBe(false);

    // 3. Warps: Hidden Power House at (7, 3) and Magikarp Fishing Guru House at (27, 31)
    const hiddenPowerWarp = lor.warps.find((w) => w.targetMapId === 'lake_of_rage_hidden_power_house');
    expect(hiddenPowerWarp).toBeDefined();
    expect(hiddenPowerWarp?.x).toBe(7);
    expect(hiddenPowerWarp?.y).toBe(3);

    const magikarpWarp = lor.warps.find((w) => w.targetMapId === 'lake_of_rage_magikarp_house');
    expect(magikarpWarp).toBeDefined();
    expect(magikarpWarp?.x).toBe(27);
    expect(magikarpWarp?.y).toBe(31);

    // 4. Warp tiles are walkable (0)
    expect(lor.collisionGrid[3 * lor.width + 7]).toBe(0);
    expect(lor.collisionGrid[31 * lor.width + 27]).toBe(0);

    // 5. Verify world_maps.json bundle has the canonical Lake of Rage
    const worldMaps: MapData[] = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
    const bundledLor = worldMaps.find((m) => m.id === 'lake_of_rage');
    expect(bundledLor).toBeDefined();
    expect(bundledLor?.width).toBe(40);
    expect(bundledLor?.height).toBe(36);
    expect(bundledLor?.warps).toEqual(lor.warps);
  });

  it('Red Gyarados Sprite: Authentic red gyarados spritesheet is distinct from Lapras and correctly mapped', () => {
    // 1. NPC_SHEET_PATHS configuration
    expect(NPC_SHEET_PATHS.red_gyarados).toBe('./assets/sprites/characters/red_gyarados.png');
    expect(NPC_SHEET_PATHS.gyarados).toBe('./assets/sprites/characters/gyarados.png');

    // 2. Physical files exist
    const redGyaradosPath = path.join(charDir, 'red_gyarados.png');
    const gyaradosPath = path.join(charDir, 'gyarados.png');
    const laprasPath = path.join(charDir, 'lapras.png');

    expect(fs.existsSync(redGyaradosPath)).toBe(true);
    expect(fs.existsSync(gyaradosPath)).toBe(true);
    expect(fs.existsSync(laprasPath)).toBe(true);

    const redBuf = fs.readFileSync(redGyaradosPath);
    const laprasBuf = fs.readFileSync(laprasPath);

    // 3. PNG header checks: width 144, height 32
    expect(redBuf.readUInt32BE(16)).toBe(144);
    expect(redBuf.readUInt32BE(20)).toBe(32);

    // 4. Must NOT be identical to lapras.png
    expect(redBuf.equals(laprasBuf)).toBe(false);

    // 5. Shiny battle sprites exist
    const shinyFront = path.join(pokeDir, 'gyarados_shiny_front.png');
    const shinyBack = path.join(pokeDir, 'gyarados_shiny_back.png');
    expect(fs.existsSync(shinyFront)).toBe(true);
    expect(fs.existsSync(shinyBack)).toBe(true);
  });

  it('Red Gyarados Overworld Entity: Located at (18, 22) with red_gyarados sprite and canonical trainers', () => {
    const npcs = createNpcsByMap();
    const lorNpcs = npcs.lake_of_rage || [];

    // Red Gyarados
    const gyarados = lorNpcs.find((n) => n.id === 'lake_of_rage_red_gyarados');
    expect(gyarados).toBeDefined();
    expect(gyarados?.x).toBe(18);
    expect(gyarados?.y).toBe(22);
    expect(gyarados?.spriteType).toBe('red_gyarados');

    // Lance at shoreline
    const lance = lorNpcs.find((n) => n.id === 'lake_of_rage_lance');
    expect(lance).toBeDefined();
    expect(lance?.x).toBe(21);
    expect(lance?.y).toBe(28);

    // Wesley of Wednesday in the northwest maze
    const wesley = lorNpcs.find((n) => n.id === 'wesley_of_wednesday');
    expect(wesley).toBeDefined();
    expect(wesley?.x).toBe(4);
    expect(wesley?.y).toBe(4);

    // Canonical trainers
    const andre = lorNpcs.find((n) => n.id === 'lake_of_rage_andre');
    expect(andre).toBeDefined();
    expect(andre?.x).toBe(30);
    expect(andre?.y).toBe(23);

    const lois = lorNpcs.find((n) => n.id === 'lake_of_rage_lois');
    expect(lois).toBeDefined();
    expect(lois?.x).toBe(36);
    expect(lois?.y).toBe(7);
  });

  it('Red Gyarados Boss Encounter: Creates Lv. 30 shiny Gyarados, awards Red Scale, and triggers Lance', () => {
    // 1. PokemonFactory creates Lv. 30 shiny Gyarados
    const boss = PokemonFactory.createShinyRedGyarados(30);
    expect(boss.speciesId).toBe('gyarados');
    expect(boss.level).toBe(30);
    expect(boss.isShiny).toBe(true);
    expect(boss.moves.map((m) => m.moveId)).toEqual([
      'dragonrage',
      'twister',
      'leer',
      'bite',
    ]);
    expect(boss.heldItem).toBe('red-scale');

    // 2. Red Gyarados lifecycle
    const initialFlags = new Set<string>();
    expect(isNpcActiveForStoryFlags('lake_of_rage_red_gyarados', initialFlags)).toBe(true);
    expect(isNpcActiveForStoryFlags('lake_of_rage_lance', initialFlags)).toBe(false);

    // 3. Mock battle interaction
    const inventory: any = { items: {}, keyItems: [], tms: [], balls: {} };
    let battlePokemon: any = null;
    let battleEndCallback: any = null;
    let openedDialogues: string[][] = [];

    const mockCtx: any = {
      storyFlags: initialFlags,
      inventory,
      playerName: 'RED',
      playerParty: [{ nickname: 'TYPHLOSION' }],
      openDialogue: (pages: string[], _speaker?: string, onComplete?: () => void) => {
        openedDialogues.push(pages);
        if (onComplete) onComplete();
      },
      triggerBattle: (pkmn: any, options: any) => {
        battlePokemon = pkmn;
        battleEndCallback = options.onBattleEnd;
      },
      addOverworldItemToInventory: (itemId: string) => {
        if (!inventory.keyItems) inventory.keyItems = [];
        inventory.keyItems.push(itemId);
      },
      mapManager: { getCurrentMap: () => null },
      saveCurrentGame: () => {},
      showToast: () => {},
    };

    const targetNpc: any = { id: 'lake_of_rage_red_gyarados' };
    const handled = handleRedGyarados(targetNpc, {} as any, mockCtx);
    expect(handled).toBe(true);
    expect(battlePokemon).toBeDefined();
    expect(battlePokemon.isShiny).toBe(true);

    // Player wins battle
    battleEndCallback({ winner: 'PLAYER' });

    // Verifications after win
    expect(initialFlags.has('red_gyarados_subdued')).toBe(true);
    expect(initialFlags.has('EVENT_LAKE_OF_RAGE_RED_GYARADOS')).toBe(true);
    expect(inventory.keyItems).toContain('red_scale');

    // Red Gyarados despawns, Lance spawns
    expect(isNpcActiveForStoryFlags('lake_of_rage_red_gyarados', initialFlags)).toBe(false);
    expect(isNpcActiveForStoryFlags('lake_of_rage_lance', initialFlags)).toBe(true);

    // Talk to Lance at shoreline
    handleLakeLance({ id: 'lake_of_rage_lance' } as any, {} as any, mockCtx);
    expect(initialFlags.has('lance_lake_talked')).toBe(true);
    expect(initialFlags.has('EVENT_DECIDED_TO_HELP_LANCE')).toBe(true);

    // Lance departs shoreline
    expect(isNpcActiveForStoryFlags('lake_of_rage_lance', initialFlags)).toBe(false);
  });

  it('Mr. Pokémon Red Scale Trade: Trades Red Scale for Exp. Share with authentic dialogue and flags', () => {
    const interactions = getEarlyJohtoQuestInteractions();
    const mrPokemonReg = interactions.find((r) => r.npcIds?.includes('mr_pokemon_npc'));
    expect(mrPokemonReg).toBeDefined();

    const storyFlags = new Set<string>(['HAS_MYSTERY_EGG', 'EVENT_GAVE_MYSTERY_EGG_TO_ELM']);
    const inventory: any = { items: {}, keyItems: ['red_scale'], tms: [], balls: {} };
    let dialogs: string[][] = [];

    const mockCtx: any = {
      storyFlags,
      inventory,
      playerName: 'GOLD',
      openDialogue: (pages: string[], _speaker?: string, onComplete?: () => void) => {
        dialogs.push(pages);
        if (onComplete) onComplete();
      },
      healPlayerParty: () => {},
      saveCurrentGame: () => {},
      playFieldRestAnimation: () => {},
      showToast: () => {},
      addOverworldItemToInventory: (itemId: string) => {
        if (!inventory.items) inventory.items = {};
        inventory.items[itemId] = (inventory.items[itemId] || 0) + 1;
      },
    };

    const targetNpc: any = { id: 'mr_pokemon_npc', speaker: '🎩 MR. POKéMON' };
    const handled = mrPokemonReg?.handler(targetNpc, {} as any, mockCtx);
    expect(handled).toBe(true);

    // Red Scale consumed, Exp. Share awarded
    expect(inventory.keyItems).not.toContain('red_scale');
    expect(inventory.items['exp-share']).toBe(1);
    expect(storyFlags.has('received_exp_share')).toBe(true);
    expect(storyFlags.has('EVENT_GOT_EXP_SHARE_FROM_MR_POKEMON')).toBe(true);

    // Verify dialogue text mentions Red Scale and Exp. Share
    const flatDialogs = dialogs.flat().join(' ');
    expect(flatDialogs).toContain('That SCALE!');
    expect(flatDialogs).toContain('EXP.SHARE');
  });
});
