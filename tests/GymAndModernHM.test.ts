import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ModernHMHandler } from '../src/world/ModernHMHandler';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { BattleStateMachine } from '../src/battle/BattleStateMachine';
import type { BagInventory } from '../src/ui/BagAndMartUI';

describe('Azalea Town & Route 33 Authentic johto_modern Tile & Collision Fixes', () => {
  const azaleaPath = path.resolve(__dirname, '../public/assets/data/maps/azalea_town.json');
  const route33Path = path.resolve(__dirname, '../public/assets/data/maps/route_33.json');
  const azaleaMap = JSON.parse(fs.readFileSync(azaleaPath, 'utf-8'));
  const route33Map = JSON.parse(fs.readFileSync(route33Path, 'utf-8'));

  it('uses authentic jt_m_* Slowpoke Well cave entrance tile at (31, 7) with walkable collision', () => {
    const idx = 7 * azaleaMap.width + 31;
    expect(azaleaMap.tileMap[idx]).toBe('jt_m_55_57_35_35');
    expect(azaleaMap.collisionGrid[idx]).toBe(0);

    // Adjacent mound cliff/sign tiles at (29, 7), (30, 7), and (31, 6) are solid johto_modern tiles
    expect(azaleaMap.tileMap[7 * azaleaMap.width + 29]).toBe('jt_m_4e_4f_5e_5f');
    expect(azaleaMap.collisionGrid[7 * azaleaMap.width + 29]).toBe(1);
    expect(azaleaMap.tileMap[7 * azaleaMap.width + 30]).toBe('jt_m_29_2a_4b_48');
    expect(azaleaMap.collisionGrid[7 * azaleaMap.width + 30]).toBe(1);
    expect(azaleaMap.tileMap[6 * azaleaMap.width + 31]).toBe('jt_m_29_2a_4b_48');
    expect(azaleaMap.collisionGrid[6 * azaleaMap.width + 31]).toBe(1);
  });

  it('renders Azalea Poké Mart right-half wall and MART sign with authentic jt_m_* tiles', () => {
    const martSignIdx = 5 * azaleaMap.width + 22;
    const martWallIdx = 5 * azaleaMap.width + 23;
    expect(azaleaMap.tileMap[martSignIdx]).toBe('jt_m_18_19_17_17');
    expect(azaleaMap.tileMap[martWallIdx]).toBe('jt_m_07_1c_02_16_az');
    expect(azaleaMap.collisionGrid[martSignIdx]).toBe(1);
    expect(azaleaMap.collisionGrid[martWallIdx]).toBe(1);
  });

  it('uses authentic jt_m_* headbutt trees in Azalea Town instead of misplaced cave rocks', () => {
    // Headbutt tree pair at x=24..25, y=14..15
    expect(azaleaMap.tileMap[14 * azaleaMap.width + 24]).toBe('jt_m_2b_2c_3b_3c');
    expect(azaleaMap.tileMap[14 * azaleaMap.width + 25]).toBe('jt_m_2c_2d_3c_3d');
    expect(azaleaMap.tileMap[15 * azaleaMap.width + 24]).toBe('jt_m_3b_3c_4b_4c');
    expect(azaleaMap.tileMap[15 * azaleaMap.width + 25]).toBe('jt_m_3c_3d_4c_4d');
    expect(azaleaMap.collisionGrid[14 * azaleaMap.width + 24]).toBe(1);
  });

  it('uses authentic jt_m_* Union Cave entrance at (11, 9) on Route 33 with valid warp', () => {
    const idx = 9 * route33Map.width + 11;
    expect(route33Map.tileMap[idx]).toBe('jt_m_45_22_27_28');
    expect(route33Map.collisionGrid[idx]).toBe(0);
    const warp = route33Map.warps.find((w: { x: number; y: number }) => w.x === 11 && w.y === 9);
    expect(warp).toBeDefined();
    expect(warp.targetMapId).toBe('union_cave_1f');
  });
});

