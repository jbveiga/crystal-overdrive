import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockElement, MockDocument, resetDefaultContainers } from './helpers/MockDomEnv';

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
import { ItemfinderHUD } from '../src/ui/ItemfinderHUD';
import { ItemfinderRadar } from '../src/world/ItemfinderRadar';
import { BattleHUD } from '../src/ui/BattleHUD';
import { TitleScreenUI } from '../src/ui/TitleScreenUI';
import { MissionLogUI } from '../src/ui/MissionLogUI';
import { MissionManager } from '../src/world/MissionManager';
import { SaveManager } from '../src/core/SaveManager';
import type { SavePreview, PokemonInstance, MoveData } from '../src/types/game';

describe('Mobile & Battle Ergonomics UI Enhancements', () => {
  beforeEach(() => {
    resetDefaultContainers(mockDoc);
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
      expect(defaults.playerSpeedDefault).toBe(3);
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

    it('renders EXP. SHARE MODE controls in StartMenuUI Settings and updates ItemfinderHUD states (TICKET-KEY-ITEMS-UNBOUND-01)', () => {
      let currentExpMode: 'OFF' | 'ALL' | 'CAPPED' = 'CAPPED';
      const ui = new StartMenuUI(
        'modal-container',
        {
          getTrainerName: () => 'GOLD',
          getMoney: () => 3000,
          getBadges: () => ['zephyr'],
          getPartyCount: () => 1,
          getCaughtCount: () => 1,
          getPlayTimeSeconds: () => 120,
          getMapName: () => 'Violet City',
          getExpShareMode: () => currentExpMode,
          getLevelCap: () => 18,
          getGymAceLevel: () => 16,
        },
        {
          onOpenParty: vi.fn(),
          onOpenBag: vi.fn(),
          onOpenPokegear: vi.fn(),
          onSaveGame: vi.fn(),
          onSetExpShareMode: (mode) => {
            currentExpMode = mode;
            return currentExpMode;
          },
        }
      );

      ui.open();
      (mockDoc.querySelector('#start-opt-settings') as MockElement).click();

      const cycleBtn = mockDoc.querySelector('#settings-exp-share-btn') as MockElement;
      const offBtn = mockDoc.querySelector('#settings-exp-off-btn') as MockElement;
      const allBtn = mockDoc.querySelector('#settings-exp-all-btn') as MockElement;
      const cappedBtn = mockDoc.querySelector('#settings-exp-capped-btn') as MockElement;

      expect(cycleBtn).not.toBeNull();
      expect(offBtn).not.toBeNull();
      expect(allBtn).not.toBeNull();
      expect(cappedBtn).not.toBeNull();

      offBtn.click();
      expect(currentExpMode).toBe('OFF');

      allBtn.click();
      expect(currentExpMode).toBe('ALL');

      cappedBtn.click();
      expect(currentExpMode).toBe('CAPPED');

      // Test ItemfinderHUD capsule
      const radarHud = new ItemfinderHUD('overworld-hud-container');
      radarHud.show();
      expect(radarHud.isActive()).toBe(true);

      const ping = ItemfinderRadar.scan(
        10,
        7,
        'UP',
        [{ eventFlag: 'hidden_1', itemId: 'rare_candy', x: 10, y: 6 }],
        new Set()
      );
      radarHud.update(ping);
      const distLabel = mockDoc.querySelector('#itemfinder-distance-label') as MockElement;
      expect(distLabel.innerText).toBe('RIGHT HERE!');
    });
  });

  describe('7. TICKET-UI-BATTLE-ERGONOMICS-SPEED-01: Move Grid Containment, Tray Swap & Decoupled Dialogue Speed', () => {
    const makePkmn = (): PokemonInstance => ({
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
      moves: [{ moveId: 'tackle', currentPp: 35, maxPp: 35 }],
      catchRate: 45,
    });

    const makeHud = () => {
      const hud = new BattleHUD('battle-hud-container');
      (hud as any).playerPokemon = makePkmn();
      (hud as any).enemyPokemon = makePkmn();
      return hud;
    };

    it('injects zero-spill move grid containment rules for the widest phones (448px / 440px / 480px)', () => {
      makeHud();
      const styleEl = mockDoc.head.children.find((c) => c.id === 'crystal-battle-hud-styles') as any;
      expect(styleEl).toBeDefined();
      const css: string = styleEl.textContent;
      expect(css).toContain('grid-template-columns: repeat(2, minmax(0, 1fr)) !important');
      expect(css).toContain('.battle-move-btn');
      expect(css).toContain('min-width: 0 !important');
      expect(css).toContain('max-width: 100% !important');
      expect(css).toContain('text-overflow: ellipsis !important');
      expect(css).toContain('white-space: nowrap !important');
    });

    it('swaps the bottom tray: message mode hides the action menu and takes full width', async () => {
      vi.useFakeTimers();
      try {
        const hud = makeHud();
        const actionMenu = (hud as any).actionMenu as MockElement;
        const messageBox = (hud as any).messageBox as MockElement;
        const p = hud.showMessage('Hi!');
        await vi.advanceTimersByTimeAsync(2000);
        await p;
        expect(actionMenu.style.display).toBe('none');
        expect(messageBox.style.display).toBe('flex');
        expect(messageBox.style.width).toBe('100%');
        expect(messageBox.className).toContain('full-width-dialogue');
      } finally {
        vi.useRealTimers();
      }
    });

    it('gives the action quadrant the full tray on mobile and keeps the split layout on desktop', () => {
      const hud = makeHud();
      const actionMenu = (hud as any).actionMenu as MockElement;
      const messageBox = (hud as any).messageBox as MockElement;

      (globalThis as any).innerWidth = 440;
      hud.showActionMenu();
      expect(actionMenu.style.display).toBe('grid');
      expect(actionMenu.style.width).toBe('100%');
      expect(messageBox.style.display).toBe('none');

      (globalThis as any).innerWidth = 1024;
      hud.showActionMenu();
      expect(actionMenu.style.display).toBe('grid');
      expect(messageBox.style.display).toBe('flex');
    });

    it('scales typewriter and post-delay timing with battle speed multiplier (TICKET-BATTLE-SPEED-EXP-SHARE-POLISH-01)', async () => {
      expect(BattleHUD.DIALOGUE_CHAR_DELAY_MS).toBe(10);
      expect(BattleHUD.DIALOGUE_POST_DELAY_MS).toBe(380);

      vi.useFakeTimers();
      try {
        for (const speed of [1, 2, 3] as const) {
          const hud = makeHud();
          hud.setSpeedMultiplier(speed);
          let done = false;
          const text = 'ABCDE';
          const p = hud.showMessage(text).then(() => {
            done = true;
          });
          const total = hud.getEffectiveCharDelayMs() * text.length + hud.getEffectivePostDelayMs();
          await vi.advanceTimersByTimeAsync(total - 5);
          expect(done).toBe(false);
          await vi.advanceTimersByTimeAsync(10);
          await p;
          expect(done).toBe(true);
        }
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
