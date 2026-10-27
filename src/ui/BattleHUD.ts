/**
 * @fileoverview HTML5/CSS vector battle HUD managing action menus, move selection, target dock, and bag overlay.
 * @module ui/BattleHUD
 * @role Battle HUD Interface Controller
 * @exports BattleHUD
 * @layer ui
 * @sections L1-7: Micro-Header & Types | L8-359: Core Implementation | L360-718: Public Interface & Exports
 */

import type { PokemonInstance, SpeedMultiplier, PokeballId, StatId, MoveData } from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';
import { BattleLogUI } from './BattleLogUI';
import type { StadiumRuleSet } from '../battle/BattleStateMachine';
import {
  STATUS_COLORS,
  BATTLE_ITEM_CATALOG,
  injectKeyframeStyles,
  getGenderOrLegendBadge,
  getMoveEffectDescription,
  createBattleHUDTemplateHtml,
  renderPartyDockHtml,
  renderStatusBadgesHtml,
  type BattleBagTab,
  type BattleUsableItemMeta,
} from './battle/BattleItemCatalogAndStyles';
import {
  BattleBagAndPartySubModal,
  type BattleHUDCallbacks,
  type BagAndPartyUIContext,
} from './battle/BattleBagAndPartySubModal';
import {
  BattleMoveMenuAndForgetModal,
  type BattleMoveMenuContext,
} from './battle/BattleMoveMenuAndForgetModal';

// Re-export types and catalog for 100% backward compatibility
export type { BattleHUDCallbacks, BattleUsableItemMeta, BattleBagTab };
export { BATTLE_ITEM_CATALOG };

export class BattleHUD {
  private container: HTMLElement;
  private rootElement!: HTMLDivElement;
  private messageBox!: HTMLDivElement;
  private actionMenu!: HTMLDivElement;
  private fightMenu!: HTMLDivElement;
  private bagMenu!: HTMLDivElement;
  private partyMenu!: HTMLDivElement;
  private playerHpBar!: HTMLDivElement;
  private enemyHpBar!: HTMLDivElement;
  private playerExpBar!: HTMLDivElement;
  private playerHpText!: HTMLSpanElement;
  private enemyHpText!: HTMLSpanElement;
  private playerPartyDock!: HTMLDivElement;
  private speedButton!: HTMLButtonElement;
  public battleLogUI!: BattleLogUI;

  private playerPokemon!: PokemonInstance;
  private enemyPokemon!: PokemonInstance;
  private playerPartner?: PokemonInstance;
  private enemyPartner?: PokemonInstance;
  private stadiumRules?: StadiumRuleSet;
  private isDoubleBattleMode: boolean = false;
  private activeCommandSlot: 0 | 1 = 0;
  private pendingSlot1MoveId: string | null = null;
  private selectedSlot1Target: 0 | 1 = 0;
  private selectedSlot2Target: 0 | 1 = 1;

  private callbacks?: BattleHUDCallbacks;
  private activeBagTab: BattleBagTab = 'ALL';
  private selectedBagTargetIndex: number = 0;
  private playerParty: PokemonInstance[] = [];
  private caughtSpeciesIds: Set<string> = new Set();
  private ballsInventory: Partial<Record<PokeballId, number>> = {};
  private itemsInventory: Partial<Record<string, number>> = {};
  private berriesInventory: Partial<Record<string, number>> = {};

  public static readonly DIALOGUE_CHAR_DELAY_MS = 10;
  public static readonly DIALOGUE_POST_DELAY_MS = 380;

  private textSpeed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT' = 'MID';
  private speedMultiplier: SpeedMultiplier = 1;
  private isForcedPartySwitch: boolean = false;

  public setTextSpeed(speed: 'SLOW' | 'MID' | 'FAST' | 'INSTANT'): void {
    this.textSpeed = speed;
  }

  public getTextSpeed(): 'SLOW' | 'MID' | 'FAST' | 'INSTANT' {
    return this.textSpeed;
  }

  public getEffectiveCharDelayMs(): number {
    if (this.textSpeed === 'INSTANT') return 0;
    const baseMs =
      this.textSpeed === 'SLOW'
        ? 18
        : this.textSpeed === 'FAST'
          ? 5
          : BattleHUD.DIALOGUE_CHAR_DELAY_MS;
    return Math.max(2, Math.round(baseMs / this.speedMultiplier));
  }

