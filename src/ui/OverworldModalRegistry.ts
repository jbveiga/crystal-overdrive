/**
 * @fileoverview OverworldModalRegistry domain module implementation.
 * @module ui/OverworldModalRegistry
 * @role OverworldModalRegistry Component
 * @exports OverworldModalRegistryParams, OverworldModalRegistry
 * @layer ui
 * @sections L1-15: Micro-Header & Imports | L16-260: Implementation | L261-520: Handlers & Exports
 */

import { BoxManagementUI } from './BoxManagementUI';
import { TownMapUI } from './TownMapUI';
import { RuinsPuzzleModalUI } from './RuinsPuzzleModalUI';
import { DayCareModalUI } from './DayCareModalUI';
import { DeptStoreElevatorUI } from './DeptStoreElevatorUI';
import { RadioTowerQuizUI } from './RadioTowerQuizUI';
import { BugContestSpecimenSwapModal } from './BugContestSpecimenSwapModal';
import { StartMenuUI } from './StartMenuUI';
import { mountGitHubReportButton } from './BugReportModal';
import { DayCareManager } from '../world/DayCareManager';
import { KurtCraftingModalUI } from './KurtCraftingModalUI';
import { BattleAudio } from '../audio/BattleAudio';
import { ModernHMHandler } from '../world/ModernHMHandler';
import type {
  SpeedMultiplier,
  ExpShareMode,
  EncounterRateMode,
  GbcPaletteMode,
} from '../types/game';

export interface OverworldModalRegistryParams {
  containerId?: string;
  dayCareManager: any;
  bugContestManager: any;
  stadiumArenaManager: any;
  audioManager: any;
  gameClock: any;
  gameOptions: any;
  displayThemeManager: any;
  mapManager: any;
  missionManager: any;
  roamingManager: any;
  kurtCraftingManager?: any;
  overworldItemManager?: any;
  inventory: any;
  playerParty: any[];
  storyFlags: Set<string>;
  visitedMaps: Set<string>;
  seenSpecies: Set<string>;
  playerName: string;
  getPlayerName?: () => string;
  initialMapId: string;
  getCaughtSpeciesSet: () => Set<string>;
  getPlayTimeSeconds: () => number;
  getOverworldHUD: () => any;
  getPartyUI: () => any;
  getBagUI: () => any;
  getMissionLogUI: () => any;
  getNamingModalUI: () => any;
  saveCurrentGame: () => Promise<void> | void;
  launchStadiumChallenge: (challengerId: string, cupId: string) => void;
  cyclePlayerSpeed: () => SpeedMultiplier;
  cycleBattleSpeed: () => SpeedMultiplier;
  setBattleSpeed: (spd: SpeedMultiplier) => void;
  cycleTextSpeed: () => 'SLOW' | 'MID' | 'FAST' | 'INSTANT';
  setTextSpeed: (spd: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => void;
}

export class OverworldModalRegistry {
  private _boxManagementUI: BoxManagementUI | null = null;
  private _townMapUI: TownMapUI | null = null;
  private _ruinsPuzzleModalUI: RuinsPuzzleModalUI | null = null;
  private _dayCareModalUI: DayCareModalUI | null = null;
  private _deptStoreElevatorUI: DeptStoreElevatorUI | null = null;
  private _radioTowerQuizUI: RadioTowerQuizUI | null = null;
  public startMenuUI!: StartMenuUI;

  public readonly boxManagementUI = {
    isOpen: () => this._boxManagementUI?.isOpen() ?? false,
    open: (...args: Parameters<BoxManagementUI['open']>) => this.getBoxManagementUI().open(...args),
    close: () => this._boxManagementUI?.close(),
  };

  public readonly townMapUI = {
    isOpen: () => this._townMapUI?.isOpen() ?? false,
    open: (...args: Parameters<TownMapUI['open']>) => this.getTownMapUI().open(...args),
    close: () => this._townMapUI?.close(),
    handleKeyDown: (e: KeyboardEvent) => this._townMapUI?.handleKeyDown(e) ?? false,
  };

