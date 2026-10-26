import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TownMapUI } from '../src/ui/TownMapUI';
import {
  resolveCurrentLandmark,
  JOHTO_LANDMARKS,
  computeLandmarkDistance,
  findHabitatsForSpecies,
} from '../src/world/townMapData';
import type { RoamerState } from '../src/types/game';
import { PokemonFactory } from '../src/battle/PokemonFactory';

// Lightweight in-memory DOM mock for node testing
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  private _innerHTML: string = '';
  public innerText: string = '';
  public textContent: string = '';
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public listeners: Record<string, Function[]> = {};
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get innerHTML(): string {
    const childContent = this.children.map((c) => c.innerHTML || c.textContent || c.innerText).join(' ');
    return (this._innerHTML + ' ' + childContent).trim();
  }

  set innerHTML(val: string) {
    this._innerHTML = val;
    this.textContent = val.replace(/<[^>]+>/g, '');
    this.innerText = this.textContent;
    this.children = [];

    const regex = /<([a-z0-9]+)([^>]*)>/gi;
    let match;
    while ((match = regex.exec(val)) !== null) {
      const tag = match[1];
      const attrs = match[2];
      if (tag.startsWith('/')) continue;

      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const classMatch = attrs.match(/class=["']([^"']+)["']/i);
      const dataLmMatch = attrs.match(/data-landmark-id=["']([^"']+)["']/i);
      const dataFilterMatch = attrs.match(/data-filter=["']([^"']+)["']/i);
      const styleMatch = attrs.match(/style=["']([^"']+)["']/i);

      const child = new MockElement(tag);
      if (idMatch) child.id = idMatch[1];
      if (classMatch) child.className = classMatch[1];
      if (dataLmMatch) child.setAttribute('data-landmark-id', dataLmMatch[1]);
      if (dataFilterMatch) child.setAttribute('data-filter', dataFilterMatch[1]);
      if (styleMatch) child.style.cssText = styleMatch[1];
      this.appendChild(child);
    }
  }

  appendChild(child: MockElement) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (this.parent) {
      const idx = this.parent.children.indexOf(this);
      if (idx >= 0) this.parent.children.splice(idx, 1);
      this.parent = null;
    }
  }

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  click() {
    this.listeners['click']?.forEach((fn) =>
      fn({ currentTarget: this, stopPropagation: () => {}, preventDefault: () => {} })
    );
  }

  getAttribute(attr: string) {
    return this.attributes[attr] || null;
  }

  setAttribute(attr: string, val: string) {
    this.attributes[attr] = val;
  }

  querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this.find((el) => el.id === id);
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.find((el) => el.className.split(/\s+/).includes(cls));
    }
    return this.find((el) => el.tagName.toLowerCase() === selector.toLowerCase());
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    const check = (el: MockElement) => {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        if (el.className.split(/\s+/).includes(cls)) results.push(el);
      } else if (selector.startsWith('#')) {
        const id = selector.slice(1);
        if (el.id === id) results.push(el);
      } else if (el.tagName.toLowerCase() === selector.toLowerCase()) {
        results.push(el);
      }
      for (const child of el.children) check(child);
    };
    for (const child of this.children) check(child);
    return results;
  }

  private find(predicate: (el: MockElement) => boolean): MockElement | null {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const found = child.find(predicate);
      if (found) return found;
    }
    return null;
  }
}

class MockDocument {
  public body = new MockElement('body');
  private elementsById: Map<string, MockElement> = new Map();

  createElement(tag: string) {
    return new MockElement(tag);
  }

  getElementById(id: string) {
    return this.elementsById.get(id) || this.body.querySelector(`#${id}`);
  }

  querySelector(selector: string) {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector: string) {
    return this.body.querySelectorAll(selector);
  }

  register(el: MockElement) {
    if (el.id) this.elementsById.set(el.id, el);
  }

  reset() {
    this.body = new MockElement('body');
    this.elementsById.clear();
    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    this.body.appendChild(modalContainer);
    this.register(modalContainer);
  }
}

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;
(globalThis as any).addEventListener = vi.fn();
(globalThis as any).removeEventListener = vi.fn();

