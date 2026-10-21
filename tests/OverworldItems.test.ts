import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

interface OverworldItemSummary {
  totalItemBalls: number;
  totalHiddenItems: number;
  totalFruitTrees: number;
  total: number;
  totalMapsWithItems: number;
  johto: {
    itemBalls: number;
    hiddenItems: number;
    fruitTrees: number;
    total: number;
  };
  kanto: {
    itemBalls: number;
    hiddenItems: number;
    fruitTrees: number;
    total: number;
  };
}

interface ItemBallEntry {
  id: string;
  mapId: string;
  region: 'johto' | 'kanto';
  x: number;
  y: number;
  itemId: string;
  eventFlag: string;
}

interface HiddenItemEntry {
  id: string;
  mapId: string;
  region: 'johto' | 'kanto';
  x: number;
  y: number;
  itemId: string;
  eventFlag: string;
}

interface FruitTreeEntry {
  id: string;
  mapId: string;
  region: 'johto' | 'kanto';
  x: number;
  y: number;
  berryId: string;
  treeId: string;
}

interface OverworldItemsData {
  summary: OverworldItemSummary;
  itemBalls: ItemBallEntry[];
  hiddenItems: HiddenItemEntry[];
  fruitTrees: FruitTreeEntry[];
  byMap: Record<
    string,
    {
      mapId: string;
      region: 'johto' | 'kanto';
      itemBalls: ItemBallEntry[];
      hiddenItems: HiddenItemEntry[];
      fruitTrees: FruitTreeEntry[];
    }
  >;
}

