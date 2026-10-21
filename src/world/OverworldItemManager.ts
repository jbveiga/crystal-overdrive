import overworldItemsJson from '../../public/assets/data/overworld_items.json';
import type {
  ItemPocket,
  OverworldFruitTree,
  OverworldHiddenItem,
  OverworldItemBall,
  OverworldItemsDataset,
} from '../types/game';

export class OverworldItemManager {
  private data: OverworldItemsDataset;
  private collectedFlags: Set<string>;
  private fruitTreePicks: Map<string, number>;

  constructor(
    data: OverworldItemsDataset = overworldItemsJson as unknown as OverworldItemsDataset,
    collectedFlags: string[] | Set<string> = [],
    fruitTreePicks: Record<string, number> | string[] = {}
  ) {
    this.data = data;
    this.collectedFlags = new Set(collectedFlags);
    this.fruitTreePicks = new Map();

    if (Array.isArray(fruitTreePicks)) {
      const now = Date.now();
      for (const treeId of fruitTreePicks) {
        this.fruitTreePicks.set(treeId, now);
      }
    } else if (fruitTreePicks && typeof fruitTreePicks === 'object') {
      for (const [k, v] of Object.entries(fruitTreePicks)) {
        this.fruitTreePicks.set(k, v);
      }
    }
  }

  public getDataset(): OverworldItemsDataset {
    return this.data;
  }

  public setCollectedFlags(flags: Iterable<string>): void {
    this.collectedFlags = new Set(flags);
  }

  public setFruitTreePicks(picks: Record<string, number> | string[] | undefined): void {
    this.fruitTreePicks.clear();
    if (!picks) return;
    if (Array.isArray(picks)) {
      const now = Date.now();
      for (const treeId of picks) {
        this.fruitTreePicks.set(treeId, now);
      }
    } else {
      for (const [k, v] of Object.entries(picks)) {
        this.fruitTreePicks.set(k, v);
      }
    }
  }

  /**
   * Returns active, uncollected item balls on the given map
   */
  public getActiveItemBalls(mapId: string, externalFlags?: Set<string>): OverworldItemBall[] {
    const list = this.data.byMap[mapId]?.itemBalls || [];
    const flagSet = externalFlags || this.collectedFlags;
    return list.filter((item) => !flagSet.has(item.eventFlag));
  }

  public getItemsForMap(mapId: string, externalFlags?: Set<string>): OverworldItemBall[] {
    return this.getActiveItemBalls(mapId, externalFlags);
  }

  public getHiddenItemsForMap(mapId: string, externalFlags?: Set<string>): OverworldHiddenItem[] {
    const list = this.data.byMap[mapId]?.hiddenItems || [];
    const flagSet = externalFlags || this.collectedFlags;
    return list.filter((item) => !flagSet.has(item.eventFlag));
  }

  public getFruitTreesForMap(mapId: string): OverworldFruitTree[] {
    return this.data.byMap[mapId]?.fruitTrees || [];
  }

  /**
   * Checks if an uncollected item ball exists at (x, y) on mapId
   */
  public checkItemBall(mapId: string, x: number, y: number, externalFlags?: Set<string>): OverworldItemBall | null {
    const item = this.data.byMap[mapId]?.itemBalls.find((b) => b.x === x && b.y === y);
    const flagSet = externalFlags || this.collectedFlags;
    if (item && !flagSet.has(item.eventFlag)) {
      return item;
    }
    return null;
  }

  public checkItemBallInteraction(
    mapId: string,
    targetX: number,
    targetY: number,
    externalFlags?: Set<string>
  ): OverworldItemBall | null {
    return this.checkItemBall(mapId, targetX, targetY, externalFlags);
  }

  /**
   * Checks if an uncollected hidden item exists at (x, y) on mapId
   */
  public checkHiddenItem(mapId: string, x: number, y: number, externalFlags?: Set<string>): OverworldHiddenItem | null {
    const item = this.data.byMap[mapId]?.hiddenItems.find((h) => h.x === x && h.y === y);
    const flagSet = externalFlags || this.collectedFlags;
    if (item && !flagSet.has(item.eventFlag)) {
      return item;
    }
    return null;
  }

  public checkHiddenItemInteraction(
    mapId: string,
    targetX: number,
    targetY: number,
    playerX?: number,
    playerY?: number,
    externalFlags?: Set<string>
  ): OverworldHiddenItem | null {
    const facingHit = this.checkHiddenItem(mapId, targetX, targetY, externalFlags);
    if (facingHit) return facingHit;
    if (typeof playerX === 'number' && typeof playerY === 'number') {
      return this.checkHiddenItem(mapId, playerX, playerY, externalFlags);
    }
    return null;
  }

  /**
   * Checks if a fruit tree exists at (x, y) on mapId
   */
  public checkFruitTree(mapId: string, x: number, y: number): OverworldFruitTree | null {
    return this.data.byMap[mapId]?.fruitTrees.find((t) => t.x === x && t.y === y) || null;
  }