describe('Johto Town Map Engine & UI (TICKET-FEATURE-TOWN-MAP-ENGINE-01)', () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  describe('1. Regional Cartography & Landmark Domain (townMapData.ts)', () => {
    it('registers all canonical Johto towns, routes, and landmarks with valid grid coordinates', () => {
      const all = Object.values(JOHTO_LANDMARKS);
      expect(all.length).toBeGreaterThanOrEqual(30);

      // Verify grid boundary constraints: 0 <= x <= 15, 0 <= y <= 13
      for (const lm of all) {
        expect(lm.gridX).toBeGreaterThanOrEqual(0);
        expect(lm.gridX).toBeLessThanOrEqual(15);
        expect(lm.gridY).toBeGreaterThanOrEqual(0);
        expect(lm.gridY).toBeLessThanOrEqual(13);
        expect(lm.name.length).toBeGreaterThan(0);
        expect(lm.subtitle.length).toBeGreaterThan(0);
      }
    });

    it('resolves interior maps cleanly to their parent overworld landmarks', () => {
      expect(resolveCurrentLandmark('elms_lab')?.id).toBe('new_bark_town');
      expect(resolveCurrentLandmark('players_house_1f')?.id).toBe('new_bark_town');
      expect(resolveCurrentLandmark('cherrygrove_poke_center')?.id).toBe('cherrygrove_city');
      expect(resolveCurrentLandmark('sprout_tower_3f')?.id).toBe('sprout_tower');
      expect(resolveCurrentLandmark('union_cave_b2f')?.id).toBe('union_cave');
      expect(resolveCurrentLandmark('slowpoke_well_b1f')?.id).toBe('slowpoke_well');
      expect(resolveCurrentLandmark('route_29')?.id).toBe('route_29');
      expect(resolveCurrentLandmark('violet_city')?.id).toBe('violet_city');

      // Comprehensive building & dungeon sub-map resolution
      expect(resolveCurrentLandmark('guide_gents_house')?.id).toBe('cherrygrove_city');
      expect(resolveCurrentLandmark('earls_pokemon_academy')?.id).toBe('violet_city');
      expect(resolveCurrentLandmark('charcoal_kiln')?.id).toBe('azalea_town');
      expect(resolveCurrentLandmark('radio_tower_5f')?.id).toBe('goldenrod_city');
      expect(resolveCurrentLandmark('dance_theater')?.id).toBe('ecruteak_city');
      expect(resolveCurrentLandmark('team_rocket_base_b2f')?.id).toBe('mahogany_town');
      expect(resolveCurrentLandmark('whirl_island_lugia_chamber')?.id).toBe('route_41');
      expect(resolveCurrentLandmark('mount_mortar_b1f')?.id).toBe('route_42');
      expect(resolveCurrentLandmark('dragon_shrine')?.id).toBe('dragons_den');
      expect(resolveCurrentLandmark('victory_road')?.id).toBe('indigo_plateau');
      expect(resolveCurrentLandmark('indigo_plateau_pokecenter')?.id).toBe('indigo_plateau');
      expect(resolveCurrentLandmark('battle_tower_elevator')?.id).toBe('route_40');
      expect(resolveCurrentLandmark('lake_of_rage_hidden_power_house')?.id).toBe('lake_of_rage');
    });
  });

  describe('2. Interactive Neo-Kanto TownMapUI DOM Component', () => {
    it('opens TownMapUI, sets player landmark, and default selects current location', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      expect(ui.isOpen()).toBe(false);

      ui.open('union_cave_1f');
      expect(ui.isOpen()).toBe(true);
      expect(ui.getCurrentPlayerLandmark()?.id).toBe('union_cave');
      expect(ui.getSelectedLandmark()?.id).toBe('union_cave');

      const modal = mockDoc.getElementById('town-map-modal');
      const card = mockDoc.getElementById('town-map-card');
      expect(modal).not.toBeNull();
      expect(card).not.toBeNull();

      ui.close();
      expect(ui.isOpen()).toBe(false);
      expect(mockDoc.getElementById('town-map-modal')).toBeNull();
    });

    it('selects landmark on node click and updates telemetry inspector', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      ui.open('new_bark_town');

      ui.selectLandmark('violet_city');
      const sel = ui.getSelectedLandmark();
      expect(sel).not.toBeNull();
      expect(sel?.id).toBe('violet_city');
      expect(sel?.gymLeader).toBe('Falkner');
      expect(sel?.badgeName).toBe('Zephyr Badge');

      ui.close();
    });

    it('navigates spatially between landmarks via keyboard arrow keys', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      ui.open('cherrygrove_city');
      expect(ui.getSelectedLandmark()?.id).toBe('cherrygrove_city');

      // Cherrygrove is at (10, 10). New Bark is to the right at (14, 10)
      const handledRight = ui.handleKeyDown({ key: 'ArrowRight', preventDefault: vi.fn() } as any);
      expect(handledRight).toBe(true);
      // Moved eastward
      expect(ui.getSelectedLandmark()?.gridX).toBeGreaterThan(10);

      // Pressing Escape closes the Town Map
      const handledEsc = ui.handleKeyDown({ key: 'Escape', preventDefault: vi.fn() } as any);
      expect(handledEsc).toBe(true);
      expect(ui.isOpen()).toBe(false);
    });

    it('detects live roaming beasts on active routes and renders alert telemetry', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });

      const raikouRoamer: RoamerState = {
        speciesId: 'raikou',
        currentMapId: 'route_32',
        pokemon: PokemonFactory.create('raikou', 40),
        isAwakened: true,
        isCaught: false,
        isDefeated: false,
      };

      ui.open('violet_city', ['violet_city', 'route_32'], [raikouRoamer]);

      // Inspect Route 32
      ui.selectLandmark('route_32');
      const card = mockDoc.getElementById('town-map-card');
      expect(card).not.toBeNull();

      // Roamer detected callout should be rendered in card innerHTML
      expect(card?.innerHTML).toContain('ROAMING BEAST DETECTED');
      expect(card?.innerHTML).toContain('RAIKOU');

      ui.close();
    });

    it('renders live Legendary Beast Radar with BFS hop proximity and click-to-focus landmarks', () => {
      expect(computeLandmarkDistance('new_bark_town', 'new_bark_town')).toBe(0);
      expect(computeLandmarkDistance('new_bark_town', 'route_29')).toBe(1);
      expect(computeLandmarkDistance('new_bark_town', 'cherrygrove_city')).toBe(2);

      const pidgeyHabitats = findHabitatsForSpecies('pidgey');
      expect(pidgeyHabitats.some((lm) => lm.id === 'route_29')).toBe(true);

      const ui = new TownMapUI({ containerId: 'modal-container' });
      const roamers: RoamerState[] = [
        {
          speciesId: 'raikou',
          currentMapId: 'route_29',
          pokemon: PokemonFactory.create('raikou', 40),
          isAwakened: true,
          isCaught: false,
          isDefeated: false,
        },
        {
          speciesId: 'entei',
          currentMapId: 'new_bark_town',
          pokemon: PokemonFactory.create('entei', 40),
          isAwakened: true,
          isCaught: false,
          isDefeated: false,
        },
        {
          speciesId: 'suicune',
          currentMapId: 'burned_tower_1f',
          pokemon: PokemonFactory.create('suicune', 40),
          isAwakened: false,
          isCaught: false,
          isDefeated: false,
        },
      ];

      // Open focused on route_36 while player is at new_bark_town
      ui.open('new_bark_town', ['new_bark_town', 'route_29'], roamers, 'route_36');
      expect(ui.getSelectedLandmark()?.id).toBe('route_36');

      const card = mockDoc.getElementById('town-map-card');
      expect(card?.innerHTML).toContain('LEGENDARY BEAST RADAR');
      expect(card?.innerHTML).toContain('ADJACENT (1 HOP)');
      expect(card?.innerHTML).toContain('SAME ZONE!');
      expect(card?.innerHTML).toContain('DORMANT');

      const radarItems = card?.querySelectorAll('.roamer-radar-item') || [];
      expect(radarItems.length).toBe(3);

      // Clicking Raikou's radar card focuses Route 29
      const raikouCard = radarItems.find((el) => el.getAttribute('data-landmark-id') === 'route_29');
      expect(raikouCard).toBeDefined();
      raikouCard?.click();
      expect(ui.getSelectedLandmark()?.id).toBe('route_29');

      ui.close();
    });

    it('completely hides Legendary Beast Radar when beasts have not yet awakened in Burned Tower', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      const dormantRoamers: RoamerState[] = [
        {
          speciesId: 'raikou',
          currentMapId: 'burned_tower_b1f',
          pokemon: PokemonFactory.create('raikou', 40),
          isAwakened: false,
          isCaught: false,
          isDefeated: false,
        },
        {
          speciesId: 'entei',
          currentMapId: 'burned_tower_b1f',
          pokemon: PokemonFactory.create('entei', 40),
          isAwakened: false,
          isCaught: false,
          isDefeated: false,
        },
        {
          speciesId: 'suicune',
          currentMapId: 'burned_tower_b1f',
          pokemon: PokemonFactory.create('suicune', 40),
          isAwakened: false,
          isCaught: false,
          isDefeated: false,
        },
      ];

      ui.open('azalea_town', ['new_bark_town', 'azalea_town'], dormantRoamers);
      const card = mockDoc.getElementById('town-map-card');
      expect(card).not.toBeNull();
      expect(card?.innerHTML).not.toContain('LEGENDARY BEAST RADAR');
      expect(card?.querySelector('#town-map-roamer-radar')).toBeNull();

      ui.close();
    });

    it('renders centered gold player beacon with concentric ping & pulse rings and YOU badge without compound offset', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      // Open with player in Cherrygrove City
      ui.open('cherrygrove_city');
      expect(ui.getCurrentPlayerLandmark()?.id).toBe('cherrygrove_city');

      const card = mockDoc.getElementById('town-map-card');
      expect(card).not.toBeNull();

      // Check player beacon element structure
      const beacon = card?.querySelector('.town-map-player-beacon');
      expect(beacon).not.toBeNull();

      const pingRing = card?.querySelector('.beacon-ping-ring');
      expect(pingRing).not.toBeNull();

      const pulseHalo = card?.querySelector('.beacon-pulse-halo');
      expect(pulseHalo).not.toBeNull();

      const blip = card?.querySelector('.town-map-player-blip');
      expect(blip).not.toBeNull();

      const youBadge = card?.querySelector('.beacon-you-badge');
      expect(youBadge).not.toBeNull();
      expect(card?.innerHTML).toContain('YOU');

      // Verify styles use concentric neoRadarPing keyframes without compound translate
      const styleEl = mockDoc.getElementById('neo-kanto-town-map-styles');
      const css = (styleEl as any)?.textContent || '';
      expect(css).toContain('neoRadarPing');
      expect(css).toContain('neoRadarPulse');
      expect(css).not.toContain('transform: translate(-50%, -50%) scale(1.0)');

      ui.close();
    });

    it('supports Stitch tactical HUD category filter tabs (ALL, GYMS, DUNGEONS, ROUTES)', () => {
      const ui = new TownMapUI({ containerId: 'modal-container' });
      ui.open('new_bark_town');
      expect(ui.getActiveFilter()).toBe('ALL');

      const card = mockDoc.getElementById('town-map-card');
      expect(card).not.toBeNull();

      // Toolbar and grid telemetry
      expect(card?.innerHTML).toContain('RADAR MATRIX // SECTOR-02');
      expect(card?.innerHTML).toContain('GRID: E-');

      // Filter buttons exist
      const filterBtns = card?.querySelectorAll('.town-map-filter-btn') || [];
      expect(filterBtns.length).toBe(4);

      // Switch to GYMS
      const gymsBtn = filterBtns.find((b) => b.getAttribute('data-filter') === 'GYMS');
      expect(gymsBtn).toBeDefined();
      gymsBtn?.click();
      expect(ui.getActiveFilter()).toBe('GYMS');

      // Switch to DUNGEONS via hotkey '3'
      ui.handleKeyDown({ key: '3', preventDefault: vi.fn() } as any);
      expect(ui.getActiveFilter()).toBe('DUNGEONS');

      // Switch to ROUTES via setActiveFilter
      ui.setActiveFilter('ROUTES');
      expect(ui.getActiveFilter()).toBe('ROUTES');

      // Switch back to ALL via hotkey '1'
      ui.handleKeyDown({ key: '1', preventDefault: vi.fn() } as any);
      expect(ui.getActiveFilter()).toBe('ALL');

      ui.close();
    });

    it('supports fast travel / fly transit action button callback', () => {
      const onFly = vi.fn();
      const ui = new TownMapUI({ containerId: 'modal-container', onFly });
      // Open at New Bark Town with Violet City already visited
      ui.open('new_bark_town', ['new_bark_town', 'violet_city']);

      // Inspect Violet City (flyable: true)
      ui.selectLandmark('violet_city');

      const flyBtn = mockDoc.getElementById('town-map-fly-btn');
      expect(flyBtn).not.toBeNull();
      flyBtn?.click();

      expect(onFly).toHaveBeenCalledTimes(1);
      expect(onFly).toHaveBeenCalledWith(expect.objectContaining({ id: 'violet_city' }));

      ui.close();
    });
  });

  describe('3. Mobile Responsive Viewport Matrix (< 768px Full-Width Architecture)', () => {
    it('computes responsive metrics across standard mobile and desktop viewports', () => {
      // Mobile viewports (iPhone SE 360px, Galaxy 400px, iPhone 16 Pro Max 440px)
      const mobileSE = TownMapUI.getResponsiveMetrics(360);
      expect(mobileSE.isMobile).toBe(true);
      expect(mobileSE.splitDirection).toBe('column');
      expect(mobileSE.cardWidthPct).toBe(100);
      expect(mobileSE.cardHeightPct).toBe(100);

      const mobileFlagship = TownMapUI.getResponsiveMetrics(440);
      expect(mobileFlagship.isMobile).toBe(true);
      expect(mobileFlagship.splitDirection).toBe('column');

      // Desktop viewport (1024px)
      const desktop = TownMapUI.getResponsiveMetrics(1024);
      expect(desktop.isMobile).toBe(false);
      expect(desktop.splitDirection).toBe('row');
      expect(desktop.cardWidthPct).toBe(96);
    });

    it('injects responsive CSS media queries for mobile viewports (< 768px)', () => {
      new TownMapUI({ containerId: 'modal-container' });
      const styleEl = mockDoc.getElementById('neo-kanto-town-map-styles');
      expect(styleEl).not.toBeNull();
      const css = (styleEl as any)?.textContent || '';

      expect(css).toContain('@media (max-width: 768px)');
      expect(css).toContain('#town-map-modal');
      expect(css).toContain('width: 100vw !important');
      expect(css).toContain('height: 100dvh !important');
      expect(css).toContain('flex-direction: column !important');
      expect(css).toContain('min-width: 24px');
      expect(css).toContain('min-height: 24px');
    });

    it('renders stacked full-width layout and >=24px touch targets on mobile viewports', () => {
      const origWidth = (globalThis as any).innerWidth;
      try {
        (globalThis as any).innerWidth = 375; // Mobile screen simulation
        const ui = new TownMapUI({ containerId: 'modal-container' });
        ui.open('new_bark_town');

        const card = mockDoc.getElementById('town-map-card');
        expect(card).not.toBeNull();
        expect(card?.className).toContain('mobile-viewport');

        const split = mockDoc.getElementById('town-map-split');
        expect(split).not.toBeNull();
        expect(split?.className).toContain('mobile-split');

        const nodes = card?.querySelectorAll('.town-map-node') || [];
        expect(nodes.length).toBeGreaterThan(0);
        // Assert node touch targets have min 24px
        const firstNode = nodes[0];
        expect(firstNode.style.cssText).toMatch(/24px/);

        ui.close();
      } finally {
        (globalThis as any).innerWidth = origWidth;
      }
    });
  });
});
