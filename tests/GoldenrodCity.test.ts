import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { DeptStoreElevatorUI, DEPT_STORE_FLOORS } from '../src/ui/DeptStoreElevatorUI';
import { RadioTowerQuizUI, RADIO_TOWER_QUIZ_QUESTIONS } from '../src/ui/RadioTowerQuizUI';
import { npcsByMap } from '../src/world/npcData';
import { AudioManager } from '../src/audio/AudioManager';
import type { MapData, PokemonInstance } from '../src/types/game';

// Lightweight in-memory DOM mock for node environment UI test
class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public style: any;
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  private _innerHTML: string = '';
  public innerText: string = '';
  public textContent: string = '';
  public listeners: Record<string, Function[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
    const styleObj: any = {
      setProperty: (prop: string, val: string) => {
        const camelK = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
        styleObj[camelK] = val;
      },
    };
    this.style = new Proxy(styleObj, {
      get: (target, prop: string) => target[prop] || '',
      set: (target, prop: string, val: string) => {
        target[prop] = val;
        if (prop === 'cssText') {
          val.split(';').forEach((decl) => {
            const [k, v] = decl.split(':').map((s) => s.trim());
            if (k && v) {
              const camelK = k.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
              target[camelK] = v;
            }
          });
        }
        return true;
      },
    });
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
      const styleMatch = attrs.match(/style=["']([^"']+)["']/i);
      const textMatch = val.slice(regex.lastIndex).match(/^([^<]*)/);

      if (idMatch || classMatch || tag.toLowerCase() === 'button' || styleMatch) {
        const child = new MockElement(tag);
        if (idMatch) child.id = idMatch[1];
        if (classMatch) child.className = classMatch[1];
        if (textMatch) {
          child.textContent = textMatch[1].trim();
          child.innerText = child.textContent;
          child._innerHTML = child.textContent;
        }
        if (styleMatch) {
          styleMatch[1].split(';').forEach((decl) => {
            const [k, v] = decl.split(':').map((s) => s.trim());
            if (k && v) {
              const camelK = k.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
              child.style[camelK] = v;
            }
          });
        }
        this.appendChild(child);
      }
    }
  }

  appendChild(child: MockElement) {
    child.parent = this;
    this.children.push(child);
  }

  querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      return this.getElementById(selector.slice(1));
    }
    return this.children[0] || null;
  }

  querySelectorAll(selector: string): MockElement[] {
    return this.children;
  }

  getElementById(id: string): MockElement | null {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.getElementById(id);
      if (found) return found;
    }
    return null;
  }

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((f) => f !== fn);
    }
  }

  click() {
    if (this.listeners['click']) {
      this.listeners['click'].forEach((fn) => fn({ stopPropagation: () => {}, preventDefault: () => {} }));
    }
  }

  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter((c) => c !== this);
      this.parent = null;
    }
  }
}

class MockDocument {
  public body: MockElement = new MockElement('BODY');
  public head: MockElement = new MockElement('HEAD');
  private elementsById: Map<string, MockElement> = new Map();

  createElement(tag: string): MockElement {
    return new MockElement(tag);
  }

  getElementById(id: string): MockElement | null {
    return this.body.getElementById(id) || this.head.getElementById(id) || this.elementsById.get(id) || null;
  }

  register(id: string, el: MockElement) {
    this.elementsById.set(id, el);
  }
}

