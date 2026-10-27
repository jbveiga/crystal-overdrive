import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartMenuUI } from '../src/ui/StartMenuUI';
import { ItemfinderHUD } from '../src/ui/ItemfinderHUD';
import { MissionLogUI } from '../src/ui/MissionLogUI';
import { MissionManager } from '../src/world/MissionManager';
import fs from 'fs';
import path from 'path';
import { MockElement, MockDocument } from './helpers/MockDomEnv';

describe('StartMenuUI — Settings, Drawer & Submodals', () => {
  let doc: MockDocument;
  let mockContainer: MockElement;
  let caughtSet: Set<string>;
  let seenSet: Set<string>;
  let badges: string[];

  beforeEach(() => {
    doc = new MockDocument();
    (global as any).document = doc;

    mockContainer = new MockElement('div');
    mockContainer.id = 'modal-container';
    doc.body.appendChild(mockContainer);
    doc.register(mockContainer);

    caughtSet = new Set(['cyndaquil', 'pidgey', 'bellsprout']);
    seenSet = new Set(['cyndaquil', 'pidgey', 'bellsprout', 'totodile', 'chikorita', 'sentret', 'hoothoot']);
    badges = ['zephyr', 'hive'];
  });

  const createUI = () => {
    return new StartMenuUI(
      'modal-container',
      {
        getTrainerName: () => 'GOLD',
        getMoney: () => 14500,
        getBadges: () => badges,
        getPartyCount: () => 3,
        getCaughtCount: () => caughtSet.size,
        getCaughtSpeciesIds: () => caughtSet,
        getSeenSpeciesIds: () => seenSet,
        getKeyItems: () => ['POKéGEAR', 'BICYCLE', '💧 SQUIRTBOTTLE'],
        getPlayTimeSeconds: () => 3725, // 01:02:05
        getMapName: () => 'Azalea Town',
      },
      {
        onOpenParty: vi.fn(),
        onOpenBag: vi.fn(),
        onOpenPokegear: vi.fn(),
        onSaveGame: vi.fn().mockResolvedValue(undefined),
      }
    );
  };


  it('verifies Neo-Kanto Start Menu drawer, Save Progress Console, and Settings category tabs (TICKET-UI-NEO-KANTO-STITCH-SLICE-01)', async () => {
    let saved = false;
    const ui = new StartMenuUI(
      'modal-container',
      {
        getTrainerName: () => 'GOLD',
        getMoney: () => 14500,
        getBadges: () => ['zephyr', 'hive'],
        getPartyCount: () => 3,
        getCaughtCount: () => 12,
        getCaughtSpeciesIds: () => new Set(['cyndaquil']),
        getSeenSpeciesIds: () => new Set(['cyndaquil']),
        getPlayTimeSeconds: () => 3725, // 01:02:05
        getMapName: () => 'Azalea Town',
      },
      {
        onOpenParty: vi.fn(),
        onOpenBag: vi.fn(),
        onOpenPokegear: vi.fn(),
        onSaveGame: async () => {
          saved = true;
        },
      }
    );

    ui.open();

    // 1. Start Menu Panel drawer styling (Gen 2 double-framed panel)
    const startPanel = doc.getElementById('start-menu-panel');
    expect(startPanel).not.toBeNull();
    expect(startPanel?.style.background).toContain('linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%)');
    expect(startPanel?.style.boxShadow).toContain('0 12px 32px rgba(0, 0, 0, 0.8)');

    // Tactile buttons
    const pokedexBtn = doc.getElementById('start-opt-pokedex');
    expect(pokedexBtn?.className).toContain('neo-kanto-tactile-btn');
    expect(pokedexBtn?.style.boxShadow).toContain('0 4px 0 0 #070B14');

    // 2. Save Progress Console
    ui.openSaveConfirm();
    const saveModal = doc.getElementById('save-confirm-modal');
    expect(saveModal).not.toBeNull();
    expect(saveModal?.style.display).toBe('flex');
    expect(saveModal?.style.background).toBe('rgba(15, 23, 42, 0.98)');
    expect(saveModal?.style.boxShadow).toContain('0 12px 36px rgba(0, 0, 0, 0.85)');

    // Check telemetry fields
    expect(saveModal?.innerHTML).toContain('GOLD');
    expect(saveModal?.innerHTML).toContain('Azalea Town');
    expect(saveModal?.innerHTML).toContain('01:02:05');

    const yesBtn = doc.getElementById('confirm-save-yes-btn');
    const noBtn = doc.getElementById('confirm-save-no-btn');
    expect(yesBtn).not.toBeNull();
    expect(noBtn).not.toBeNull();
    expect(yesBtn?.style.boxShadow).toContain('0 4px 0 0 #070B14');
    expect(noBtn?.style.boxShadow).toContain('0 4px 0 0 #070B14');

    // Click Save
    yesBtn?.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(saved).toBe(true);

    // 3. Settings Workstation Category Tabs
    ui.openSettings();
    const settingsModal = doc.getElementById('settings-modal');
    expect(settingsModal).not.toBeNull();
    expect(settingsModal?.style.display).toBe('flex');
    expect(settingsModal?.style.background).toBe('rgba(15, 23, 42, 0.98)');
    expect(settingsModal?.style.boxShadow).toContain('0 12px 36px rgba(0, 0, 0, 0.88)');

    const tabAll = doc.getElementById('settings-tab-all');
    const tabAudio = doc.getElementById('settings-tab-audio');
    const tabGameplay = doc.getElementById('settings-tab-gameplay');
    const tabGraphics = doc.getElementById('settings-tab-graphics');
    const tabControls = doc.getElementById('settings-tab-controls');

    expect(tabAll).not.toBeNull();
    expect(tabAudio).not.toBeNull();
    expect(tabGameplay).not.toBeNull();
    expect(tabGraphics).not.toBeNull();
    expect(tabControls).not.toBeNull();

    // Default tab is ALL: all rows are visible
    const audioRows = settingsModal?.querySelectorAll('[data-settings-category="AUDIO"]') || [];
    const gameplayRows = settingsModal?.querySelectorAll('[data-settings-category="GAMEPLAY"]') || [];
    const graphicsRows = settingsModal?.querySelectorAll('[data-settings-category="GRAPHICS"]') || [];
    const controlsRows = settingsModal?.querySelectorAll('[data-settings-category="CONTROLS"]') || [];

    expect(audioRows.length).toBeGreaterThan(0);
    expect(gameplayRows.length).toBeGreaterThan(0);
    expect(graphicsRows.length).toBeGreaterThan(0);
    expect(controlsRows.length).toBeGreaterThan(0);

    // Filter to AUDIO
    tabAudio?.click();
    for (const row of audioRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of gameplayRows) {
      expect(row.style.display).toBe('none');
    }
    for (const row of graphicsRows) {
      expect(row.style.display).toBe('none');
    }

    // Filter to GAMEPLAY
    tabGameplay?.click();
    for (const row of gameplayRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of audioRows) {
      expect(row.style.display).toBe('none');
    }

    // Filter to GRAPHICS
    tabGraphics?.click();
    for (const row of graphicsRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of gameplayRows) {
      expect(row.style.display).toBe('none');
    }

    // Filter to CONTROLS
    tabControls?.click();
    for (const row of controlsRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of audioRows) {
      expect(row.style.display).toBe('none');
    }

    // Restore ALL
    tabAll?.click();
    for (const row of audioRows) {
      expect(row.style.display).not.toBe('none');
    }
    for (const row of gameplayRows) {
      expect(row.style.display).not.toBe('none');
    }

    // 4. Bug-Catching Contest Leaderboard Modal
    ui.openBugContestLeaderboard();
    const contestModal = doc.getElementById('bug-contest-leaderboard-modal');
    expect(contestModal).not.toBeNull();
    expect(contestModal?.style.display).toBe('flex');
    expect(contestModal?.innerHTML).toContain('BUG-CATCHING CONTEST & STADIUM ARENA');
    expect(contestModal?.innerHTML).toContain('SCYTHER');
    expect(contestModal?.innerHTML).toContain('236 PTS');
  });

  it('verifies Neo-Kanto MissionLogUI and ItemfinderHUD faceted radar styling (TICKET-UI-NEO-KANTO-STITCH-SLICE-01)', () => {
    // 1. MissionLogUI
    const missionManager = new MissionManager();
    const missionLogUI = new MissionLogUI('modal-container', missionManager);
    missionLogUI.open();

    const logCard = doc.getElementById('mission-log-card');
    expect(logCard).not.toBeNull();
    expect(logCard?.style.background).toBe('#0D1322');
    expect(logCard?.style.boxShadow).toContain('0 6px 0 0 #070B14');

    const tabMain = doc.getElementById('mission-tab-main');
    expect(tabMain).not.toBeNull();
    expect(tabMain?.style.boxShadow).toContain('0 4px 0 0 #070B14');

    // 2. ItemfinderHUD Faceted Radar Capsule
    const hud = new ItemfinderHUD('modal-container');
    hud.show();
    expect(hud.isActive()).toBe(true);

    const capsule = doc.getElementById('itemfinder-hud-capsule');
    expect(capsule).not.toBeNull();
    expect(capsule?.style.background).toBe('#0D1322');
    expect(capsule?.style.borderRadius).toBe('9999px');
    expect(capsule?.style.boxShadow).toContain('0 4px 16px rgba(0, 0, 0, 0.6)');

    const dial = doc.getElementById('itemfinder-compass-dial');
    expect(dial).not.toBeNull();
    expect(dial?.style.background).toBe('#080E1D');
    expect(dial?.style.borderRadius).toBe('50%');

    // Test Idle / No Response Ping
    hud.update({
      hasItemInRange: false,
      distance: null,
      bearing: null,
      bearingAngleDeg: 0,
      isFacingDirectly: false,
      proximityBand: 'FAR',
      nearestItem: null,
    });
    expect(capsule?.style.borderColor).toBe('#475569');
    expect(doc.getElementById('itemfinder-distance-label')?.innerText).toBe('NO RESPONSE');

    // Test Active Vector Lock Ping (distance 4)
    hud.update({
      hasItemInRange: true,
      distance: 4.2,
      bearing: 'NORTH',
      bearingAngleDeg: 0,
      isFacingDirectly: false,
      proximityBand: 'APPROACHING',
      nearestItem: { itemId: 'ultra_ball', x: 10, y: 10, eventFlag: 'hidden_1' },
    });
    expect(capsule?.style.borderColor).toBe('#38bdf8');
    expect(doc.getElementById('itemfinder-radar-header')?.innerText).toBe('📡 BEARING NORTH');
    expect(doc.getElementById('itemfinder-distance-label')?.innerText).toBe('📍 4 TILES');

    // Test Gold Lock-On Ping (distance 1, facing directly)
    hud.update({
      hasItemInRange: true,
      distance: 1,
      bearing: 'NORTH',
      bearingAngleDeg: 0,
      isFacingDirectly: true,
      proximityBand: 'FACING',
      nearestItem: { itemId: 'ultra_ball', x: 10, y: 10, eventFlag: 'hidden_1' },
    });
    expect(capsule?.style.borderColor).toBe('#FFD028');
    expect(doc.getElementById('itemfinder-radar-header')?.innerText).toBe('✨ LOCKED ON [A]');
    expect(doc.getElementById('itemfinder-distance-label')?.innerText).toBe('RIGHT HERE!');
  });

  it('integrates Battle Speed and Text Speed controls into StartMenuUI Settings (TICKET-BATTLE-SPEED-EXP-SHARE-POLISH-01)', () => {
    let currentBattleSpeed: SpeedMultiplier = 1;
    let currentTextSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT' = 'MID';

    const onSetBattleSpeed = vi.fn((spd: SpeedMultiplier) => {
      currentBattleSpeed = spd;
    });
    const onCycleBattleSpeed = vi.fn(() => {
      currentBattleSpeed = currentBattleSpeed === 1 ? 2 : currentBattleSpeed === 2 ? 3 : 1;
      return currentBattleSpeed;
    });
    const onSetTextSpeed = vi.fn((ts: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => {
      currentTextSpeed = ts;
    });
    const onCycleTextSpeed = vi.fn(() => {
      const order: Array<'SLOW' | 'MID' | 'FAST' | 'INSTANT'> = ['SLOW', 'MID', 'FAST', 'INSTANT'];
      currentTextSpeed = order[(order.indexOf(currentTextSpeed) + 1) % order.length];
      return currentTextSpeed;
    });

    const ui = new StartMenuUI(
      'modal-container',
      {
        getTrainerName: () => 'GOLD',
        getMoney: () => 14500,
        getBadges: () => ['zephyr'],
        getPartyCount: () => 1,
        getCaughtCount: () => 1,
        getPlayTimeSeconds: () => 100,
        getMapName: () => 'New Bark Town',
        getBattleSpeedMultiplier: () => currentBattleSpeed,
        getTextSpeed: () => currentTextSpeed,
      },
      {
        onOpenParty: vi.fn(),
        onOpenBag: vi.fn(),
        onOpenPokegear: vi.fn(),
        onSaveGame: vi.fn(),
        onSetBattleSpeed,
        onCycleBattleSpeed,
        onSetTextSpeed,
        onCycleTextSpeed,
      }
    );

    ui.openSettings();
    const settingsModal = doc.getElementById('settings-modal');
    expect(settingsModal).not.toBeNull();

    // Verify Battle Speed controls
    const battleSpeedHeaderBtn = settingsModal?.querySelector('#settings-battle-speed-btn');
    const battleSpeed1xBtn = settingsModal?.querySelector('#settings-battle-speed-1x-btn');
    const battleSpeed2xBtn = settingsModal?.querySelector('#settings-battle-speed-2x-btn');
    const battleSpeed3xBtn = settingsModal?.querySelector('#settings-battle-speed-3x-btn');

    expect(battleSpeedHeaderBtn).toBeDefined();
    expect(battleSpeed1xBtn).toBeDefined();
    expect(battleSpeed2xBtn).toBeDefined();
    expect(battleSpeed3xBtn).toBeDefined();

    expect(battleSpeedHeaderBtn?.innerText).toContain('1x');

    // Click 2x segmented button
    battleSpeed2xBtn?.click();
    expect(onSetBattleSpeed).toHaveBeenCalledWith(2);

    // Click header cycle button
    battleSpeedHeaderBtn?.click();
    expect(onCycleBattleSpeed).toHaveBeenCalled();

    // Verify Text Speed controls
    const textSpeedHeaderBtn = settingsModal?.querySelector('#settings-text-speed-btn');
    const textSlowBtn = settingsModal?.querySelector('#settings-text-slow-btn');
    const textMidBtn = settingsModal?.querySelector('#settings-text-mid-btn');
    const textFastBtn = settingsModal?.querySelector('#settings-text-fast-btn');
    const textInstantBtn = settingsModal?.querySelector('#settings-text-instant-btn');

    expect(textSpeedHeaderBtn).toBeDefined();
    expect(textSlowBtn).toBeDefined();
    expect(textMidBtn).toBeDefined();
    expect(textFastBtn).toBeDefined();
    expect(textInstantBtn).toBeDefined();

    expect(textSpeedHeaderBtn?.innerText).toContain('NORMAL');

    // Click INSTANT segmented button
    textInstantBtn?.click();
    expect(onSetTextSpeed).toHaveBeenCalledWith('INSTANT');

    // Click header cycle button
    textSpeedHeaderBtn?.click();
    expect(onCycleTextSpeed).toHaveBeenCalled();
  });
});

