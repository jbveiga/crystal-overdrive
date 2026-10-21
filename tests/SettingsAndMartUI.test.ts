import { describe, it, expect, vi, beforeEach } from 'vitest';

// Lightweight in-memory DOM mock for node environment
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

    // Parse each opening tag and its immediate text content
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
    return child;
  }

  removeChild(child: MockElement) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
    return child;
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  click() {
    this.listeners['click']?.forEach((fn) =>
      fn({ stopPropagation: () => {}, preventDefault: () => {} })
    );
  }

  getBoundingClientRect() {
    return { left: 10, top: 10, width: 172, height: 172, right: 182, bottom: 182 };
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
  public head = new MockElement('head');
  public body = new MockElement('body');
  private allElements: Map<string, MockElement> = new Map();

  createElement(tagName: string) {
    return new MockElement(tagName);
  }

  getElementById(id: string): MockElement | null {
    if (this.allElements.has(id)) return this.allElements.get(id)!;
    return this.body.querySelector(`#${id}`);
  }

  querySelector(selector: string): MockElement | null {
    return this.body.querySelector(selector);
  }

  register(el: MockElement) {
    if (el.id) this.allElements.set(el.id, el);
  }

  reset() {
    this.body = new MockElement('body');
    this.head = new MockElement('head');
    this.allElements.clear();

    const modalContainer = new MockElement('div');
    modalContainer.id = 'modal-container';
    this.body.appendChild(modalContainer);
    this.register(modalContainer);

    const hudContainer = new MockElement('div');
    hudContainer.id = 'overworld-hud-container';
    this.body.appendChild(hudContainer);
    this.register(hudContainer);

    const battleHudContainer = new MockElement('div');
    battleHudContainer.id = 'battle-hud-container';
    this.body.appendChild(battleHudContainer);
    this.register(battleHudContainer);
  }
}

const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;
(globalThis as any).addEventListener = vi.fn();
(globalThis as any).removeEventListener = vi.fn();
(globalThis as any).innerWidth = 1024;
(globalThis as any).innerHeight = 768;

import { StartMenuUI } from '../src/ui/StartMenuUI';
import { BagAndMartUI } from '../src/ui/BagAndMartUI';
import { OverworldHUD } from '../src/ui/OverworldHUD';
import { BattleHUD } from '../src/ui/BattleHUD';
import { TitleScreenUI } from '../src/ui/TitleScreenUI';
import { MissionLogUI } from '../src/ui/MissionLogUI';
import { MissionManager } from '../src/world/MissionManager';
import { SaveManager } from '../src/core/SaveManager';
import type { SavePreview, PokemonInstance, MoveData } from '../src/types/game';

