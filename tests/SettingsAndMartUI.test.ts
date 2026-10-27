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

describe('Settings, Mart, and Mobile UI Enhancements', () => {
  beforeEach(() => {
    resetDefaultContainers(mockDoc);
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

    it('renders #overworld-toast-banner as a top-aligned floating pill and plays canonical field rest blackout fade (TICKET-UI-HEALING-POLISH-01)', () => {
      vi.useFakeTimers();
      const hud = new OverworldHUD('overworld-hud-container');
      const toast = mockDoc.querySelector('#overworld-toast-banner') as MockElement;
      expect(toast).not.toBeNull();
      expect(toast.style.position).toBe('fixed');
      expect(toast.style.top).toContain('54px');
      expect(toast.style.borderRadius).toBe('9999px');

      const onFieldRestComplete = vi.fn();
      hud.playFieldRestAnimation(onFieldRestComplete);

      const fieldRestOverlay = mockDoc.querySelector('#field-rest-overlay') as MockElement;
      expect(fieldRestOverlay).not.toBeNull();
      expect(fieldRestOverlay.style.display).toBe('block');
      expect(fieldRestOverlay.style.opacity).toBe('1');
      expect(hud.isDialogueOpen()).toBe(true);
      expect(mockDoc.querySelector('#pokecenter-heal-overlay')).toBeNull();

      vi.advanceTimersByTime(900);
      expect(fieldRestOverlay.style.opacity).toBe('0');
      expect(onFieldRestComplete).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(onFieldRestComplete).toHaveBeenCalledTimes(1);
      expect(fieldRestOverlay.style.display).toBe('none');
      expect(hud.isDialogueOpen()).toBe(false);
      vi.useRealTimers();
    });
  });

});