  public getEffectivePostDelayMs(): number {
    return Math.max(80, Math.round(BattleHUD.DIALOGUE_POST_DELAY_MS / this.speedMultiplier));
  }

  constructor(containerId: string = 'battle-hud-container') {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`HUD Container #${containerId} not found in DOM`);
    }
    this.container = el;
    injectKeyframeStyles();
    this.createUI();
    this.updateSpeedDisplay(this.speedMultiplier);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.updateSpeedDisplay(this.speedMultiplier);
      });
    }
    this.setupKeyboardShortcuts();
  }

  private createUI(): void {
    const root = document.createElement('div');
    root.id = 'battle-hud-root';
    root.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      justify-content: space-between;
      pointer-events: none;
      padding: max(12px, env(safe-area-inset-top, 12px)) max(12px, env(safe-area-inset-right, 12px)) max(12px, env(safe-area-inset-bottom, 12px)) max(12px, env(safe-area-inset-left, 12px));
      box-sizing: border-box;
    `;

    root.innerHTML = createBattleHUDTemplateHtml();

    this.container.appendChild(root);
    this.rootElement = root;

    this.messageBox = root.querySelector('#battle-message-box') as HTMLDivElement;
    this.actionMenu = root.querySelector('#battle-action-menu') as HTMLDivElement;
    this.fightMenu = root.querySelector('#battle-fight-menu') as HTMLDivElement;
    this.bagMenu = root.querySelector('#battle-bag-menu') as HTMLDivElement;
    this.partyMenu = root.querySelector('#battle-party-menu') as HTMLDivElement;
    this.playerHpBar = root.querySelector('#player-hp-bar') as HTMLDivElement;
    this.enemyHpBar = root.querySelector('#enemy-hp-bar') as HTMLDivElement;
    this.playerExpBar = root.querySelector('#player-exp-bar') as HTMLDivElement;
    this.playerHpText = root.querySelector('#player-hp-text') as HTMLSpanElement;
    this.enemyHpText = root.querySelector('#enemy-hp-text') as HTMLSpanElement;
    this.playerPartyDock = root.querySelector('#player-party-dock') as HTMLDivElement;
    this.speedButton = root.querySelector('#battle-speed-btn') as HTMLButtonElement;

    this.speedButton.addEventListener('click', () => {
      this.triggerSpeedToggle();
    });

    root.querySelector('#btn-fight')!.addEventListener('click', () => {
      this.showFightMenu();
    });

    root.querySelector('#btn-run')!.addEventListener('click', () => {
      if (this.callbacks?.onRunSelected) {
        this.callbacks.onRunSelected();
      }
    });

    root.querySelector('#btn-bag')!.addEventListener('click', () => {
      this.showBagMenu();
    });

    root.querySelector('#btn-pokemon')!.addEventListener('click', () => {
      this.showPartyMenu();
    });

    const topRightControls = (root.querySelector('#battle-top-right-controls') as HTMLElement) || root;
    this.battleLogUI = new BattleLogUI(topRightControls);
    this.battleLogUI.hideRoot();
  }

  private setupKeyboardShortcuts(): void {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.rootElement?.style.display !== 'flex' || e.repeat) return;

      if (e.code === 'KeyL') {
        e.preventDefault();
        this.battleLogUI?.toggle();
        return;
      }

      const isActionMenuOpen = this.actionMenu?.style.display === 'grid';
      const isFightMenuOpen = this.fightMenu?.style.display === 'grid';
      const isBagMenuOpen = this.bagMenu?.style.display === 'grid';
      const isPartyMenuOpen = this.partyMenu?.style.display === 'grid';

      if (isActionMenuOpen) {
        if (e.code === 'KeyF' || e.code === 'Digit1') {
          e.preventDefault();
          this.showFightMenu();
          return;
        }
        if (e.code === 'KeyB' || e.code === 'Digit2') {
          e.preventDefault();
          this.showBagMenu();
          return;
        }
        if (e.code === 'KeyP' || e.code === 'Digit3') {
          e.preventDefault();
          this.showPartyMenu();
          return;
        }
        if (e.code === 'KeyR' || e.code === 'Digit4') {
          e.preventDefault();
          this.callbacks?.onRunSelected?.();
          return;
        }
      }

      if (isFightMenuOpen) {
        let moveIdx = -1;
        if (e.code === 'Digit1' || e.code === 'KeyQ') moveIdx = 0;
        else if (e.code === 'Digit2' || e.code === 'KeyW') moveIdx = 1;
        else if (e.code === 'Digit3' || e.code === 'KeyA') moveIdx = 2;
        else if (e.code === 'Digit4' || e.code === 'KeyS') moveIdx = 3;
        else if (e.code === 'Escape' || e.code === 'KeyX') {
          e.preventDefault();
          this.showActionMenu();
          return;
        }

        if (moveIdx >= 0 && this.playerPokemon?.moves[moveIdx]) {
          e.preventDefault();
          this.selectMoveSlot(moveIdx);
        }
        return;
      }

      if (
        (isBagMenuOpen || (isPartyMenuOpen && !this.isForcedPartySwitch)) &&
        (e.code === 'Escape' || e.code === 'KeyX')
      ) {
        e.preventDefault();
        this.showActionMenu();
      }
    });
  }

  private getOrderingCombatant(): PokemonInstance {
    if (
      this.isDoubleBattleMode &&
      this.activeCommandSlot === 1 &&
      this.playerPartner &&
      this.playerPartner.currentHp > 0
    ) {
      return this.playerPartner;
    }
    return this.playerPokemon;
  }

  private selectMoveSlot(index: number): void {
    BattleMoveMenuAndForgetModal.selectMoveSlot(this.getMoveMenuContext(), index);
  }

  public setDoubleBattlePeers(
    playerPartner?: PokemonInstance,
    enemyPartner?: PokemonInstance,
    stadiumRules?: StadiumRuleSet
  ): void {
    this.playerPartner = playerPartner;
    this.enemyPartner = enemyPartner;
    this.stadiumRules = stadiumRules;
    this.isDoubleBattleMode = Boolean(
      playerPartner || enemyPartner || stadiumRules?.isDoubleBattle
    );
    this.activeCommandSlot = 0;
    this.pendingSlot1MoveId = null;

    const playerPartnerCard = this.rootElement.querySelector(
      '#player-partner-card'
    ) as HTMLElement | null;
    if (playerPartnerCard) {
      if (playerPartner) {
        playerPartnerCard.style.display = 'block';
        const pName = this.rootElement.querySelector('#player-partner-name') as HTMLElement | null;
        const pLvl = this.rootElement.querySelector('#player-partner-level') as HTMLElement | null;
        if (pName) pName.innerText = playerPartner.nickname;
        if (pLvl) pLvl.innerText = `Lv. ${playerPartner.level}`;
        this.updatePartnerHp(true, playerPartner.currentHp, playerPartner.stats.hp);
      } else {
        playerPartnerCard.style.display = 'none';
      }
    }

    const enemyPartnerCard = this.rootElement.querySelector(
      '#enemy-partner-card'
    ) as HTMLElement | null;
    if (enemyPartnerCard) {
      if (enemyPartner) {
        enemyPartnerCard.style.display = 'block';
        const eName = this.rootElement.querySelector('#enemy-partner-name') as HTMLElement | null;
        const eLvl = this.rootElement.querySelector('#enemy-partner-level') as HTMLElement | null;
        if (eName) eName.innerText = enemyPartner.nickname;
        if (eLvl) eLvl.innerText = `Lv. ${enemyPartner.level}`;
        this.updatePartnerHp(false, enemyPartner.currentHp, enemyPartner.stats.hp);
      } else {
        enemyPartnerCard.style.display = 'none';
      }
    }

    const stadiumBadge = this.rootElement.querySelector(
      '#battle-stadium-badge'
    ) as HTMLElement | null;
    if (stadiumBadge) {
      if (stadiumRules || this.isDoubleBattleMode) {
        stadiumBadge.style.display = 'block';
        const weatherTag =
          stadiumRules?.weather && stadiumRules.weather !== 'NONE'
            ? ` · ${stadiumRules.weather === 'SUN' ? '☀️ SUN' : stadiumRules.weather === 'RAIN' ? '🌧️ RAIN' : '🌪️ SAND'}`
            : '';
        const modeTag = this.isDoubleBattleMode ? '2v2 DOUBLES' : '1v1 STADIUM';
        stadiumBadge.innerText = `${stadiumRules?.cupName || modeTag}${weatherTag}`;
      } else {
        stadiumBadge.style.display = 'none';
      }
    }

    this.updateStatusBadges();
  }

  public updatePartnerHp(isPlayerSide: boolean, currentHp: number, maxHp: number): void {
    const barId = isPlayerSide ? '#player-partner-hp-bar' : '#enemy-partner-hp-bar';
    const textId = isPlayerSide ? '#player-partner-hp-text' : '#enemy-partner-hp-text';
    const bar = this.rootElement.querySelector(barId) as HTMLElement | null;
    const text = this.rootElement.querySelector(textId) as HTMLElement | null;
    if (!bar || !text) return;
    const pct = Math.max(0, Math.min(100, (currentHp / Math.max(1, maxHp)) * 100));
    const drainSec = (0.3 / this.speedMultiplier).toFixed(2);
    bar.style.transition = `width ${drainSec}s ease`;
    bar.style.width = `${pct}%`;
    text.innerText = `${currentHp} / ${maxHp} HP`;
    bar.style.background = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444';
    this.updateStatusBadges();
  }

  public updateHpByUid(targetUid: string, currentHp: number, maxHp?: number): void {
    if (this.playerPokemon && targetUid === this.playerPokemon.uid) {
      this.updateHp(true, currentHp, maxHp ?? this.playerPokemon.stats.hp);
    } else if (this.enemyPokemon && targetUid === this.enemyPokemon.uid) {
      this.updateHp(false, currentHp, maxHp ?? this.enemyPokemon.stats.hp);
    } else if (this.playerPartner && targetUid === this.playerPartner.uid) {
      this.updatePartnerHp(true, currentHp, maxHp ?? this.playerPartner.stats.hp);
    } else if (this.enemyPartner && targetUid === this.enemyPartner.uid) {
      this.updatePartnerHp(false, currentHp, maxHp ?? this.enemyPartner.stats.hp);
    }
  }

  public triggerSpeedToggle(): void {
    if (this.callbacks?.onSpeedToggle) {
      const nextSpeed = this.callbacks.onSpeedToggle();
      this.updateSpeedDisplay(nextSpeed);
    }
  }

  public setInventory(
    ballsInventory: Partial<Record<PokeballId, number>> = {},
    itemsInventory: Partial<Record<string, number>> = {},
    berriesInventory: Partial<Record<string, number>> = {}
  ): void {
    this.ballsInventory = ballsInventory;
    this.itemsInventory = itemsInventory;
    this.berriesInventory = berriesInventory;
  }

  public initBattle(
    playerPokemon: PokemonInstance,
    enemyPokemon: PokemonInstance,
    callbacks: BattleHUDCallbacks,
    ballsInventory: Partial<Record<PokeballId, number>> = {},
    playerParty: PokemonInstance[] = [],
    caughtSpeciesIds: Set<string> = new Set(),
    itemsInventory: Partial<Record<string, number>> = {},
    berriesInventory: Partial<Record<string, number>> = {}
  ): void {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.callbacks = callbacks;
    this.ballsInventory = ballsInventory;
    this.itemsInventory = itemsInventory;
    this.berriesInventory = berriesInventory;
    this.playerParty = playerParty.length > 0 ? playerParty : [playerPokemon];
    this.selectedBagTargetIndex = Math.max(0, this.playerParty.findIndex((p) => p.uid === playerPokemon.uid));
    this.caughtSpeciesIds = caughtSpeciesIds;
    this.rootElement.style.display = 'flex';
    if (this.battleLogUI) {
      this.battleLogUI.showRoot();
    }

    // Populate Player Card
    this.setActivePlayerPokemon(playerPokemon);

    // Populate Enemy Card
    (this.rootElement.querySelector('#enemy-name') as HTMLElement).innerText = enemyPokemon.nickname;
    (this.rootElement.querySelector('#enemy-gender') as HTMLElement).innerHTML = getGenderOrLegendBadge(
      enemyPokemon.speciesId
    );
    (this.rootElement.querySelector('#enemy-level') as HTMLElement).innerText = `Lv. ${enemyPokemon.level}`;
    const caughtIcon = this.rootElement.querySelector('#enemy-caught-icon') as HTMLElement;
    if (caughtIcon) {
      caughtIcon.style.display = this.caughtSpeciesIds.has(enemyPokemon.speciesId) ? 'inline' : 'none';
    }
    this.updateHp(false, enemyPokemon.currentHp, enemyPokemon.stats.hp);
    this.updatePartyDock();

    this.showActionMenu();
    this.messageBox.innerText = `What will ${playerPokemon.nickname} do?`;
  }

  public setActivePlayerPokemon(playerPokemon: PokemonInstance): void {
    this.playerPokemon = playerPokemon;
    (this.rootElement.querySelector('#player-name') as HTMLElement).innerText = playerPokemon.nickname;
    (this.rootElement.querySelector('#player-gender') as HTMLElement).innerHTML = getGenderOrLegendBadge(
      playerPokemon.speciesId
    );
    (this.rootElement.querySelector('#player-level') as HTMLElement).innerText = `Lv. ${playerPokemon.level}`;
    this.updateHp(true, playerPokemon.currentHp, playerPokemon.stats.hp);
    this.updateExp(playerPokemon);
    this.updateStatusBadges();
    this.updatePartyDock();
  }

  public slideInHealthCard(isPlayer: boolean): void {
    const cardSelector = isPlayer ? '#player-card' : '#enemy-card';
    const card = this.rootElement.querySelector(cardSelector) as HTMLElement | null;
    if (!card) return;

    const startOffset = isPlayer ? '100%' : '-100%';
    const durSec = (0.28 / this.speedMultiplier).toFixed(2);
    card.style.transition = 'none';
    card.style.transform = `translateX(${startOffset})`;
    card.style.opacity = '0';

    requestAnimationFrame(() => {
      card.style.transition = `transform ${durSec}s cubic-bezier(0.22, 1, 0.36, 1), opacity ${durSec}s ease-out`;
      card.style.transform = 'translateX(0)';
      card.style.opacity = '1';
    });
  }

  public updatePartyDock(): void {
    if (!this.playerPartyDock) return;
    this.playerPartyDock.innerHTML = renderPartyDockHtml(this.playerParty);
  }

  public updateExp(pokemon: PokemonInstance = this.playerPokemon): void {
    if (!this.playerExpBar || !pokemon) return;
    const baseExp = pokemon.level * pokemon.level * pokemon.level;
    const nextExp = pokemon.nextLevelExp ?? (pokemon.level + 1) * (pokemon.level + 1) * (pokemon.level + 1);
    const currentExp = pokemon.exp ?? baseExp;
    const span = Math.max(1, nextExp - baseExp);
    const pct = Math.max(0, Math.min(100, ((currentExp - baseExp) / span) * 100));

    const drainSec = (0.35 / this.speedMultiplier).toFixed(2);
    this.playerExpBar.style.transition = `width ${drainSec}s ease`;
    this.playerExpBar.style.width = `${pct}%`;
    (this.rootElement.querySelector('#player-level') as HTMLElement).innerText = `Lv. ${pokemon.level}`;
  }

  public static getMoveEffectDescription(moveData: MoveData): string {
    return getMoveEffectDescription(moveData);
  }

  public getMoveEffectDescription(moveData: MoveData): string {
    return BattleHUD.getMoveEffectDescription(moveData);
  }

  public updateStatusBadges(): void {
    const renderBadges = (pkmn: PokemonInstance, containerId: string) => {
      const el = this.rootElement.querySelector(containerId) as HTMLElement;
      if (el && pkmn) {
        el.innerHTML = renderStatusBadgesHtml(pkmn);
      }
    };

    renderBadges(this.playerPokemon, '#player-status-badges');
    renderBadges(this.enemyPokemon, '#enemy-status-badges');
    if (this.playerPartner) {
      renderBadges(this.playerPartner, '#player-partner-status-badges');
    }
    if (this.enemyPartner) {
      renderBadges(this.enemyPartner, '#enemy-partner-status-badges');
    }
    this.updatePartyDock();
  }

  public getSpeedMultiplier(): SpeedMultiplier {
    return this.speedMultiplier;
  }

  public setSpeedMultiplier(speed: SpeedMultiplier): void {
    this.updateSpeedDisplay(speed);
  }

  public updateSpeedDisplay(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
    if (this.speedButton) {
      const isMobileOrTouch =
        typeof window !== 'undefined' &&
        (window.innerWidth <= 768 ||
          'ontouchstart' in window ||
          (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
          (typeof document !== 'undefined' && document.body?.classList?.contains('touch-controls-active')));
      this.speedButton.innerHTML = isMobileOrTouch
        ? `<span>⚡ SPEED: ${speed}x</span>`
        : `<span>⚡ SPEED: ${speed}x</span> <span class="keyboard-hint">(Shift)</span>`;
      if (speed === 1) {
        this.speedButton.style.background = '#2563eb';
        this.speedButton.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.4)';
      } else if (speed === 2) {
        this.speedButton.style.background = '#d97706';
        this.speedButton.style.boxShadow = '0 2px 8px rgba(217, 119, 6, 0.4)';
      } else if (speed === 3) {
        this.speedButton.style.background = '#dc2626';
        this.speedButton.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.4)';
      } else {
        this.speedButton.style.background = 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)';
        this.speedButton.style.boxShadow = '0 0 16px rgba(236, 72, 153, 0.65)';
      }
    }
  }

  public updateHp(isPlayer: boolean, currentHp: number, maxHp: number): void {
    const bar = isPlayer ? this.playerHpBar : this.enemyHpBar;
    const text = isPlayer ? this.playerHpText : this.enemyHpText;
    const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

    const drainSec = (0.3 / this.speedMultiplier).toFixed(2);
    bar.style.transition = `width ${drainSec}s ease`;
    bar.style.width = `${pct}%`;
    text.innerText = `${currentHp} / ${maxHp} HP`;

    if (pct > 50) {
      bar.style.background = '#22c55e';
      bar.classList.remove('crystal-low-hp');
    } else if (pct > 20) {
      bar.style.background = '#eab308';
      bar.classList.remove('crystal-low-hp');
    } else {
      bar.style.background = '#ef4444';
      if (currentHp > 0) {
        bar.classList.add('crystal-low-hp');
      } else {
        bar.classList.remove('crystal-low-hp');
      }
    }

    if (isPlayer) {
      BattleAudio.updateLowHpState(currentHp, maxHp);
    }

    this.updateStatusBadges();
  }

  private getMoveMenuContext(): BattleMoveMenuContext {
    const h = this;
    return {
      fightMenu: this.fightMenu, messageBox: this.messageBox, actionMenu: this.actionMenu,
      bagMenu: this.bagMenu, partyMenu: this.partyMenu, modalContainer: this.container,
      get isDoubleBattleMode() { return h.isDoubleBattleMode; },
      get activeCommandSlot() { return h.activeCommandSlot; },
      setActiveCommandSlot: (s) => { h.activeCommandSlot = s; },
      get pendingSlot1MoveId() { return h.pendingSlot1MoveId; },
      setPendingSlot1MoveId: (id) => { h.pendingSlot1MoveId = id; },
      get selectedSlot1Target() { return h.selectedSlot1Target; },
      setSelectedSlot1Target: (t) => { h.selectedSlot1Target = t; },
      get selectedSlot2Target() { return h.selectedSlot2Target; },
      setSelectedSlot2Target: (t) => { h.selectedSlot2Target = t; },
      get playerPokemon() { return h.playerPokemon; },
      get playerPartner() { return h.playerPartner; },
      get enemyPokemon() { return h.enemyPokemon; },
      get enemyPartner() { return h.enemyPartner; },
      getOrderingCombatant: () => h.getOrderingCombatant(),
      get callbacks() { return h.callbacks; },
      showActionMenu: () => h.showActionMenu(),
      showFightMenu: () => h.showFightMenu(),
    };
  }

  private getBagAndPartyContext(): BagAndPartyUIContext {
    const h = this;
    return {
      messageBox: this.messageBox, actionMenu: this.actionMenu, fightMenu: this.fightMenu,
      bagMenu: this.bagMenu, partyMenu: this.partyMenu,
      get playerParty() { return h.playerParty; },
      get playerPokemon() { return h.playerPokemon; },
      get activeBagTab() { return h.activeBagTab; },
      setActiveBagTab: (t) => { h.activeBagTab = t; },
      get selectedBagTargetIndex() { return h.selectedBagTargetIndex; },
      setSelectedBagTargetIndex: (idx) => { h.selectedBagTargetIndex = idx; },
      get itemsInventory() { return h.itemsInventory as Record<string, number>; },
      get berriesInventory() { return h.berriesInventory as Record<string, number>; },
      get ballsInventory() { return h.ballsInventory; },
      get callbacks() { return h.callbacks; },
      showMessage: (text) => h.showMessage(text),
      showActionMenu: () => h.showActionMenu(),
      get isForcedPartySwitch() { return h.isForcedPartySwitch; },
      setIsForcedPartySwitch: (v) => { h.isForcedPartySwitch = v; },
    };
  }

  public showFightMenu(): void {
    BattleMoveMenuAndForgetModal.showFightMenu(this.getMoveMenuContext());
  }

  public showActionMenu(): void {
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.actionMenu.style.display = 'grid';
    this.messageBox.innerText = `What will ${this.playerPokemon.nickname} do?`;
    if (this.isMobileViewport()) {
      this.messageBox.style.display = 'none';
      this.messageBox.className = '';
      this.actionMenu.style.width = '100%';
    } else {
      this.messageBox.style.display = 'flex';
      this.messageBox.className = '';
      this.actionMenu.style.width = '';
    }
    this.updateStatusBadges();
  }

  public showPartyMenu(options?: { forcedSwitch?: boolean; onSelected?: (pokemon: PokemonInstance) => void }): void {
    BattleBagAndPartySubModal.showPartyMenu(this.getBagAndPartyContext(), options);
  }

  public getOwnedMedicineCount(itemId: string): number {
    return BattleBagAndPartySubModal.getOwnedMedicineCount(
      this.itemsInventory as Record<string, number>,
      this.berriesInventory as Record<string, number>,
      itemId
    );
  }

  public showBagMenu(tab?: BattleBagTab): void {
    BattleBagAndPartySubModal.showBagMenu(this.getBagAndPartyContext(), tab);
  }

  public async showMessage(text: string): Promise<void> {
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.actionMenu.style.display = 'none';
    this.messageBox.style.display = 'flex';
    this.messageBox.className = 'full-width-dialogue';
    this.messageBox.style.width = '100%';
    this.updateStatusBadges();

    if (this.battleLogUI && text) {
      if (text.startsWith('--- TURN')) {
        const turnMatch = text.match(/TURN\s+(\d+)/i);
        const turnNum = turnMatch ? parseInt(turnMatch[1], 10) : undefined;
        if (turnNum !== undefined) {
          this.battleLogUI.startTurn(turnNum);
        }
      } else if (text.includes('used ') || text.includes('uses ')) {
        this.battleLogUI.addEntry('move', text);
      } else if (text.includes('effective') || text.includes('critical hit') || text.includes('damage') || text.includes('lost ')) {
        this.battleLogUI.addEntry('damage', text);
      } else if (text.includes('paralyzed') || text.includes('poisoned') || text.includes('burned') || text.includes('asleep') || text.includes('frozen') || text.includes('confused')) {
        this.battleLogUI.addEntry('status', text);
      } else if (text.includes('rose!') || text.includes('fell!')) {
        this.battleLogUI.addEntry('stat', text);
      } else if (text.includes('fainted!')) {
        this.battleLogUI.addEntry('faint', text);
      } else {
        this.battleLogUI.addEntry('info', text);
      }
    }

    const charDelay = this.getEffectiveCharDelayMs();
    const postDelay = this.getEffectivePostDelayMs();

    if (charDelay <= 0) {
      this.messageBox.innerText = text;
    } else {
      this.messageBox.innerText = '';
      for (let i = 1; i <= text.length; i++) {
        this.messageBox.innerText = text.slice(0, i);
        await new Promise((r) => setTimeout(r, charDelay));
      }
    }

    return new Promise((resolve) => setTimeout(resolve, postDelay));
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  public promptMoveForget(pokemon: PokemonInstance, newMove: MoveData): Promise<number | null> {
    return BattleMoveMenuAndForgetModal.promptMoveForget(this.container, this.messageBox, pokemon, newMove);
  }

  public hide(): void {
    BattleAudio.stopLowHpAlarm();
    this.rootElement.style.display = 'none';
    if (this.battleLogUI) {
      this.battleLogUI.clear();
      this.battleLogUI.hideRoot();
    }
  }
}