  public readonly ruinsPuzzleModalUI = {
    isOpen: () => this._ruinsPuzzleModalUI?.isOpen() ?? false,
    open: (...args: Parameters<RuinsPuzzleModalUI['open']>) => this.getRuinsPuzzleModalUI().open(...args),
    close: () => this._ruinsPuzzleModalUI?.close(),
  };

  public readonly dayCareModalUI = {
    isOpen: () => this._dayCareModalUI?.isOpen() ?? false,
    open: (...args: Parameters<DayCareModalUI['open']>) => this.getDayCareModalUI().open(...args),
    close: () => this._dayCareModalUI?.close(),
  };

  public readonly deptStoreElevatorUI = {
    isOpen: () => this._deptStoreElevatorUI?.isOpen() ?? false,
    open: (...args: Parameters<DeptStoreElevatorUI['open']>) => this.getDeptStoreElevatorUI().open(...args),
    close: () => this._deptStoreElevatorUI?.close(),
  };

  public readonly radioTowerQuizUI = {
    isOpen: () => this._radioTowerQuizUI?.isOpen() ?? false,
    open: (...args: Parameters<RadioTowerQuizUI['open']>) => this.getRadioTowerQuizUI().open(...args),
    close: () => this._radioTowerQuizUI?.close(),
  };

  constructor(private params: OverworldModalRegistryParams) {
    this.initStartMenu();
  }

  public getBoxManagementUI(): BoxManagementUI {
    if (!this._boxManagementUI) {
      this._boxManagementUI = new BoxManagementUI(this.params.containerId || 'modal-container');
    }
    return this._boxManagementUI;
  }

  public getTownMapUI(): TownMapUI {
    if (!this._townMapUI) {
      this._townMapUI = new TownMapUI({ containerId: this.params.containerId || 'modal-container' });
    }
    return this._townMapUI;
  }

  public getRuinsPuzzleModalUI(): RuinsPuzzleModalUI {
    if (!this._ruinsPuzzleModalUI) {
      this._ruinsPuzzleModalUI = new RuinsPuzzleModalUI(this.params.containerId || 'modal-container');
    }
    return this._ruinsPuzzleModalUI;
  }

  public getDayCareModalUI(): DayCareModalUI {
    if (!this._dayCareModalUI) {
      this._dayCareModalUI = new DayCareModalUI(this.params.dayCareManager, this.params.containerId || 'modal-container');
    }
    return this._dayCareModalUI;
  }

  public getDeptStoreElevatorUI(): DeptStoreElevatorUI {
    if (!this._deptStoreElevatorUI) {
      this._deptStoreElevatorUI = new DeptStoreElevatorUI(this.params.containerId || 'modal-container');
    }
    return this._deptStoreElevatorUI;
  }

  public getRadioTowerQuizUI(): RadioTowerQuizUI {
    if (!this._radioTowerQuizUI) {
      this._radioTowerQuizUI = new RadioTowerQuizUI(this.params.containerId || 'modal-container');
    }
    return this._radioTowerQuizUI;
  }

  public promptBugContestSpecimenSwap(newCatch: any, bugContestHUD: any): void {
    const { bugContestManager, containerId } = this.params;
    const catchResult = bugContestManager.recordCatch(newCatch);
    if (catchResult.promptSwap && bugContestManager.state.bestCaughtPokemon) {
      new BugContestSpecimenSwapModal(containerId || 'modal-container', {
        currentSpecimen: bugContestManager.state.bestCaughtPokemon,
        newCatch,
        ballsRemaining: bugContestManager.state.ballsRemaining,
        timeRemainingSec: bugContestManager.state.timeRemainingSec,
        onDecision: (choice) => {
          if (choice === 'replace') bugContestManager.swapSpecimen(newCatch);
          else bugContestManager.keepCurrentSpecimen();
          bugContestHUD.update(
            bugContestManager.state.ballsRemaining,
            bugContestManager.state.timeRemainingSec,
            bugContestManager.state.bestCaughtPokemon
          );
        },
      });
    } else {
      bugContestHUD.update(
        bugContestManager.state.ballsRemaining,
        bugContestManager.state.timeRemainingSec,
        bugContestManager.state.bestCaughtPokemon
      );
    }
  }

