import { describe, it, expect, vi, beforeEach } from 'vitest';

class MockElement {
  public tagName: string;
  public id = '';
  public className = '';
  public innerHTML = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public style: Record<string, string> = {};
  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }
  appendChild(c: MockElement) {
    c.parent = this;
    this.children.push(c);
    return c;
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
  addEventListener() {}
  focus() {}
  querySelector(): MockElement | null {
    return null;
  }
  querySelectorAll(): MockElement[] {
    return [];
  }
}

const body = new MockElement('body');
(globalThis as any).document = {
  body,
  getElementById: () => null,
  createElement: (t: string) => new MockElement(t),
};
(globalThis as any).window = { addEventListener: vi.fn(), removeEventListener: vi.fn() };

import { INFINITE_TMS } from '../src/ui/BagAndMartUI';
import { NamingModalUI } from '../src/ui/NamingModalUI';
import { createNpcsByMap, GUIDE_GENT_TOUR_LEGS, calculateTourLegCoordinates } from '../src/world/npcData';
import { MissionManager } from '../src/world/MissionManager';
import fs from 'fs';
import path from 'path';

describe('BUGFIX-PROGRESSION-NARRATIVE-02', () => {
  beforeEach(() => {
    body.children = [];
  });

  it('defines HM05, TM31, TM49 and HM01 in the TMs & HMs pocket', () => {
    expect(INFINITE_TMS.HM05.moveId).toBe('flash');
    expect(INFINITE_TMS.TM70).toBeUndefined();
    expect(INFINITE_TMS.TM31.moveId).toBe('mudslap');
    expect(INFINITE_TMS.TM49.moveId).toBe('furycutter');
    expect(INFINITE_TMS.TM49.type).toBe('Bug');
    expect(INFINITE_TMS.HM01.moveId).toBe('cut');
  });

  it('renders the rival naming modal with pointer-events auto, mobile input attrs and CLEAR button', () => {
    const ui = new NamingModalUI('overworld-hud-container');
    ui.open({ onConfirm: () => {} });
    expect(ui.isOpen()).toBe(true);

    const backdrop = body.children[0];
    expect(backdrop.className).toContain('interactive');
    const card = backdrop.children[0];
    expect(card.className).toContain('interactive');
    expect(card.innerHTML).toContain('pointer-events: auto !important');
    expect(card.innerHTML).toContain('inputmode="text"');
    expect(card.innerHTML).toContain('autocapitalize="characters"');
    expect(card.innerHTML).toContain('font-size: 16px');
    expect(card.innerHTML).toContain('rival-clear-btn');
    ui.close();
    expect(ui.isOpen()).toBe(false);
  });

  it('falls back to SILVER when an empty name is confirmed', () => {
    const ui = new NamingModalUI('overworld-hud-container');
    const onConfirm = vi.fn();
    ui.open({ onConfirm });
    ui.setName('');
    expect(ui.confirm()).toBe('SILVER');
    expect(onConfirm).toHaveBeenCalledWith('SILVER');
  });

  it('places the peeking rival in New Bark Town (despawn handled by main.ts story flags)', () => {
    const npcs = createNpcsByMap();
    expect(npcs.new_bark_town.some((n) => n.id === 'nbt_rival')).toBe(true);
  });

  it('tags cg_guide_gent with GUIDE_GENT_EVENT and completes Mission S02 when has_map_card is earned', () => {
    const npcs = createNpcsByMap();
    const guideGent = npcs.cherrygrove_city.find((n) => n.id === 'cg_guide_gent');
    expect(guideGent).toBeDefined();
    expect(guideGent?.action).toBe('GUIDE_GENT_EVENT');

    const missionManager = new MissionManager();
    const missionS02 = missionManager.getMission('S02');
    expect(missionS02).toBeDefined();
    expect(missionS02?.status).toBe('ACTIVE');

    const flags = new Set<string>(['has_map_card']);
    missionManager.checkStoryFlags(flags);

    expect(missionS02?.status).toBe('COMPLETED');
    expect(missionS02?.steps[0].completed).toBe(true);
  });

  describe('TICKET-EVENT-GUIDE-GENT-WALKING-TOUR-01', () => {
    it('defines 6 canonical tour legs with authentic pokecrystal movement vectors', () => {
      expect(GUIDE_GENT_TOUR_LEGS).toHaveLength(6);

      // Leg 1: Pokemon Center
      expect(GUIDE_GENT_TOUR_LEGS[0].steps).toEqual(['LEFT', 'LEFT', 'UP', 'LEFT']);
      expect(GUIDE_GENT_TOUR_LEGS[0].guideEnd).toEqual({ x: 29, y: 5, direction: 'UP' });
      expect(GUIDE_GENT_TOUR_LEGS[0].playerEnd).toEqual({ x: 30, y: 5, direction: 'UP' });
      expect(GUIDE_GENT_TOUR_LEGS[0].dialoguePages?.[0]).toContain('POKéMON CENTER');

      // Leg 2: Pokemon Mart
      expect(GUIDE_GENT_TOUR_LEGS[1].steps).toEqual(Array(6).fill('LEFT'));
      expect(GUIDE_GENT_TOUR_LEGS[1].guideEnd).toEqual({ x: 23, y: 5, direction: 'UP' });
      expect(GUIDE_GENT_TOUR_LEGS[1].playerEnd).toEqual({ x: 24, y: 5, direction: 'UP' });
      expect(GUIDE_GENT_TOUR_LEGS[1].dialoguePages?.[0]).toContain('POKéMON MART');

      // Leg 3: Route 30 Road
      expect(GUIDE_GENT_TOUR_LEGS[2].steps).toEqual(Array(7).fill('LEFT'));
      expect(GUIDE_GENT_TOUR_LEGS[2].guideEnd).toEqual({ x: 16, y: 5, direction: 'UP' });
      expect(GUIDE_GENT_TOUR_LEGS[2].playerEnd).toEqual({ x: 17, y: 5, direction: 'UP' });
      expect(GUIDE_GENT_TOUR_LEGS[2].dialoguePages?.[0]).toContain('ROUTE 30');

      // Leg 4: The Sea
      expect(GUIDE_GENT_TOUR_LEGS[3].steps).toEqual([
        'LEFT', 'LEFT', 'LEFT', 'DOWN', 'LEFT', 'LEFT', 'LEFT', 'DOWN',
      ]);
      expect(GUIDE_GENT_TOUR_LEGS[3].guideEnd).toEqual({ x: 10, y: 7, direction: 'LEFT' });
      expect(GUIDE_GENT_TOUR_LEGS[3].playerEnd).toEqual({ x: 10, y: 6, direction: 'LEFT' });
      expect(GUIDE_GENT_TOUR_LEGS[3].dialoguePages?.[0]).toContain('This is the sea');

      // Leg 5: Guide Gent's House porch
      expect(GUIDE_GENT_TOUR_LEGS[4].steps).toHaveLength(19);
      expect(GUIDE_GENT_TOUR_LEGS[4].guideEnd).toEqual({ x: 25, y: 11, direction: 'LEFT' });
      expect(GUIDE_GENT_TOUR_LEGS[4].playerEnd).toEqual({ x: 24, y: 11, direction: 'RIGHT' });
      expect(GUIDE_GENT_TOUR_LEGS[4].dialoguePages?.[0]).toContain("It's my house!");

      // Leg 6: Retire inside house
      expect(GUIDE_GENT_TOUR_LEGS[5].steps).toEqual(['UP', 'UP']);
      expect(GUIDE_GENT_TOUR_LEGS[5].guideEnd).toEqual({ x: 25, y: 9, direction: 'UP' });
      expect(GUIDE_GENT_TOUR_LEGS[5].playerEnd).toEqual({ x: 24, y: 11, direction: 'UP' });
      expect(GUIDE_GENT_TOUR_LEGS[5].isRetireLeg).toBe(true);
    });

    it('simulates each tour leg and verifies exact guide and follower coordinates', () => {
      const tourResults = calculateTourLegCoordinates({ x: 32, y: 6 }, { x: 32, y: 7 });
      expect(tourResults).toHaveLength(6);

      // Leg 1
      expect(tourResults[0].guideEnd).toEqual({ x: 29, y: 5, direction: 'UP' });
      expect(tourResults[0].playerEnd).toEqual({ x: 30, y: 5, direction: 'UP' });

      // Leg 2
      expect(tourResults[1].guideEnd).toEqual({ x: 23, y: 5, direction: 'UP' });
      expect(tourResults[1].playerEnd).toEqual({ x: 24, y: 5, direction: 'UP' });

      // Leg 3
      expect(tourResults[2].guideEnd).toEqual({ x: 16, y: 5, direction: 'UP' });
      expect(tourResults[2].playerEnd).toEqual({ x: 17, y: 5, direction: 'UP' });

      // Leg 4
      expect(tourResults[3].guideEnd).toEqual({ x: 10, y: 7, direction: 'LEFT' });
      expect(tourResults[3].playerEnd).toEqual({ x: 10, y: 6, direction: 'LEFT' });

      // Leg 5
      expect(tourResults[4].guideEnd).toEqual({ x: 25, y: 11, direction: 'LEFT' });
      expect(tourResults[4].playerEnd).toEqual({ x: 24, y: 11, direction: 'RIGHT' });

      // Leg 6: Guide Gent enters door, player stays at (24, 11)
      expect(tourResults[5].guideEnd).toEqual({ x: 25, y: 9, direction: 'UP' });
      expect(tourResults[5].playerEnd).toEqual({ x: 24, y: 11, direction: 'UP' });
    });

    it('asserts 100% of tour path coordinates traverse walkable tiles (0 or 2) in Cherrygrove City', () => {
      const cherrygroveMapPath = path.resolve(__dirname, '../public/assets/data/maps/cherrygrove_city.json');
      const map = JSON.parse(fs.readFileSync(cherrygroveMapPath, 'utf8'));

      const tourResults = calculateTourLegCoordinates({ x: 32, y: 6 }, { x: 32, y: 7 });

      for (const leg of tourResults) {
        for (const waypoint of leg.path) {
          const guideCol = map.collisionGrid[waypoint.guide.y * map.width + waypoint.guide.x];
          expect([0, 2]).toContain(guideCol);

          const playerCol = map.collisionGrid[waypoint.player.y * map.width + waypoint.player.x];
          expect([0, 2]).toContain(playerCol);
        }
      }
    });

    it('verifies the Leg 6 destination (25, 9) is a reciprocal door warp into guide_gents_house with house_guide_gent present', () => {
      const cherrygroveMapPath = path.resolve(__dirname, '../public/assets/data/maps/cherrygrove_city.json');
      const cherrygrove = JSON.parse(fs.readFileSync(cherrygroveMapPath, 'utf8'));

      const doorWarp = cherrygrove.warps.find((w: any) => w.x === 25 && w.y === 9);
      expect(doorWarp).toBeDefined();
      expect(doorWarp.targetMapId).toBe('guide_gents_house');

      // Verify guide_gents_house map exists
      const houseMapPath = path.resolve(__dirname, '../public/assets/data/maps/guide_gents_house.json');
      expect(fs.existsSync(houseMapPath)).toBe(true);

      // Verify house_guide_gent is registered inside guide_gents_house
      const npcs = createNpcsByMap();
      const houseGent = npcs.guide_gents_house?.find((n) => n.id === 'house_guide_gent');
      expect(houseGent).toBeDefined();
      expect(houseGent?.x).toBe(2);
      expect(houseGent?.y).toBe(3);
    });
  });
});