  public checkFruitTreeInteraction(
    mapId: string,
    targetX: number,
    targetY: number,
    harvestedTrees?: Set<string>
  ): { tree: OverworldFruitTree; alreadyHarvested: boolean } | null {
    const tree = this.checkFruitTree(mapId, targetX, targetY);
    if (!tree) return null;
    const alreadyHarvested = harvestedTrees
      ? harvestedTrees.has(tree.treeId)
      : this.isFruitTreePickedToday(tree.treeId);
    return { tree, alreadyHarvested };
  }

  /**
   * Validates whether a fruit tree has already yielded fruit today (calendar day check)
   */
  public isFruitTreePickedToday(treeId: string, nowMs: number = Date.now()): boolean {
    const lastPick = this.fruitTreePicks.get(treeId);
    if (!lastPick) return false;
    const lastDate = new Date(lastPick).toDateString();
    const currentDate = new Date(nowMs).toDateString();
    return lastDate === currentDate;
  }

  /**
   * Collects an item ball or hidden item, marking its event flag
   */
  public collectItem(eventFlag: string): void {
    this.collectedFlags.add(eventFlag);
  }

  /**
   * Records a fruit tree pick for today
   */
  public pickFruitTree(treeId: string, nowMs: number = Date.now()): void {
    this.fruitTreePicks.set(treeId, nowMs);
  }

  /**
   * Itemfinder Scan: Finds closest uncollected hidden item within radius (default 8 tiles)
   */
  public scanItemfinder(
    mapId: string,
    playerX: number,
    playerY: number,
    collectedFlagsOrRadius?: Set<string> | number,
    explicitRadius?: number
  ): { item: OverworldHiddenItem; distance: number; direction: string } | null {
    const flagSet = collectedFlagsOrRadius instanceof Set ? collectedFlagsOrRadius : this.collectedFlags;
    const radius =
      typeof collectedFlagsOrRadius === 'number'
        ? collectedFlagsOrRadius
        : typeof explicitRadius === 'number'
          ? explicitRadius
          : 8;

    const hiddenList = (this.data.byMap[mapId]?.hiddenItems || []).filter((h) => !flagSet.has(h.eventFlag));
    if (hiddenList.length === 0) return null;

    let closest: OverworldHiddenItem | null = null;
    let minDistance = Infinity;

    for (const h of hiddenList) {
      const dist = Math.hypot(h.x - playerX, h.y - playerY);
      if (dist <= radius && dist < minDistance) {
        minDistance = dist;
        closest = h;
      }
    }

    if (!closest) return null;

    const dx = closest.x - playerX;
    const dy = closest.y - playerY;

    let direction = 'right here!';
    if (dx === 0 && dy < 0) direction = 'North of here';
    else if (dx === 0 && dy > 0) direction = 'South of here';
    else if (dx > 0 && dy === 0) direction = 'East of here';
    else if (dx < 0 && dy === 0) direction = 'West of here';
    else if (dx > 0 && dy < 0) direction = 'Northeast of here';
    else if (dx < 0 && dy < 0) direction = 'Northwest of here';
    else if (dx > 0 && dy > 0) direction = 'Southeast of here';
    else if (dx < 0 && dy > 0) direction = 'Southwest of here';

    return { item: closest, distance: minDistance, direction };
  }

  public getCollectedFlags(): string[] {
    return Array.from(this.collectedFlags);
  }

  public getHarvestedTreeIds(nowMs: number = Date.now()): string[] {
    const out: string[] = [];
    for (const treeId of this.fruitTreePicks.keys()) {
      if (this.isFruitTreePickedToday(treeId, nowMs)) {
        out.push(treeId);
      }
    }
    return out;
  }

  public getFruitTreePicksRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [k, v] of this.fruitTreePicks.entries()) {
      record[k] = v;
    }
    return record;
  }

  public static formatItemName(itemId: string): string {
    return itemId
      .replace(/[_-]/g, ' ')
      .toUpperCase();
  }

  public static resolveItemPocket(itemId: string): ItemPocket {
    const norm = itemId.toLowerCase().replace(/_/g, '-');
    if (norm.startsWith('tm') || norm.startsWith('hm')) return 'TMS';
    if (norm.endsWith('-ball')) return 'BALLS';
    if (norm.includes('berry') || norm.includes('apricorn')) return 'BERRIES';
    if (
      norm === 'machine-part' ||
      norm === 'lost-item' ||
      norm === 'pass' ||
      norm === 'clear-bell' ||
      norm === 'rainbow-wing' ||
      norm === 'silver-wing' ||
      norm === 'red-scale' ||
      norm === 'squirtbottle' ||
      norm === 'secretpotion' ||
      norm === 'itemfinder'
    ) {
      return 'KEY_ITEMS';
    }
    return 'ITEMS';
  }
}