  public isAnyModalOpen(getGameState: () => string): boolean {
    const { getPartyUI, getBagUI, getMissionLogUI, getNamingModalUI } = this.params;
    const partyUI = getPartyUI();
    const bagUI = getBagUI();
    const missionLogUI = getMissionLogUI();
    const namingModalUI = getNamingModalUI();

    return (
      getGameState() === 'TITLE' ||
      this.startMenuUI.isOpen() ||
      partyUI.isOpen() ||
      bagUI.isOpen() ||
      missionLogUI.isOpen() ||
      Boolean(this._boxManagementUI?.isOpen()) ||
      Boolean(namingModalUI?.isOpen()) ||
      Boolean(this._townMapUI?.isOpen()) ||
      Boolean(this._ruinsPuzzleModalUI?.isOpen()) ||
      Boolean(this._dayCareModalUI?.isOpen()) ||
      Boolean(this._deptStoreElevatorUI?.isOpen()) ||
      Boolean(this._radioTowerQuizUI?.isOpen())
    );
  }

  public mountReportButton(options: {
    uiOverlay: HTMLElement;
    mapManager: any;
    player: any;
    getGameState: () => string;
    inventory: any;
    playerParty: any[];
  }): void {
    mountGitHubReportButton(options);
  }

  public openDayCareModal(): void {
    const { dayCareManager, inventory, playerParty, saveCurrentGame, getOverworldHUD } = this.params;
    const overworldHUD = getOverworldHUD();
    this.dayCareModalUI.open({
      onClose: () => {},
      onDeposit: (pkmn) => {
        if (pkmn.isEgg) return false;
        if (playerParty.length <= 1) return false;
        const slotIdx = dayCareManager.deposit(pkmn);
        if (slotIdx >= 0) {
          const idx = playerParty.indexOf(pkmn);
          if (idx >= 0) playerParty.splice(idx, 1);
          saveCurrentGame();
          return true;
        }
        return false;
      },
      onWithdraw: (slotIdx) => {
        const slot = dayCareManager.getSlot(slotIdx);
        if (!slot) return null;
        const fee = DayCareManager.calculateFee(slot);
        if (inventory.money < fee || playerParty.length >= 6) return null;
        inventory.money -= fee;
        const pkmn = dayCareManager.withdraw(slotIdx);
        if (pkmn) {
          playerParty.push(pkmn);
          saveCurrentGame();
        }
        return pkmn;
      },
      onCollectEgg: () => {
        if (playerParty.length >= 6) return null;
        const egg = dayCareManager.collectEgg();
        if (egg) {
          playerParty.push(egg);
          saveCurrentGame();
          overworldHUD.showToast('🥚 Received an Egg from the Day-Care!');
        }
        return egg;
      },
      getPlayerMoney: () => inventory.money,
      getPlayerParty: () => playerParty,
    });
  }

  public openKurtCraftingModal(
    getApricornCount: (id: string) => number,
    deductApricorn: (id: string, qty: number) => void,
    callbacks: { onOrderPlaced: () => void }
  ): void {
    const { containerId, kurtCraftingManager, storyFlags, saveCurrentGame, getOverworldHUD } = this.params;
    const overworldHUD = getOverworldHUD();
    new KurtCraftingModalUI(containerId || 'modal-container', {
      getApricornCount,
      onSubmitOrder: (apricornId, quantity) => {
        deductApricorn(apricornId, quantity);
        kurtCraftingManager?.placeOrder(apricornId, quantity);
        storyFlags.add('ENGINE_KURT_MAKING_BALLS');
        callbacks.onOrderPlaced();
        BattleAudio.playOverworldSound('KEY_ITEM');
        overworldHUD.showToast(`Kurt accepted ${quantity}x Apricorn!`);
        saveCurrentGame();
        overworldHUD.openDialogue(
          [
            "KURT: Now that my granddaughter is helping me, I can work much faster.",
            "I'll get to hammering right away! Check back soon!",
          ],
          '👴 KURT'
        );
      },
      onClose: () => {},
    });
  }