describe('Overworld Items & Authentic Pret Extraction', () => {
  const filePath = path.resolve(__dirname, '../public/assets/data/overworld_items.json');

  it('validates overworld_items.json exists and is structured properly', () => {
    expect(fs.existsSync(filePath)).toBe(true);

    const data: OverworldItemsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    expect(data.summary).toBeDefined();
    expect(data.itemBalls).toBeDefined();
    expect(data.hiddenItems).toBeDefined();
    expect(data.fruitTrees).toBeDefined();
    expect(data.byMap).toBeDefined();
  });

  it('validates exact item counts across Johto, Kanto, and Categories', () => {
    const data: OverworldItemsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Category Totals
    expect(data.summary.totalItemBalls).toBe(136);
    expect(data.summary.totalHiddenItems).toBe(80);
    expect(data.summary.totalFruitTrees).toBe(30);
    expect(data.summary.total).toBe(246);
    expect(data.summary.totalMapsWithItems).toBe(93);

    // Array Lengths Match Summary
    expect(data.itemBalls.length).toBe(136);
    expect(data.hiddenItems.length).toBe(80);
    expect(data.fruitTrees.length).toBe(30);

    // Regional Distribution
    expect(data.summary.johto.itemBalls).toBe(103);
    expect(data.summary.johto.hiddenItems).toBe(48);
    expect(data.summary.johto.fruitTrees).toBe(22);
    expect(data.summary.johto.total).toBe(173);

    expect(data.summary.kanto.itemBalls).toBe(33);
    expect(data.summary.kanto.hiddenItems).toBe(32);
    expect(data.summary.kanto.fruitTrees).toBe(8);
    expect(data.summary.kanto.total).toBe(73);

    expect(data.summary.johto.total + data.summary.kanto.total).toBe(246);
  });

  it('verifies authentic pret/pokecrystal Johto items', () => {
    const data: OverworldItemsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Route 29
    const r29 = data.byMap['route_29'];
    expect(r29).toBeDefined();
    expect(r29.itemBalls).toHaveLength(1);
    expect(r29.itemBalls[0]).toMatchObject({
      mapId: 'route_29',
      x: 48,
      y: 2,
      itemId: 'potion',
      eventFlag: 'EVENT_ROUTE_29_POTION',
    });
    expect(r29.fruitTrees).toHaveLength(1);
    expect(r29.fruitTrees[0]).toMatchObject({
      mapId: 'route_29',
      x: 12,
      y: 2,
      berryId: 'berry',
      treeId: 'FRUITTREE_ROUTE_29',
    });

    // Route 30
    const r30 = data.byMap['route_30'];
    expect(r30).toBeDefined();
    expect(r30.itemBalls[0]).toMatchObject({
      itemId: 'antidote',
      x: 8,
      y: 35,
      eventFlag: 'EVENT_ROUTE_30_ANTIDOTE',
    });
    expect(r30.hiddenItems[0]).toMatchObject({
      itemId: 'potion',
      x: 14,
      y: 9,
      eventFlag: 'EVENT_ROUTE_30_HIDDEN_POTION',
    });
    expect(r30.fruitTrees).toHaveLength(2);
    expect(r30.fruitTrees[0]).toMatchObject({
      x: 5,
      y: 39,
      berryId: 'berry',
      treeId: 'FRUITTREE_ROUTE_30_1',
    });
    expect(r30.fruitTrees[1]).toMatchObject({
      x: 11,
      y: 5,
      berryId: 'psncureberry',
      treeId: 'FRUITTREE_ROUTE_30_2',
    });

    // Route 31
    const r31 = data.byMap['route_31'];
    expect(r31).toBeDefined();
    expect(r31.itemBalls.some((i) => i.itemId === 'potion' && i.x === 29 && i.y === 5)).toBe(true);
    expect(r31.itemBalls.some((i) => i.itemId === 'poke_ball' && i.x === 19 && i.y === 15)).toBe(
      true
    );
    expect(r31.fruitTrees[0]).toMatchObject({
      x: 16,
      y: 7,
      berryId: 'bitter_berry',
      treeId: 'FRUITTREE_ROUTE_31',
    });

    // Violet City
    const violet = data.byMap['violet_city'];
    expect(violet).toBeDefined();
    expect(violet.itemBalls.some((i) => i.itemId === 'pp_up' && i.x === 4 && i.y === 1)).toBe(true);
    expect(violet.itemBalls.some((i) => i.itemId === 'rare_candy' && i.x === 35 && i.y === 5)).toBe(
      true
    );
    expect(
      violet.hiddenItems.some((i) => i.itemId === 'hyper_potion' && i.x === 37 && i.y === 14)
    ).toBe(true);
    expect(violet.fruitTrees[0]).toMatchObject({
      x: 14,
      y: 29,
      berryId: 'przcureberry',
      treeId: 'FRUITTREE_VIOLET_CITY',
    });

    // Burned Tower 1F
    const burnedTower = data.byMap['burned_tower_1f'];
    expect(burnedTower).toBeDefined();
    expect(burnedTower.itemBalls[0]).toMatchObject({
      itemId: 'hp_up',
      x: 14,
      y: 2,
      eventFlag: 'EVENT_BURNED_TOWER_1F_HP_UP',
    });
    expect(burnedTower.hiddenItems.some((i) => i.itemId === 'ether' && i.x === 8 && i.y === 7)).toBe(
      true
    );
    expect(
      burnedTower.hiddenItems.some((i) => i.itemId === 'ultra_ball' && i.x === 13 && i.y === 11)
    ).toBe(true);
  });

  it('verifies authentic pret/pokecrystal Kanto items and key landmarks', () => {
    const data: OverworldItemsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Fighting Dojo in Saffron City
    const dojo = data.byMap['fighting_dojo'];
    expect(dojo).toBeDefined();
    expect(dojo.region).toBe('kanto');
    expect(dojo.itemBalls[0]).toMatchObject({
      itemId: 'focus_band',
      x: 3,
      y: 1,
      eventFlag: 'EVENT_PICKED_UP_FOCUS_BAND',
    });

    // Cerulean Gym - Hidden Machine Part
    const ceruleanGym = data.byMap['cerulean_gym'];
    expect(ceruleanGym).toBeDefined();
    expect(ceruleanGym.region).toBe('kanto');
    expect(ceruleanGym.hiddenItems[0]).toMatchObject({
      itemId: 'machine_part',
      x: 3,
      y: 8,
      eventFlag: 'EVENT_FOUND_MACHINE_PART_IN_CERULEAN_GYM',
    });

    // Cerulean City - Hidden Berserk Gene (near Cerulean Cave water)
    const ceruleanCity = data.byMap['cerulean_city'];
    expect(ceruleanCity).toBeDefined();
    expect(ceruleanCity.hiddenItems[0]).toMatchObject({
      itemId: 'berserk_gene',
      x: 2,
      y: 12,
      eventFlag: 'EVENT_FOUND_BERSERK_GENE_IN_CERULEAN_CITY',
    });

    // Celadon City - Hidden PP Up
    const celadonCity = data.byMap['celadon_city'];
    expect(celadonCity).toBeDefined();
    expect(celadonCity.hiddenItems[0]).toMatchObject({
      itemId: 'pp_up',
      x: 37,
      y: 21,
      eventFlag: 'EVENT_CELADON_CITY_HIDDEN_PP_UP',
    });

    // Diglett's Cave - Hidden Max Revive
    const diglettsCave = data.byMap['digletts_cave'];
    expect(diglettsCave).toBeDefined();
    expect(diglettsCave.hiddenItems[0]).toMatchObject({
      itemId: 'max_revive',
      x: 6,
      y: 11,
      eventFlag: 'EVENT_DIGLETTS_CAVE_HIDDEN_MAX_REVIVE',
    });
  });

  it('asserts all items have valid non-negative coordinates, IDs, and event flags', () => {
    const data: OverworldItemsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const item of data.itemBalls) {
      expect(item.id).toBeTruthy();
      expect(item.mapId).toBeTruthy();
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.itemId).toBeTruthy();
      expect(item.eventFlag).toMatch(/^EVENT_/);
    }

    for (const item of data.hiddenItems) {
      expect(item.id).toBeTruthy();
      expect(item.mapId).toBeTruthy();
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.itemId).toBeTruthy();
      expect(item.eventFlag).toMatch(/^EVENT_/);
    }

    for (const tree of data.fruitTrees) {
      expect(tree.id).toBeTruthy();
      expect(tree.mapId).toBeTruthy();
      expect(tree.x).toBeGreaterThanOrEqual(0);
      expect(tree.y).toBeGreaterThanOrEqual(0);
      expect(tree.berryId).toBeTruthy();
      expect(tree.treeId).toMatch(/^FRUITTREE_/);
    }
  });
});