describe('TICKET-WORLD-GOLDENROD-CITY-01: Goldenrod City Metropolis 10-Point Package', () => {
  const GOLDENROD_MAPS = [
    'goldenrod_city',
    'goldenrod_gym',
    'goldenrod_poke_center',
    'goldenrod_bike_shop',
    'goldenrod_game_corner',
    'goldenrod_flower_shop',
    'goldenrod_name_rater',
    'goldenrod_bill_house',
    'goldenrod_magnet_train_station',
    'goldenrod_underground',
    'goldenrod_dept_store_1f',
    'goldenrod_dept_store_2f',
    'goldenrod_dept_store_3f',
    'goldenrod_dept_store_4f',
    'goldenrod_dept_store_5f',
    'goldenrod_dept_store_6f',
    'goldenrod_dept_store_roof',
    'radio_tower_1f',
    'radio_tower_2f',
    'radio_tower_3f',
    'radio_tower_4f',
    'radio_tower_5f',
  ];

  function loadMap(id: string): MapData {
    const p = path.resolve(__dirname, '../public/assets/data/maps', `${id}.json`);
    expect(fs.existsSync(p), `Map file must exist: ${id}.json`).toBe(true);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }

  let doc: MockDocument;

  beforeEach(() => {
    doc = new MockDocument();
    (globalThis as any).document = doc;
    (globalThis as any).window = {
      innerWidth: 1024,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  });

  describe('Dimension 1: Reciprocal Navigation & Safe Landing Aprons (Pillars 1 & 3)', () => {
    it('asserts 100% of Goldenrod 22 maps have valid warps landing on walkable tiles (0 or 2)', () => {
      expect(GOLDENROD_MAPS.length).toBe(22);

      GOLDENROD_MAPS.forEach((mapId) => {
        const map = loadMap(mapId);
        expect(map.warps.length, `Map ${mapId} must have at least one warp`).toBeGreaterThanOrEqual(1);

        map.warps.forEach((warp) => {
          const target = loadMap(warp.targetMapId);
          expect(target, `Target map ${warp.targetMapId} must exist`).toBeDefined();
          const tile = target.collisionGrid[warp.targetY * target.width + warp.targetX];
          expect(
            tile === 0 || tile === 2,
            `Warp from ${mapId} to ${warp.targetMapId} at (${warp.targetX}, ${warp.targetY}) must land on walkable tile (was ${tile})`
          ).toBe(true);
        });
      });
    });

    it('asserts reciprocal warps between goldenrod_city and key landmark interiors', () => {
      const city = loadMap('goldenrod_city');

      const expectedLandmarks = [
        'goldenrod_gym',
        'goldenrod_bike_shop',
        'goldenrod_bill_house',
        'goldenrod_magnet_train_station',
        'goldenrod_flower_shop',
        'goldenrod_name_rater',
        'goldenrod_dept_store_1f',
        'goldenrod_game_corner',
        'radio_tower_1f',
        'goldenrod_poke_center',
        'goldenrod_underground',
      ];

      expectedLandmarks.forEach((landmarkId) => {
        const cityWarp = city.warps.find((w) => w.targetMapId === landmarkId);
        expect(cityWarp, `goldenrod_city must have warp to ${landmarkId}`).toBeDefined();

        const interior = loadMap(landmarkId);
        const returnWarp = interior.warps.find((w) => w.targetMapId === 'goldenrod_city');
        expect(returnWarp, `${landmarkId} must have reciprocal return warp to goldenrod_city`).toBeDefined();
      });
    });

    it('asserts sequential vertical connectivity between all 7 Dept Store floors', () => {
      const floors = ['1f', '2f', '3f', '4f', '5f', '6f', 'roof'];
      for (let i = 0; i < floors.length - 1; i++) {
        const curMap = loadMap(`goldenrod_dept_store_${floors[i]}`);
        const nextMapId = `goldenrod_dept_store_${floors[i + 1]}`;
        const upWarp = curMap.warps.find((w) => w.targetMapId === nextMapId);
        expect(upWarp, `Floor ${floors[i]} must have ascending stairs to ${nextMapId}`).toBeDefined();
      }
    });

    it('asserts sequential vertical connectivity across all 5 Radio Tower floors', () => {
      for (let f = 1; f < 5; f++) {
        const curMap = loadMap(`radio_tower_${f}f`);
        const nextMapId = `radio_tower_${f + 1}f`;
        const upWarp = curMap.warps.find((w) => w.targetMapId === nextMapId);
        expect(upWarp, `Radio Tower ${f}F must have ascending stairs to ${nextMapId}`).toBeDefined();
      }
    });
  });

  describe('Dimension 2 & 3: NPC Population, 100% Walkability & Gym Roster', () => {
    it('asserts 100% of NPCs across Goldenrod 22 maps stand on strictly walkable tiles (0 or 2)', () => {
      GOLDENROD_MAPS.forEach((mapId) => {
        const npcs = npcsByMap[mapId];
        if (!npcs) return;
        const map = loadMap(mapId);

        npcs.forEach((npc) => {
          const tile = map.collisionGrid[npc.y * map.width + npc.x];
          expect(
            tile === 0 || tile === 2,
            `NPC ${npc.id} on ${mapId} at (${npc.x}, ${npc.y}) must stand on walkable tile (was ${tile})`
          ).toBe(true);
        });
      });
    });

    it('asserts Leader Whitney and all 4 Gym trainers are fully populated with authentic teams', () => {
      const gymNpcs = npcsByMap.goldenrod_gym;
      expect(gymNpcs).toBeDefined();

      const whitney = gymNpcs!.find((n) => n.id === 'whitney');
      expect(whitney).toBeDefined();
      expect(whitney!.trainerTeam?.length).toBe(2);
      expect(whitney!.trainerTeam![0].speciesId).toBe('clefairy');
      expect(whitney!.trainerTeam![0].level).toBe(18);
      expect(whitney!.trainerTeam![1].speciesId).toBe('miltank');
      expect(whitney!.trainerTeam![1].level).toBe(20);
      expect(whitney!.trainerTeam![1].moves).toContain('rollout');
      expect(whitney!.trainerTeam![1].moves).toContain('milkdrink');

      const carrie = gymNpcs!.find((n) => n.id === 'lass_carrie');
      expect(carrie).toBeDefined();
      expect(carrie!.trainerPokemon?.speciesId).toBe('snubbull');

      const bridget = gymNpcs!.find((n) => n.id === 'lass_bridget');
      expect(bridget).toBeDefined();
      expect(bridget!.trainerTeam?.length).toBe(3);
      expect(bridget!.trainerTeam![0].speciesId).toBe('jigglypuff');

      const victoria = gymNpcs!.find((n) => n.id === 'beauty_victoria');
      expect(victoria).toBeDefined();
      expect(victoria!.trainerTeam?.length).toBe(3);

      const samantha = gymNpcs!.find((n) => n.id === 'beauty_samantha');
      expect(samantha).toBeDefined();
      expect(samantha!.trainerTeam?.length).toBe(2);
      expect(samantha!.trainerTeam![0].speciesId).toBe('meowth');
    });
  });

  describe('Dimension 4: Whitney Crying Tantrum Mechanism & Plain Badge Award', () => {
    it('verifies Whitney tantrum state transitions in main.ts logic', () => {
      const mainPath = path.resolve(__dirname, '../src/main.ts');
      const mainCode = fs.readFileSync(mainPath, 'utf8');

      // 1. Defeat triggers crying dialogue without awarding badge immediately
      expect(mainCode).toContain("WHITNEY: …Sniff… …Waaaaaaah! What a meanie! I lost! You're horrible!");
      expect(mainCode).toContain("storyFlags.add('whitney_defeated')");

      // 2. Bridget cutscene unlocks Whitney calming
      expect(mainCode).toContain("targetNpc.id === 'lass_bridget' && storyFlags.has('whitney_defeated')");
      expect(mainCode).toContain("storyFlags.add('whitney_calmed')");
      expect(mainCode).toContain("LASS BRIDGET: Oh, no. You made WHITNEY cry.");

      // 3. Talking to Whitney after calmed awards Plain Badge & TM45 Attract
      expect(mainCode).toContain("!storyFlags.has('plain_badge_received')");
      expect(mainCode).toContain("inventory.badges.push('plain')");
      expect(mainCode).toContain("inventory.tms.push('TM45')");
      expect(mainCode).toContain("storyFlags.add('ENGINE_PLAINBADGE')");
    });
  });

  describe('Dimension 4: Flower Shop Squirtbottle Gating', () => {
    it('verifies Flower Shop strictly gates Squirtbottle behind Plain Badge', () => {
      const mainPath = path.resolve(__dirname, '../src/main.ts');
      const mainCode = fs.readFileSync(mainPath, 'utf8');

      expect(mainCode).toContain("targetNpc.id === 'florist'");
      // Must check for Plain Badge
      expect(mainCode).toContain("!inventory.badges.includes('plain')");
      expect(mainCode).toContain('PLAINBADGE');
      expect(mainCode).toContain("storyFlags.add('has_squirtbottle')");
    });
  });

  describe('Dimension 4: Bike Shop & Bill House Eevee Mechanics', () => {
    it('verifies Bike Shop loan grant in main.ts', () => {
      const mainPath = path.resolve(__dirname, '../src/main.ts');
      const mainCode = fs.readFileSync(mainPath, 'utf8');

      expect(mainCode).toContain("targetNpc.id === 'bike_shop_owner'");
      expect(mainCode).toContain("storyFlags.add('HAS_BICYCLE')");
      expect(mainCode).toContain("inventory.keyItems.push('BICYCLE')");
    });

    it('verifies Bill Sister phone registration and Bill Eevee grant with party full guard', () => {
      const mainPath = path.resolve(__dirname, '../src/main.ts');
      const mainCode = fs.readFileSync(mainPath, 'utf8');

      expect(mainCode).toContain("targetNpc.id === 'bills_sister'");
      expect(mainCode).toContain("storyFlags.add('PHONE_BILL')");

      expect(mainCode).toContain("targetNpc.id === 'bill'");
      expect(mainCode).toContain('playerParty.length >= 6');
      expect(mainCode).toContain("PokemonFactory.create('eevee', 20)");
      expect(mainCode).toContain("storyFlags.add('HAS_BILLS_EEVEE')");
    });
  });

  describe('RadioTowerQuizUI & 5-Question Certification Engine (Pillars 1 & 4)', () => {
    it('contains all 5 canonical Crystal questions with exact Y-Y-N-Y-N answers', () => {
      expect(RADIO_TOWER_QUIZ_QUESTIONS.length).toBe(5);

      const answers = RADIO_TOWER_QUIZ_QUESTIONS.map((q) => q.correctAnswer);
      expect(answers).toEqual([true, true, false, true, false]);
    });

    it('rejects incorrect answers and sets isFailed requiring retry', () => {
      const ui = new RadioTowerQuizUI();
      let completed = false;

      ui.open({
        onComplete: () => {
          completed = true;
        },
        onClose: () => {},
      });

      expect(ui.isOpen()).toBe(true);

      // Q1 correct is YES (true). Submit NO (false)
      ui.submitAnswer(false);
      expect((ui as any).isFailed).toBe(true);
      expect(completed).toBe(false);

      // Retrying resets question index to 0
      ui.retryQuiz();
      expect((ui as any).isFailed).toBe(false);
      expect((ui as any).currentQuestionIdx).toBe(0);

      ui.close();
      expect(ui.isOpen()).toBe(false);
    });

    it('completes quiz and triggers onComplete when Y-Y-N-Y-N sequence is submitted', () => {
      const ui = new RadioTowerQuizUI();
      let completed = false;

      ui.open({
        onComplete: () => {
          completed = true;
        },
        onClose: () => {},
      });

      // Submit Y-Y-N-Y-N
      ui.submitAnswer(true);  // Q1
      ui.submitAnswer(true);  // Q2
      ui.submitAnswer(false); // Q3
      ui.submitAnswer(true);  // Q4
      ui.submitAnswer(false); // Q5

      expect((ui as any).isCompleted).toBe(true);
      ui.finishQuiz();
      expect(completed).toBe(true);
      expect(ui.isOpen()).toBe(false);
    });

    it('adapts responsive layout parameters on mobile viewports (< 768px)', () => {
      (globalThis as any).window.innerWidth = 390;
      const ui = new RadioTowerQuizUI();

      ui.open({
        onComplete: () => {},
        onClose: () => {},
      });

      const container = doc.getElementById('radio-tower-quiz-container');
      expect(container?.style.width).toBe('100vw');
      expect(container?.style.height).toBe('100dvh');
      ui.close();
    });
  });

  describe('DeptStoreElevatorUI (Google Stitch Neo-Kanto Protocol)', () => {
    it('contains all 7 department store levels with valid target map IDs', () => {
      expect(DEPT_STORE_FLOORS.length).toBe(7);

      const expectedFloors = ['roof', '6f', '5f', '4f', '3f', '2f', '1f'];
      expect(DEPT_STORE_FLOORS.map((f) => f.id)).toEqual(expectedFloors);

      DEPT_STORE_FLOORS.forEach((floor) => {
        const targetMap = loadMap(floor.mapId);
        expect(targetMap, `Map for floor ${floor.id} must exist`).toBeDefined();
      });
    });

    it('triggers onSelectFloor callback when a level is confirmed', () => {
      const ui = new DeptStoreElevatorUI();
      let selectedFloorId: string | null = null;

      ui.open({
        currentMapId: 'goldenrod_dept_store_1f',
        onSelectFloor: (floor) => {
          selectedFloorId = floor.id;
        },
        onClose: () => {},
      });

      expect(ui.isOpen()).toBe(true);

      // Select floor index 2 (5F: TM Corner)
      (ui as any).selectedIndex = 2;
      (ui as any).confirmFloor();

      expect(selectedFloorId).toBe('5f');
      expect(ui.isOpen()).toBe(false);
    });

    it('adapts responsive layout parameters on mobile viewports (< 768px)', () => {
      (globalThis as any).window.innerWidth = 390;
      const ui = new DeptStoreElevatorUI();

      ui.open({
        currentMapId: 'goldenrod_dept_store_1f',
        onSelectFloor: () => {},
        onClose: () => {},
      });

      const container = doc.getElementById('dept-store-elevator-container');
      expect(container?.style.width).toBe('100vw');
      expect(container?.style.height).toBe('100dvh');
      ui.close();
    });
  });

  describe('Dimension 5 & 9: Ground Item Balls, Hidden Items & Coin Case Walkability', () => {
    it('verifies Coin Case at (7, 25) in Goldenrod Underground is registered on a walkable tile', () => {
      const underground = loadMap('goldenrod_underground');
      const tile = underground.collisionGrid[25 * underground.width + 7];
      expect(tile, 'Underground Coin Case at (7, 25) must be walkable (0 or 2)').toBe(0);
    });

    it('verifies Ultra Ball at (8, 5) on Radio Tower 5F is on a walkable tile', () => {
      const tower5f = loadMap('radio_tower_5f');
      const tile = tower5f.collisionGrid[5 * tower5f.width + 8];
      expect(tile, 'Radio Tower 5F Ultra Ball at (8, 5) must be walkable (0 or 2)').toBe(0);
    });
  });

  describe('Dimension 7: Signposts & Directional Lore', () => {
    it('verifies goldenrod_city has 10 canonical signpost bgEvents', () => {
      const city = loadMap('goldenrod_city');
      expect(city.bgEvents).toBeDefined();
      expect(city.bgEvents!.length).toBeGreaterThanOrEqual(10);

      const signSpeakers = city.bgEvents!.map((e) => e.speaker || '');
      expect(signSpeakers.some((s) => s.includes('GOLDENROD CITY'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('GYM'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('RADIO TOWER'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('DEPT. STORE'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('BIKE SHOP'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('GAME CORNER'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('NAME RATER'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('FLOWER SHOP'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('TRAIN'))).toBe(true);
      expect(signSpeakers.some((s) => s.includes('UNDERGROUND'))).toBe(true);
    });
  });

  describe('Dimension 10: Zone BGM Mapping', () => {
    it('resolves goldenrod maps cleanly to bgm_goldenrod_city, Game Corner to bgm_game_corner, and Gym to bgm_gym', () => {
      const am = new AudioManager();
      expect(am.getTrackForMap('goldenrod_city')).toBe('bgm_goldenrod_city');
      expect(am.getTrackForMap('goldenrod_dept_store_1f')).toBe('bgm_goldenrod_city');
      expect(am.getTrackForMap('radio_tower_1f')).toBe('bgm_goldenrod_city');
      expect(am.getTrackForMap('goldenrod_game_corner')).toBe('bgm_game_corner');
      expect(am.getTrackForMap('goldenrod_gym')).toBe('bgm_gym');
    });
  });
});