describe('Modern HM Field Move System (No Battle Move Slot Required)', () => {
  const createMockInventory = (badges: string[], tms: string[]): BagInventory => ({
    money: 3000,
    balls: { pokeball: 5 },
    items: {},
    tms,
    badges,
  });

  it('allows Cut in the field with Hive Badge + HM01 even when no party Pokémon has Cut in its 4 move slots', () => {
    const cyndaquil = PokemonFactory.create('cyndaquil', 14);
    cyndaquil.moves = [
      PokemonFactory.createMoveInstance('tackle'),
      PokemonFactory.createMoveInstance('leer'),
      PokemonFactory.createMoveInstance('smokescreen'),
      PokemonFactory.createMoveInstance('ember'),
    ];
    expect(cyndaquil.moves.some((m) => m.moveId === 'cut')).toBe(false);

    const inventory = createMockInventory(['zephyr', 'hive'], ['HM01']);
    const storyFlags = new Set<string>(['bugsy_defeated', 'CAN_USE_CUT']);

    const check = ModernHMHandler.checkCut(inventory, storyFlags, [cyndaquil]);
    expect(check.canUse).toBe(true);
    expect(check.hasBadge).toBe(true);
    expect(check.hasHM).toBe(true);
    expect(check.userPokemon?.speciesId).toBe('cyndaquil');
  });

  it('blocks Cut in the field when missing Hive Badge or HM01 and returns clear reason', () => {
    const cyndaquil = PokemonFactory.create('cyndaquil', 14);
    const noBadgeInv = createMockInventory(['zephyr'], ['HM01']);
    const noBadgeCheck = ModernHMHandler.checkCut(noBadgeInv, new Set(), [cyndaquil]);
    expect(noBadgeCheck.canUse).toBe(false);
    expect(noBadgeCheck.missingReason).toContain('HIVE BADGE');

    const noHmInv = createMockInventory(['zephyr', 'hive'], []);
    const noHmCheck = ModernHMHandler.checkCut(noHmInv, new Set(), [cyndaquil]);
    expect(noHmCheck.canUse).toBe(false);
    expect(noHmCheck.missingReason).toContain('HM01 CUT');
  });

  it('allows Flash in the field with Zephyr Badge + HM05 without occupying a battle move slot', () => {
    const mareep = PokemonFactory.create('mareep', 12);
    mareep.moves = [
      PokemonFactory.createMoveInstance('tackle'),
      PokemonFactory.createMoveInstance('growl'),
      PokemonFactory.createMoveInstance('thundershock'),
      PokemonFactory.createMoveInstance('thunderwave'),
    ];
    expect(mareep.moves.some((m) => m.moveId === 'flash')).toBe(false);

    const inventory = createMockInventory(['zephyr'], ['HM05']);
    const storyFlags = new Set<string>(['falkner_defeated', 'EVENT_GOT_HM05_FLASH']);

    const check = ModernHMHandler.checkFlash(inventory, storyFlags, [mareep]);
    expect(check.canUse).toBe(true);
    expect(check.userPokemon?.speciesId).toBe('mareep');
  });
});

describe('Gym Leader Badge Progression & Signature TM Battle Mechanics', () => {
  it('computes accurate obedience level caps and stat multipliers for Zephyr and Hive Badges', () => {
    expect(PokemonFactory.getObedienceCapForBadges([])).toBe(10);
    expect(PokemonFactory.getObedienceCapForBadges(['zephyr'])).toBe(20);
    expect(PokemonFactory.getObedienceCapForBadges(['zephyr', 'hive'])).toBe(30);

    const mults = PokemonFactory.getBadgeStatMultipliers(['zephyr', 'hive']);
    expect(mults.atk).toBeCloseTo(1.125);
    expect(mults.def).toBeCloseTo(1.125);
    expect(mults.spe).toBeCloseTo(1.0);
  });

  it('applies secondary -1 Accuracy stage drop when TM31 Mud-Slap hits', () => {
    const attacker = PokemonFactory.create('geodude', 15);
    const defender = PokemonFactory.create('mareep', 15);
    attacker.moves = [PokemonFactory.createMoveInstance('mudslap')];
    defender.moves = [PokemonFactory.createMoveInstance('growl')];
    attacker.stats.speed = 100;
    defender.stats.speed = 20;

    const bsm = new BattleStateMachine(attacker, defender, true);
    expect(defender.statStages?.acc).toBe(0);

    const res = bsm.executeRound({ type: 'FIGHT', moveId: 'mudslap' });
    expect(defender.currentHp).toBeLessThan(defender.stats.hp);
    expect(defender.statStages?.acc).toBe(-1);
    expect(res.events.some((e) => e.type === 'MESSAGE' && e.text.includes('Accuracy fell'))).toBe(true);
  });

  it('doubles TM49 Fury Cutter base power on consecutive hits (40 -> 80 -> 160) and resets on other moves', () => {
    const scyther = PokemonFactory.create('scyther', 20);
    const snorlax = PokemonFactory.create('snorlax', 45);
    scyther.moves = [
      PokemonFactory.createMoveInstance('furycutter'),
      PokemonFactory.createMoveInstance('quickattack'),
    ];
    snorlax.moves = [PokemonFactory.createMoveInstance('harden')];
    scyther.stats.speed = 150;
    snorlax.stats.speed = 10;
    snorlax.stats.hp = 9999;
    snorlax.currentHp = 9999;

    const bsm = new BattleStateMachine(scyther, snorlax, false);
    // Make Fury Cutter 100% accurate in test by giving Scyther +6 acc
    scyther.statStages!.acc = 6;

    // Turn 1: First Fury Cutter (streak becomes 1)
    bsm.executeRound({ type: 'FIGHT', moveId: 'furycutter' });
    const streaks = (bsm as unknown as { furyCutterStreaks: Map<string, number> }).furyCutterStreaks;
    expect(streaks.get(scyther.uid)).toBe(1);
    expect(snorlax.statStages?.def).toBe(1); // Snorlax used Harden (+1 Def)

    // Turn 2: Second consecutive Fury Cutter (streak becomes 2 -> 80 BP)
    bsm.executeRound({ type: 'FIGHT', moveId: 'furycutter' });
    expect(streaks.get(scyther.uid)).toBe(2);

    // Turn 3: Third consecutive Fury Cutter (streak becomes 3 -> 160 BP)
    bsm.executeRound({ type: 'FIGHT', moveId: 'furycutter' });
    expect(streaks.get(scyther.uid)).toBe(3);

    // Turn 4: Using Quick Attack resets Fury Cutter streak to 0
    bsm.executeRound({ type: 'FIGHT', moveId: 'quickattack' });
    expect(streaks.get(scyther.uid)).toBe(0);
  });
});