  public openKyleTradeModal(callbacks: { onConfirm: () => void; onCancel: () => void }): void {
    const existingTradeModal = document.getElementById('kyle-trade-confirm-modal');
    existingTradeModal?.remove();
    const tradeModal = document.createElement('div');
    tradeModal.id = 'kyle-trade-confirm-modal';
    tradeModal.style.cssText =
      'position: fixed; inset: 0; background: rgba(2, 6, 23, 0.78); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 95; pointer-events: auto;';
    tradeModal.innerHTML =
      '<div style="width: 380px; max-width: 92vw; background: rgba(15, 23, 42, 0.98); border: 3px solid #38bdf8; border-radius: 14px; padding: 20px; color: #f8fafc; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85); display: flex; flex-direction: column; gap: 14px;"><div style="font-size: 16px; font-weight: 900; color: #38bdf8;">🔄 KYLE\'S POKéMON TRADE</div><div style="font-size: 13px; line-height: 1.5; color: #e2e8f0;">Trade your <strong>BELLSPROUT</strong> for Kyle\'s <strong>ONIX (\"ROCKY\")</strong> holding a Bitter Berry?</div><div style="display: flex; gap: 10px;"><button id="kyle-trade-yes-btn" style="flex: 1; background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 800; cursor: pointer;">YES, TRADE</button><button id="kyle-trade-no-btn" style="flex: 1; background: #334155; color: #f8fafc; border: 1px solid rgba(148, 163, 184, 0.4); border-radius: 8px; padding: 10px 12px; font-size: 13px; font-weight: 800; cursor: pointer;">NO THANKS</button></div></div>';
    document.body.appendChild(tradeModal);
    tradeModal.querySelector('#kyle-trade-yes-btn')?.addEventListener('click', () => {
      tradeModal.remove();
      callbacks.onConfirm();
    });
    tradeModal.querySelector('#kyle-trade-no-btn')?.addEventListener('click', () => {
      tradeModal.remove();
      callbacks.onCancel();
    });
  }