describe('Settings, Mart, and Mobile UI Enhancements', () => {
  beforeEach(() => {
    mockDoc.reset();
  });

  describe('1. Settings Submenu in Start Menu', () => {
    it('provides a SETTINGS option in the Start Menu that opens a dedicated Settings Modal', () => {
      const onToggleMute = vi.fn().mockReturnValue(true);
      const onCycleSpeed = vi.fn().mockReturnValue(2);
      const onToggleGamepad = vi.fn().mockReturnValue(true);

      const ui = new StartMenuUI(
        'modal-container',
        {
          getTrainerName: () => 'GOLD',
          getMoney: () => 5000,
          getBadges: () => ['zephyr'],
          getPartyCount: () => 1,
          getCaughtCount: () => 5,
          getPlayTimeSeconds: () => 3600,
          getMapName: () => 'New Bark Town',
          isMuted: () => false,
          getSpeedMultiplier: () => 1,
          isGamepadActive: () => false,
        },
        {
          onOpenParty: vi.fn(),
          onOpenBag: vi.fn(),
          onOpenPokegear: vi.fn(),
          onSaveGame: vi.fn(),
          onToggleMute,
          onCycleSpeed,
          onToggleGamepad,
        }
      );

      ui.open();
      expect(ui.isOpen()).toBe(true);

      const settingsBtn = mockDoc.querySelector('#start-opt-settings') as MockElement;
      expect(settingsBtn).not.toBeNull();
      expect(settingsBtn.innerHTML).toContain('SETTINGS');

      // Click settings option
      settingsBtn.click();
      const settingsModal = mockDoc.querySelector('#settings-modal') as MockElement;
      expect(settingsModal).not.toBeNull();
      expect(settingsModal.style.display).toBe('flex');
      expect(settingsModal.innerHTML).toContain('SETTINGS');

      // Toggle Sound
      const soundBtn = mockDoc.querySelector('#settings-sound-btn') as MockElement;
      expect(soundBtn).not.toBeNull();
      expect(soundBtn.innerText).toContain('SOUND: ON');
      soundBtn.click();
      expect(onToggleMute).toHaveBeenCalled();
      expect(soundBtn.innerText).toContain('SOUND: OFF');

      // Cycle Speed
      const speedBtn = mockDoc.querySelector('#settings-speed-btn') as MockElement;
      expect(speedBtn).not.toBeNull();
      expect(speedBtn.innerText).toContain('SPEED: 1x');
      speedBtn.click();
      expect(onCycleSpeed).toHaveBeenCalled();
      expect(speedBtn.innerText).toContain('SPEED: 2x');

      // Toggle Touch Controls
      const touchBtn = mockDoc.querySelector('#settings-gamepad-btn') as MockElement;
      expect(touchBtn).not.toBeNull();
      expect(touchBtn.innerText).toContain('TOUCH: OFF');
      touchBtn.click();
      expect(onToggleGamepad).toHaveBeenCalled();
      expect(touchBtn.innerText).toContain('TOUCH: ON');

      // Close Settings and return to menu
      const backBtn = mockDoc.querySelector('#close-settings-btn') as MockElement;
      expect(backBtn).not.toBeNull();
      backBtn.click();
      expect(settingsModal.style.display).toBe('none');
      const menuPanel = mockDoc.querySelector('#start-menu-panel') as MockElement;
      expect(menuPanel.style.display).toBe('flex');
    });
  });

  describe('2. Poké Mart Not Inside Bag Menu', () => {
    it('hides #tab-mart in standard Bag view and shows POKéMON BAG title', () => {
      const mockParty: PokemonInstance[] = [
        {
          id: 'cyndaquil-1',
          speciesId: 'cyndaquil',
          nickname: 'Cyndaquil',
          level: 5,
          currentHp: 20,
          stats: { hp: 20, atk: 12, def: 10, spa: 14, spd: 11, spe: 13 },
          status: 'NONE',
          isTrapped: false,
          moves: [],
          gender: 'MALE',
          experience: 125,
          nature: 'Hardy',
          ability: 'Blaze',
          friendship: 70,
        } as any,
      ];
      const bagUI = new BagAndMartUI(
        'modal-container',
        {
          balls: { 'poke-ball': 5 },
          items: { potion: 3 },
          tms: [],
          money: 3000,
          badges: [],
        },
        mockParty
      );

      bagUI.open('ITEMS');
      expect(bagUI.isOpen()).toBe(true);

      const title = mockDoc.querySelector('#bag-modal-title') as MockElement;
      expect(title.innerText).toBe('🎒 POKéMON BAG');

      const tabMart = mockDoc.querySelector('#tab-mart') as MockElement;
      expect(tabMart.style.display).toBe('none');

      const tabsBar = mockDoc.querySelector('#bag-tabs-bar') as MockElement;
      expect(tabsBar.style.display).toBe('flex');
    });

    it('displays Poké Mart directly in openMart() with dedicated POKé MART title and catalog', () => {
      const mockParty: PokemonInstance[] = [];
      const bagUI = new BagAndMartUI(
        'modal-container',
        {
          balls: { 'poke-ball': 0 },
          items: {},
          tms: [],
          money: 3000,
          badges: [],
        },
        mockParty
      );

      bagUI.openMart();
      expect(bagUI.isOpen()).toBe(true);

      const title = mockDoc.querySelector('#bag-modal-title') as MockElement;
      expect(title.innerText).toBe('🏪 POKé MART');

      const tabsBar = mockDoc.querySelector('#bag-tabs-bar') as MockElement;
      expect(tabsBar.style.display).toBe('none');

      const content = mockDoc.querySelector('#bag-content') as MockElement;
      expect(content.innerHTML).toContain('MEDICINE & STATUS HEALERS');
      expect(content.innerHTML).toContain('SPECIALTY & STANDARD POKÉ BALLS');
    });

    it('shows updated placeholder text directing to Poké Mart when items or balls are empty', () => {
      const mockParty: PokemonInstance[] = [];
      const bagUI = new BagAndMartUI(
        'modal-container',
        {
          balls: {},
          items: {},
          tms: [],
          money: 3000,
          badges: [],
        },
        mockParty
      );

      bagUI.open('ITEMS');
      const content = mockDoc.querySelector('#bag-content') as MockElement;
      expect(content.innerHTML).toContain('No medicine items in bag. Visit a Poké Mart to stock up!');

      bagUI.open('BALLS');
      expect(content.innerHTML).toContain('No Pokéballs in bag. Visit a Poké Mart to stock up!');
    });
  });

  describe('3. Preserve Last Save on New Game Until Actually Saved', () => {
    it('clarifies in TitleScreenUI overwrite warning that saving in new adventure replaces previous save', async () => {
      const mockPreview: SavePreview = {
        playerName: 'GOLD',
        gender: 'BOY',
        badgeCount: 2,
        pokedexCount: 8,
        playTimeFormatted: '01:30',
        currentLocationName: 'Cherrygrove City',
        timestamp: 1700000000000,
      };

      const titleUI = new TitleScreenUI('modal-container', mockPreview);
      await titleUI.unlockGate();
      titleUI.moveCursor(1); // Select NEW_GAME
      await titleUI.confirmSelection(); // Open overwrite confirm modal

      expect(titleUI.isOverwriteConfirmOpen()).toBe(true);
      const modal = mockDoc.querySelector('#title-overwrite-modal') as MockElement;
      expect(modal.innerHTML).toContain('Saving in the new adventure will replace the previous save.');
    });
  });

  describe('4. Mobile Controls & Top Header in OverworldHUD', () => {
    it('removes mute & speed buttons from top capsule, leaving gamepad and menu buttons', () => {
      new OverworldHUD('overworld-hud-container');
      const topCapsule = mockDoc.querySelector('#top-menu-capsule') as MockElement;
      expect(topCapsule).not.toBeNull();

      expect(mockDoc.querySelector('#mute-toggle-btn')).toBeNull();
      expect(mockDoc.querySelector('#speed-toggle-btn')).toBeNull();
      expect(mockDoc.querySelector('#gamepad-toggle-btn')).not.toBeNull();
      expect(mockDoc.querySelector('#start-menu-btn')).not.toBeNull();
    });

    it('enlarges virtual D-Pad to 172px and provides toggleGamepad() API', () => {
      const hud = new OverworldHUD('overworld-hud-container');
      const dpadBase = mockDoc.querySelector('#virtual-dpad-base') as MockElement;
      expect(dpadBase).not.toBeNull();
      expect(dpadBase.style.width).toBe('172px');
      expect(dpadBase.style.height).toBe('172px');

      const initial = hud.isGamepadActive();
      const toggled = hud.toggleGamepad();
      expect(toggled).toBe(!initial);
      expect(hud.isGamepadActive()).toBe(toggled);
    });

    it('plays a 6-slot Poké Ball healing animation overlay at fixed canonical speed regardless of 4x turbo (Ticket Sprint 08 & Sprint 10)', () => {
      vi.useFakeTimers();
      const hud = new OverworldHUD('overworld-hud-container');
      hud.updateSpeedDisplay(4);
      const onComplete = vi.fn();

      hud.playHealingAnimation(3, onComplete);
      const healOverlay = mockDoc.querySelector('#pokecenter-heal-overlay') as MockElement;
      expect(healOverlay).not.toBeNull();
      expect(healOverlay.style.display).toBe('flex');
      expect(hud.isDialogueOpen()).toBe(true);

      // At 1500ms it should still be playing even though player speed is 4x
      vi.advanceTimersByTime(1500);
      expect(onComplete).not.toHaveBeenCalled();

      // At 2300ms (790ms pulseDelay + 1400ms hold = 2190ms) it completes
      vi.advanceTimersByTime(800);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(healOverlay.style.display).toBe('none');
      vi.useRealTimers();
    });
  });

  describe('5. Dynamic Trainer Card Name & Keyboard Shortcuts (Ticket Sprint 08)', () => {
    it('renders the dynamic trainer name on the Start Menu option and supports P/K/B/G/T/S/O shortcuts', () => {
      const onOpenParty = vi.fn();
      const onOpenBag = vi.fn();
      const onOpenPokegear = vi.fn();
      const onSaveGame = vi.fn();

      const ui = new StartMenuUI(
        'modal-container',
        {
          getTrainerName: () => 'CRYSTAL',
          getMoney: () => 4200,
          getBadges: () => ['zephyr', 'hive'],
          getPartyCount: () => 3,
          getCaughtCount: () => 12,
          getPlayTimeSeconds: () => 5400,
          getMapName: () => 'Goldenrod City',
          isMuted: () => false,
          getSpeedMultiplier: () => 1,
          isGamepadActive: () => false,
        },
        {
          onOpenParty,
          onOpenBag,
          onOpenPokegear,
          onSaveGame,
          onToggleMute: vi.fn(),
          onCycleSpeed: vi.fn(),
          onToggleGamepad: vi.fn(),
        }
      );

      ui.open();
      const trainerBtn = mockDoc.querySelector('#start-opt-trainer') as MockElement;
      expect(trainerBtn).not.toBeNull();
      expect(trainerBtn.innerHTML).toContain('CRYSTAL');
      expect(trainerBtn.innerHTML).not.toContain('BERNARDO');

      // Test single-key overworld shortcuts (allowSaveAndDigits = false)
      ui.closeAll();
      expect(ui.triggerShortcut('KeyK', false)).toBe(true);
      expect(onOpenParty).toHaveBeenCalledTimes(1);

      expect(ui.triggerShortcut('KeyB', false)).toBe(true);
      expect(onOpenBag).toHaveBeenCalledTimes(1);

      expect(ui.triggerShortcut('KeyG', false)).toBe(true);
      expect(onOpenPokegear).toHaveBeenCalledTimes(1);

      // Save shortcut KeyS is ignored when allowSaveAndDigits is false, but opens the Save confirmation modal when Start Menu is open
      expect(ui.triggerShortcut('KeyS', false)).toBe(false);
      expect(ui.triggerShortcut('KeyS', true)).toBe(true);
      const saveModal = mockDoc.querySelector('#save-confirm-modal') as MockElement;
      expect(saveModal.style.display).toBe('flex');
    });
  });

  describe('6. Sprint 10: Move Learn Modal Fix, Virtual Analog Joystick & Speed Persistence', () => {
    it('makes #move-learn-modal interactive with pointer-events: auto and resolves when a slot or cancel is clicked', async () => {
      const battleHUD = new BattleHUD('battle-hud-container');
      const mockPkmn: PokemonInstance = {
        uid: 'cyndaquil-1',
        speciesId: 'cyndaquil',
        nickname: 'CYNDAQUIL',
        level: 12,
        types: ['Fire'],
        baseStats: { hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 },
        stats: { hp: 35, attack: 20, defense: 18, spAttack: 22, spDefense: 19, speed: 24 },
        currentHp: 35,
        status: 'NONE',
        isTrapped: false,
        moves: [
          { moveId: 'tackle', currentPp: 35, maxPp: 35 },
          { moveId: 'leer', currentPp: 30, maxPp: 30 },
          { moveId: 'smokescreen', currentPp: 20, maxPp: 20 },
          { moveId: 'ember', currentPp: 25, maxPp: 25 },
        ],
        catchRate: 45,
      };
      const newMove: MoveData = {
        id: 'quickattack',
        name: 'Quick Attack',
        type: 'Normal',
        category: 'Physical',
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 1,
      };

      const promise = battleHUD.promptMoveForget(mockPkmn, newMove);
      const modal = mockDoc.querySelector('#move-learn-modal') as MockElement;
      const backdrop = mockDoc.querySelector('#move-learn-backdrop') as MockElement;
      expect(modal).not.toBeNull();
      expect(backdrop).not.toBeNull();
      expect(modal.style.pointerEvents).toBe('auto');
      expect(modal.className).toContain('interactive');

      const slot0 = mockDoc.querySelector('#forget-slot-btn-0') as MockElement;
      expect(slot0).not.toBeNull();
      slot0.click();

      const chosenSlot = await promise;
      expect(chosenSlot).toBe(0);
    });

    it('switches between D-PAD (Buttons) and JOYSTICK (Analog) in OverworldHUD and StartMenuUI Settings', () => {
      const hud = new OverworldHUD('overworld-hud-container');
      expect(hud.getTouchControlStyle()).toBe('DPAD');

      const segUp = mockDoc.querySelector('#dpad-seg-up') as MockElement;
      const knob = mockDoc.querySelector('#virtual-joystick-knob') as MockElement;
      expect(segUp.style.display).toBe('flex');
      expect(knob.style.display).toBe('none');

      const nextStyle = hud.toggleTouchControlStyle();
      expect(nextStyle).toBe('JOYSTICK');
      expect(hud.getTouchControlStyle()).toBe('JOYSTICK');
      expect(segUp.style.display).toBe('none');
      expect(knob.style.display).toBe('block');

      const ui = new StartMenuUI(
        'modal-container',
        {
          getTrainerName: () => 'GOLD',
          getMoney: () => 3000,
          getBadges: () => [],
          getPartyCount: () => 1,
          getCaughtCount: () => 1,
          getPlayTimeSeconds: () => 120,
          getMapName: () => 'New Bark Town',
          isMuted: () => false,
          getSpeedMultiplier: () => 1,
          isGamepadActive: () => true,
          getTouchControlStyle: () => hud.getTouchControlStyle(),
        },
        {
          onOpenParty: vi.fn(),
          onOpenBag: vi.fn(),
          onOpenPokegear: vi.fn(),
          onSaveGame: vi.fn(),
          onToggleMute: vi.fn(),
          onCycleSpeed: vi.fn(),
          onToggleGamepad: vi.fn(),
          onToggleTouchControlStyle: () => hud.toggleTouchControlStyle(),
        }
      );

      ui.open();
      (mockDoc.querySelector('#start-opt-settings') as MockElement).click();
      const styleBtn = mockDoc.querySelector('#settings-control-style-btn') as MockElement;
      expect(styleBtn).not.toBeNull();
      expect(styleBtn.innerText).toContain('JOYSTICK (Analog)');

      styleBtn.click();
      expect(hud.getTouchControlStyle()).toBe('DPAD');
      expect(styleBtn.innerText).toContain('D-PAD (Buttons)');
    });

    it('includes battleSpeedMultiplier and touchControlStyle in SaveManager default options', () => {
      const defaults = SaveManager.getDefaultOptions();
      expect(defaults.playerSpeedDefault).toBe(1);
      expect(defaults.battleSpeedMultiplier).toBe(1);
      expect(defaults.touchControlStyle).toBe('DPAD');
    });
  });

  describe('7. Sprint 11: Unbound-Style MissionLogUI & Start Menu Integration', () => {
    it('renders MissionLogUI with ALL/MAIN/SIDE/COMPLETED tabs, mission dossier, and Start Menu [M] shortcut', () => {
      const manager = new MissionManager();
      const missionLogUI = new MissionLogUI('modal-container', manager);
      const hud = new OverworldHUD('overworld-hud-container');

      const ui = new StartMenuUI(
        'modal-container',
        {
          getTrainerName: () => 'GOLD',
          getMoney: () => 3000,
          getBadges: () => [],
          getPartyCount: () => 1,
          getCaughtCount: () => 1,
          getPlayTimeSeconds: () => 120,
          getMapName: () => 'New Bark Town',
        },
        {
          onOpenParty: vi.fn(),
          onOpenBag: vi.fn(),
          onOpenPokegear: vi.fn(),
          onOpenMissions: () => missionLogUI.open(),
          onSaveGame: vi.fn(),
        }
      );

      expect(ui.triggerShortcut('KeyM', false)).toBe(true);
      expect(missionLogUI.isOpen()).toBe(true);

      const title = mockDoc.querySelector('#mission-dossier-title') as MockElement;
      expect(title).not.toBeNull();
      expect(title.innerText).toContain('M01: A New Beginning');

      const sideTab = mockDoc.querySelector('#mission-tab-side') as MockElement;
      expect(sideTab).not.toBeNull();
      sideTab.click();
      expect((mockDoc.querySelector('#mission-dossier-title') as MockElement).innerText).toContain(
        'S01: The Route 30 Forager'
      );

      hud.showMissionToast('A New Beginning', 'All objectives completed!', 'completed');
      const toast = mockDoc.querySelector('#overworld-toast-banner') as MockElement;
      expect(toast.style.display).toBe('block');
      expect(toast.innerHTML).toContain('MISSION COMPLETED');
    });
  });
});
