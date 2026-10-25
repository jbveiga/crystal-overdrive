import { describe, it, expect } from 'vitest';
import { ItemfinderRadar, type HiddenItemTarget } from '../src/world/ItemfinderRadar';

describe('Pokémon Unbound-Style Live Itemfinder Compass Radar (TICKET-KEY-ITEMS-UNBOUND-01)', () => {
  const sampleItems: HiddenItemTarget[] = [
    { eventFlag: 'hidden_item_1', itemId: 'rare_candy', x: 10, y: 6 }, // 4 tiles North of (10, 10)
    { eventFlag: 'hidden_item_2', itemId: 'max_ether', x: 16, y: 10 }, // 6 tiles East of (10, 10)
    { eventFlag: 'hidden_item_far', itemId: 'nugget', x: 25, y: 25 },  // Out of 8-tile range
  ];

  it('locks onto the closest uncollected hidden item within 8 tiles and computes accurate bearing', () => {
    const ping = ItemfinderRadar.scan(10, 10, 'UP', sampleItems, new Set());
    expect(ping.hasItemInRange).toBe(true);
    expect(ping.nearestItem?.eventFlag).toBe('hidden_item_1');
    expect(ping.distance).toBe(4);
    expect(ping.bearing).toBe('N');
    expect(ping.bearingAngleDeg).toBe(270);
    expect(ping.proximityBand).toBe('MEDIUM');
    expect(ping.isFacingDirectly).toBe(false);
  });

  it('ignores collected hidden items and switches to the next closest uncollected item', () => {
    const collected = new Set(['hidden_item_1']);
    const ping = ItemfinderRadar.scan(10, 10, 'RIGHT', sampleItems, collected);
    expect(ping.hasItemInRange).toBe(true);
    expect(ping.nearestItem?.eventFlag).toBe('hidden_item_2');
    expect(ping.distance).toBe(6);
    expect(ping.bearing).toBe('E');
    expect(ping.bearingAngleDeg).toBe(0);
    expect(ping.proximityBand).toBe('FAR');
  });

  it('returns NONE state when all items within 8 tiles are collected or out of range', () => {
    const collected = new Set(['hidden_item_1', 'hidden_item_2']);
    const ping = ItemfinderRadar.scan(10, 10, 'DOWN', sampleItems, collected);
    expect(ping.hasItemInRange).toBe(false);
    expect(ping.nearestItem).toBeNull();
    expect(ping.distance).toBeNull();
    expect(ping.bearing).toBe('NONE');
    expect(ping.proximityBand).toBe('NONE');
  });

  it('detects direct adjacent facing lock-on (FACING proximity band)', () => {
    const adjacentItem: HiddenItemTarget[] = [
      { eventFlag: 'hidden_adj', itemId: 'pp_up', x: 10, y: 9 },
    ];
    // Facing UP toward (10, 9) from (10, 10)
    const facingPing = ItemfinderRadar.scan(10, 10, 'UP', adjacentItem, new Set());
    expect(facingPing.isFacingDirectly).toBe(true);
    expect(facingPing.isFacingTarget).toBe(true);
    expect(facingPing.proximityBand).toBe('FACING');

    // Facing DOWN away from (10, 9)
    const awayPing = ItemfinderRadar.scan(10, 10, 'DOWN', adjacentItem, new Set());
    expect(awayPing.isFacingDirectly).toBe(false);
    expect(awayPing.proximityBand).toBe('CLOSE');
  });

  it('computes dynamic sonar pitch f(d) = 880 + (8 - d) * 120 Hz and cadence interval', () => {
    expect(ItemfinderRadar.getSonarFrequency(8)).toBe(880);
    expect(ItemfinderRadar.getSonarFrequency(4)).toBe(1360);
    expect(ItemfinderRadar.getSonarFrequency(1)).toBe(1720);
    expect(ItemfinderRadar.getSonarFrequency(0)).toBe(1840);

    expect(ItemfinderRadar.getSonarIntervalSec(8)).toBe(1.05);
    expect(ItemfinderRadar.getSonarIntervalSec(1)).toBe(0.35);
  });
});