  private initStartMenu(): void {
    const {
      containerId,
      playerName,
      inventory,
      playerParty,
      getCaughtSpeciesSet,
      seenSpecies,
      storyFlags,
      getPlayTimeSeconds,
      mapManager,
      audioManager,
      gameClock,
      gameOptions,
      getOverworldHUD,
      displayThemeManager,
      bugContestManager,
      getPartyUI,
      getBagUI,
      getMissionLogUI,
      initialMapId,
      visitedMaps,
      roamingManager,
      missionManager,
      launchStadiumChallenge,
      saveCurrentGame,
      cyclePlayerSpeed,
      cycleBattleSpeed,
      setBattleSpeed,
      cycleTextSpeed,
      setTextSpeed,
    } = this.params;

    this.startMenuUI = new StartMenuUI(
      containerId || 'modal-container',
      {
        getTrainerName: () => (this.params.getPlayerName ? this.params.getPlayerName() : playerName),
        getMoney: () => inventory.money,
        getBadges: () => inventory.badges,
        getPartyCount: () => playerParty.length,
        getCaughtCount: () => getCaughtSpeciesSet().size,
        getCaughtSpeciesIds: () => getCaughtSpeciesSet(),
        getSeenSpeciesIds: () => {
          const set = new Set(seenSpecies);
          for (const id of getCaughtSpeciesSet()) set.add(id);
          return set;
        },
        getKeyItems: () => {
          const items = ['POKéGEAR'];
          if (storyFlags.has('HAS_MYSTERY_EGG') && !storyFlags.has('EVENT_GAVE_MYSTERY_EGG_TO_ELM')) {
            items.push('🥚 MYSTERY EGG');
          }
          if (storyFlags.has('HAS_POKEDEX')) items.push('📕 POKéDEX');
          if (storyFlags.has('has_squirtbottle')) items.push('💧 SQUIRTBOTTLE');
          if (storyFlags.has('has_secret_potion')) items.push('💊 SECRETPOTION');
          return items;
        },
        getPlayTimeSeconds: () => getPlayTimeSeconds(),
        getMapName: () => mapManager.getCurrentMap()?.name || 'New Bark Town',
        isMuted: () => audioManager.isMuted(),
        getBgmVolume: () => gameOptions.bgmVolume ?? audioManager.getBgmVolume(),
        getSoundVolume: () => gameOptions.soundVolume ?? audioManager.getSfxVolume(),
        getBattleAnimations: () => gameOptions.battleAnimations ?? true,
        getBattleStyle: () => gameOptions.battleStyle ?? 'SHIFT',
        getSpeedMultiplier: () => gameClock.playerSpeed,
        getBattleSpeedMultiplier: () => gameClock.battleSpeed,
        getTextSpeed: () => gameOptions.textSpeed ?? 'MID',
        isGamepadActive: () => getOverworldHUD()?.isGamepadActive() ?? false,
        getTouchControlStyle: () => getOverworldHUD()?.getTouchControlStyle() ?? gameOptions.touchControlStyle ?? 'DPAD',
        getExpShareMode: () => gameOptions.expShare ?? 'CAPPED',
        getEncounterRateMode: () => mapManager.getEncounterRateMode(),
        getAutoHm: () => gameOptions.autoHm ?? true,
        getCrtScanlines: () => displayThemeManager.isCrtEnabled(),
        getGbcPalette: () => displayThemeManager.getPalette(),
        getLowHpBeep: () => gameOptions.lowHpBeepEnabled ?? true,
        getChiptuneMode: () => audioManager.isChiptuneMode(),
        getBugContestLeaderboard: () => bugContestManager.getTopLeaderboard(5),
        getBugContestPersonalBest: () => bugContestManager.getPersonalBestRecord(),
      },
      {
        onOpenParty: () => {
          getBagUI().hide();
          getPartyUI().open();
        },
        onOpenBag: () => {
          getPartyUI().hide();
          getBagUI().open('ITEMS');
        },
        onOpenPokegear: () => {
          getPartyUI().hide();
          getBagUI().hide();
          getMissionLogUI().hide();
          if (!storyFlags.has('has_map_card')) {
            getOverworldHUD().showToast(
              "⚠️ Your POKéGEAR doesn't have a MAP CARD installed yet! Talk to the GUIDE GENT in CHERRYGROVE CITY."
            );
            return;
          }
          this.getTownMapUI().open(mapManager.getCurrentMap()?.id || initialMapId, visitedMaps, roamingManager.getAllRoamers());
        },
        onOpenTownMapAtLandmark: (landmarkId: string) => {
          getPartyUI().hide();
          getBagUI().hide();
          getMissionLogUI().hide();
          this.getTownMapUI().open(
            mapManager.getCurrentMap()?.id || initialMapId,
            visitedMaps,
            roamingManager.getAllRoamers(),
            landmarkId
          );
        },
        onOpenMissions: () => {
          getPartyUI().hide();
          getBagUI().hide();
          missionManager.checkStoryFlags(storyFlags);
          getMissionLogUI().open();
        },
        onLaunchStadiumBattle: (challengerId: string, cupId: string) => {
          launchStadiumChallenge(challengerId, cupId);
        },
        onSaveGame: async () => {
          await saveCurrentGame();
        },
        onToggleMute: () => {
          const muted = audioManager.toggleMute();
          gameOptions.muted = muted;
          getOverworldHUD().updateMuteDisplay(muted);
          void saveCurrentGame();
          return muted;
        },
        onSetBgmVolume: (vol: number) => {
          gameOptions.bgmVolume = vol;
          audioManager.setBgmVolume(vol);
          void saveCurrentGame();
        },
        onSetSoundVolume: (vol: number) => {
          gameOptions.soundVolume = vol;
          audioManager.setSfxVolume(vol);
          void saveCurrentGame();
        },
        onToggleBattleAnimations: (enabled: boolean) => {
          gameOptions.battleAnimations = enabled;
          void saveCurrentGame();
          return enabled;
        },
        onSetBattleStyle: (style: 'SHIFT' | 'SET') => {
          gameOptions.battleStyle = style;
          void saveCurrentGame();
          return style;
        },
        onCycleSpeed: () => {
          return cyclePlayerSpeed();
        },
        onCycleBattleSpeed: () => {
          return cycleBattleSpeed();
        },
        onSetBattleSpeed: (spd: SpeedMultiplier) => {
          return setBattleSpeed(spd);
        },
        onCycleTextSpeed: () => {
          return cycleTextSpeed();
        },
        onSetTextSpeed: (spd: 'SLOW' | 'MID' | 'FAST' | 'INSTANT') => {
          return setTextSpeed(spd);
        },
        onToggleGamepad: () => {
          const active = getOverworldHUD().toggleGamepad();
          gameOptions.gamepadActive = active;
          void saveCurrentGame();
          return active;
        },
        onToggleTouchControlStyle: () => {
          const nextStyle = getOverworldHUD().toggleTouchControlStyle();
          gameOptions.touchControlStyle = nextStyle;
          void saveCurrentGame();
          return nextStyle;
        },
        onCycleExpShareMode: () => {
          const modes: ExpShareMode[] = ['OFF', 'ALL', 'CAPPED'];
          const current = gameOptions.expShare ?? 'CAPPED';
          const next = modes[(modes.indexOf(current) + 1) % modes.length];
          gameOptions.expShare = next;
          void saveCurrentGame();
          return next;
        },
        onSetExpShareMode: (mode: ExpShareMode) => {
          gameOptions.expShare = mode;
          void saveCurrentGame();
          return mode;
        },
        onSetEncounterRateMode: (mode: EncounterRateMode) => {
          gameOptions.encounterRateMode = mode;
          mapManager.setEncounterRateMode(mode);
          void saveCurrentGame();
          return mode;
        },
        onToggleAutoHm: (enabled: boolean) => {
          gameOptions.autoHm = enabled;
          const surfCheck = ModernHMHandler.checkSurf(inventory, storyFlags, playerParty);
          mapManager.setSurfEnabled(enabled && surfCheck.canUse);
          void saveCurrentGame();
          getOverworldHUD().showToast(
            enabled ? '🌊 Auto-HM Mode: ON (Unbound Style)' : '💬 Auto-HM Mode: OFF (Classic Prompts)'
          );
          return enabled;
        },
        onToggleCrtScanlines: () => {
          const next = displayThemeManager.toggleCrtScanlines();
          gameOptions.crtScanlines = next;
          void saveCurrentGame();
          return next;
        },
        onSetGbcPalette: (palette: GbcPaletteMode) => {
          const next = displayThemeManager.setPalette(palette);
          gameOptions.gbcPalette = next;
          void saveCurrentGame();
          return next;
        },
        onToggleLowHpBeep: (enabled: boolean) => {
          gameOptions.lowHpBeepEnabled = enabled;
          BattleAudio.setLowHpBeepEnabled(enabled);
          void saveCurrentGame();
          return enabled;
        },
        onToggleChiptuneMode: (enabled: boolean) => {
          gameOptions.chiptuneMode = enabled;
          audioManager.setChiptuneMode(enabled);
          void saveCurrentGame();
          return enabled;
        },
      }
    );
  }
}
