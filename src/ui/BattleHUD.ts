import type { PokemonInstance, SpeedMultiplier, PokeballId, PokemonType, StatId, MoveData } from '../types/game';
import { EffectivenessHelper } from '../battle/EffectivenessHelper';
import { PokemonFactory } from '../battle/PokemonFactory';
import { BattleAudio } from '../audio/BattleAudio';
import { BattleLogUI } from './BattleLogUI';
import type { StadiumRuleSet } from '../battle/BattleStateMachine';

export interface BattleHUDCallbacks {
  onMoveSelected: (moveId: string) => void;
  onDoubleMovesSelected?: (
    slot1MoveId: string,
    slot2MoveId?: string,
    slot1Target?: 0 | 1,
    slot2Target?: 0 | 1
  ) => void;
  onBagSelected: (ballId: PokeballId) => void;
  onItemUsed?: (itemId: string, targetPokemon: PokemonInstance) => void;
  onPokemonSelected?: (pokemon: PokemonInstance) => void;
  onRunSelected: () => void;
  onSpeedToggle: () => SpeedMultiplier;
}

export type BattleBagTab = 'ALL' | 'MEDICINE' | 'BALLS';

export interface BattleUsableItemMeta {
  id: string;
  name: string;
  badge: string;
  desc: string;
  icon: string;
  color: string;
  kind: 'HEAL_HP' | 'FULL_RESTORE' | 'REVIVE' | 'CURE_STATUS' | 'X_STAT';
  healAmount?: number;
  curesStatus?: string[];
  statBoost?: StatId;
}

export const BATTLE_ITEM_CATALOG: BattleUsableItemMeta[] = [
  { id: 'potion', name: 'Potion', badge: '+20 HP', desc: 'Restores 20 HP to a party Pokémon.', icon: '🧪', color: '#10b981', kind: 'HEAL_HP', healAmount: 20 },
  { id: 'super-potion', name: 'Super Potion', badge: '+50 HP', desc: 'Restores 50 HP to a party Pokémon.', icon: '⚗️', color: '#059669', kind: 'HEAL_HP', healAmount: 50 },
  { id: 'hyper-potion', name: 'Hyper Potion', badge: '+200 HP', desc: 'Restores 200 HP to a party Pokémon.', icon: '🧪', color: '#0284c7', kind: 'HEAL_HP', healAmount: 200 },
  { id: 'max-potion', name: 'Max Potion', badge: 'FULL HP', desc: 'Fully restores HP to a party Pokémon.', icon: '✨', color: '#2563eb', kind: 'HEAL_HP', healAmount: 9999 },
  { id: 'full-restore', name: 'Full Restore', badge: 'FULL + CURE', desc: 'Fully restores HP and cures all status conditions.', icon: '🌟', color: '#eab308', kind: 'FULL_RESTORE', healAmount: 9999 },
  { id: 'fresh-water', name: 'Fresh Water', badge: '+50 HP', desc: 'Mineral water that restores 50 HP.', icon: '💧', color: '#38bdf8', kind: 'HEAL_HP', healAmount: 50 },
  { id: 'soda-pop', name: 'Soda Pop', badge: '+60 HP', desc: 'Fizzy soda that restores 60 HP.', icon: '🥤', color: '#f43f5e', kind: 'HEAL_HP', healAmount: 60 },
  { id: 'lemonade', name: 'Lemonade', badge: '+80 HP', desc: 'Sweet lemonade that restores 80 HP.', icon: '🍋', color: '#facc15', kind: 'HEAL_HP', healAmount: 80 },
  { id: 'moomoo-milk', name: 'Moomoo Milk', badge: '+100 HP', desc: 'Nutritious farm milk that restores 100 HP.', icon: '🥛', color: '#f8fafc', kind: 'HEAL_HP', healAmount: 100 },
  { id: 'berry', name: 'Berry', badge: '+10 HP', desc: 'Natural berry that restores 10 HP.', icon: '🍒', color: '#fb7185', kind: 'HEAL_HP', healAmount: 10 },
  { id: 'gold-berry', name: 'Gold Berry', badge: '+30 HP', desc: 'Rare golden berry that restores 30 HP.', icon: '🍒', color: '#f59e0b', kind: 'HEAL_HP', healAmount: 30 },
  { id: 'antidote', name: 'Antidote', badge: 'CURES PSN', desc: 'Cures a poisoned Pokémon.', icon: '💛', color: '#a855f7', kind: 'CURE_STATUS', curesStatus: ['PSN', 'TOX'] },
  { id: 'parlyz-heal', name: 'Parlyz Heal', badge: 'CURES PAR', desc: 'Cures a paralyzed Pokémon.', icon: '⚡', color: '#eab308', kind: 'CURE_STATUS', curesStatus: ['PAR'] },
  { id: 'awakening', name: 'Awakening', badge: 'WAKES SLP', desc: 'Wakes up a sleeping Pokémon.', icon: '🔔', color: '#38bdf8', kind: 'CURE_STATUS', curesStatus: ['SLP'] },
  { id: 'burn-heal', name: 'Burn Heal', badge: 'CURES BRN', desc: 'Heals a Pokémon suffering from a burn.', icon: '🔥', color: '#ef4444', kind: 'CURE_STATUS', curesStatus: ['BRN'] },
  { id: 'ice-heal', name: 'Ice Heal', badge: 'CURES FRZ', desc: 'Defrosts a frozen Pokémon.', icon: '❄️', color: '#06b6d4', kind: 'CURE_STATUS', curesStatus: ['FRZ'] },
  { id: 'full-heal', name: 'Full Heal', badge: 'CURES ALL', desc: 'Cures any status problem on a party Pokémon.', icon: '💫', color: '#ec4899', kind: 'CURE_STATUS', curesStatus: ['PAR', 'SLP', 'PSN', 'TOX', 'BRN', 'FRZ'] },
  { id: 'revive', name: 'Revive', badge: 'REVIVE 50%', desc: 'Revives a fainted Pokémon and restores half HP.', icon: '💎', color: '#f59e0b', kind: 'REVIVE', healAmount: 0.5 },
  { id: 'max-revive', name: 'Max Revive', badge: 'REVIVE 100%', desc: 'Revives a fainted Pokémon to full HP.', icon: '💎', color: '#ec4899', kind: 'REVIVE', healAmount: 1.0 },
  { id: 'x-attack', name: 'X Attack', badge: 'ATK +1', desc: 'Raises Attack of the active Pokémon by 1 stage.', icon: '⚔️', color: '#ef4444', kind: 'X_STAT', statBoost: 'atk' },
  { id: 'x-defend', name: 'X Defend', badge: 'DEF +1', desc: 'Raises Defense of the active Pokémon by 1 stage.', icon: '🛡️', color: '#3b82f6', kind: 'X_STAT', statBoost: 'def' },
  { id: 'x-speed', name: 'X Speed', badge: 'SPE +1', desc: 'Raises Speed of the active Pokémon by 1 stage.', icon: '💨', color: '#10b981', kind: 'X_STAT', statBoost: 'spe' },
  { id: 'x-special', name: 'X Special', badge: 'SPA +1', desc: 'Raises Sp. Atk of the active Pokémon by 1 stage.', icon: '🔮', color: '#a855f7', kind: 'X_STAT', statBoost: 'spa' },
];

const TYPE_COLORS: Record<PokemonType, string> = {
  Normal: '#94a3b8',
  Fire: '#ef4444',
  Water: '#3b82f6',
  Grass: '#22c55e',
  Electric: '#eab308',
  Ice: '#06b6d4',
  Fighting: '#c2410c',
  Poison: '#a855f7',
  Ground: '#d97706',
  Flying: '#6366f1',
  Psychic: '#ec4899',
  Bug: '#84cc16',
  Rock: '#78716c',
  Ghost: '#6d28d9',
  Dragon: '#4f46e5',
  Steel: '#64748b',
  Dark: '#334155',
};

const STATUS_COLORS: Record<string, string> = {
  PAR: '#eab308',
  SLP: '#64748b',
  FRZ: '#06b6d4',
  BRN: '#ef4444',
  PSN: '#a855f7',
  TOX: '#9333ea',
};

const MOVE_SHORTCUT_LABELS = ['1 / Q', '2 / W', '3 / A', '4 / S'];

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
  private playerParty: PokemonInstance[] = [];
  private caughtSpeciesIds: Set<string> = new Set();
  private ballsInventory: Partial<Record<PokeballId, number>> = {};
  private itemsInventory: Partial<Record<string, number>> = {};
  private berriesInventory: Partial<Record<string, number>> = {};
  private activeBagTab: BattleBagTab = 'ALL';
  private selectedBagTargetIndex: number = 0;
  private callbacks!: BattleHUDCallbacks;
  public static readonly DIALOGUE_CHAR_DELAY_MS = 12;
  public static readonly DIALOGUE_POST_DELAY_MS = 500;

  private speedMultiplier: SpeedMultiplier = 1;
  private isForcedPartySwitch: boolean = false;

  constructor(containerId: string = 'battle-hud-container') {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`HUD Container #${containerId} not found in DOM`);
    }
    this.container = el;
    this.injectKeyframeStyles();
    this.createUI();
    this.updateSpeedDisplay(this.speedMultiplier);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.updateSpeedDisplay(this.speedMultiplier);
      });
    }
    this.setupKeyboardShortcuts();
  }

  private injectKeyframeStyles(): void {
    if (document.getElementById('crystal-battle-hud-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'crystal-battle-hud-styles';
    styleEl.textContent = `
      #battle-hud-root {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #enemy-level, #enemy-hp-text, #enemy-partner-level, #enemy-partner-hp-text,
      #player-level, #player-hp-text, #player-partner-level, #player-partner-hp-text,
      #battle-stadium-badge, #battle-speed-btn, .keyboard-hint, .move-pwr-acc,
      .status-condition-badge, .stat-stage-badge {
        font-family: 'Space Mono', monospace !important;
      }
      @keyframes crystalUltraPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(236, 72, 153, 0.75); }
        50% { transform: scale(1.06); box-shadow: 0 0 14px rgba(236, 72, 153, 1); }
      }
      @keyframes crystalLowHpPulse {
        0%, 100% { opacity: 1; filter: brightness(1); }
        50% { opacity: 0.72; filter: brightness(1.35); }
      }
      .crystal-ultra-pill {
        background: rgba(13, 19, 34, 0.95);
        border: 2px solid #22324F;
        box-shadow: 0 4px 0 0 #070B14;
        animation: crystalUltraPulse 1.1s infinite ease-in-out;
      }
      .crystal-low-hp {
        animation: crystalLowHpPulse 0.85s infinite ease-in-out;
      }
      #battle-action-menu button {
        box-shadow: 0 4px 0 0 #070B14;
        transition: transform 0.08s ease, box-shadow 0.08s ease;
      }
      #battle-action-menu button:active {
        transform: translateY(2px);
        box-shadow: 0 2px 0 0 #070B14 !important;
      }
      .battle-move-btn:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 0 #070B14 !important;
      }
      @media (hover: none) and (pointer: coarse), (max-width: 768px) {
        .keyboard-hint {
          display: none !important;
        }
      }
      body.touch-controls-active .keyboard-hint {
        display: none !important;
      }
      @media (max-width: 500px) {
        .move-pwr-acc {
          display: none !important;
        }
        #battle-fight-menu button {
          padding: 7px 10px !important;
          min-height: 48px !important;
        }
      }
      /* Move grid containment for the widest phones (Pixel 9 Pro XL 448px, iPhone 16 Pro Max 440px, zoom 480px) */
      #battle-fight-menu {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        gap: 8px !important;
      }
      .battle-move-btn {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      .battle-move-btn > div {
        min-width: 0 !important;
        max-width: 100% !important;
      }
      .battle-move-btn .move-btn-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #battle-message-box.full-width-dialogue {
        width: 100% !important;
        flex: 1 1 100% !important;
        box-sizing: border-box !important;
      }
      @media (max-width: 768px) {
        #battle-bottom-panel {
          flex-direction: column !important;
          box-sizing: border-box !important;
          max-width: 100% !important;
          overflow: hidden !important;
          gap: 8px !important;
        }
        #battle-action-menu {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          gap: 8px !important;
        }
        #battle-action-menu button {
          min-height: 52px !important;
          font-size: 15px !important;
        }
      }
      @media (orientation: portrait) {
        #enemy-card, #player-card {
          width: calc(100vw - 120px) !important;
          max-width: 270px !important;
          min-width: unset !important;
          padding: 8px 14px !important;
          font-size: 14px !important;
        }
        #battle-speed-btn {
          padding: 6px 12px !important;
          font-size: 12px !important;
        }
        #battle-bottom-panel {
          max-height: 48dvh !important;
          min-height: unset !important;
          padding: 10px 12px max(10px, env(safe-area-inset-bottom, 12px)) 12px !important;
          box-sizing: border-box !important;
        }
        #battle-fight-menu {
          max-height: 48dvh !important;
          overflow-y: auto !important;
          box-sizing: border-box !important;
          padding-bottom: env(safe-area-inset-bottom, 8px) !important;
        }
        #battle-action-menu {
          width: 100% !important;
        }
      }
      @media (orientation: landscape) and (max-height: 520px) {
        #enemy-card, #player-card {
          padding: 6px 12px !important;
          min-width: 220px !important;
          font-size: 13px !important;
        }
        #battle-bottom-panel {
          min-height: 80px !important;
          max-height: 42dvh !important;
          padding: 6px 12px !important;
          box-sizing: border-box !important;
        }
        #battle-fight-menu {
          max-height: 36dvh !important;
          overflow-y: auto !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  private getCategorySvg(category: 'Physical' | 'Special' | 'Status'): string {
    if (category === 'Physical') {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#dc2626" stroke-width="1.5" title="Physical Move">
        <polygon points="12,2 14.8,8.5 22,9.2 16.5,14 18.2,21 12,17.3 5.8,21 7.5,14 2,9.2 9.2,8.5"/>
      </svg>`;
    }
    if (category === 'Special') {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" title="Special Move">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="1.5" fill="#38bdf8"/>
      </svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" title="Status Move">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>`;
  }

  private getGenderOrLegendBadge(speciesId: string): string {
    if (['raikou', 'entei', 'suicune'].includes(speciesId)) {
      return `<span style="color: #facc15; font-size: 13px;" title="Legendary Beast">★</span>`;
    }
    const isFemale = ['chikorita', 'sentret', 'pidgey'].includes(speciesId);
    return isFemale
      ? `<span style="color: #f43f5e; font-size: 13px; font-weight: 800;">♀</span>`
      : `<span style="color: #38bdf8; font-size: 13px; font-weight: 800;">♂</span>`;
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

    root.innerHTML = `
      <!-- Top Area: Asymmetric Enemy HUD Card (Top-Left) & Speed Toggle Pill (Top-Right) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <div id="enemy-card" style="
          background: rgba(13, 19, 34, 0.95);
          backdrop-filter: blur(8px);
          border: 2px solid #22324F;
          border-radius: 10px;
          padding: 12px 20px;
          min-width: min(280px, calc(100vw - 120px));
          box-shadow: 0 4px 0 0 #070B14;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 16px; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span id="enemy-caught-icon" style="display: none; font-size: 12px;" title="Already Caught">🔴</span>
              <span id="enemy-name">Wild Pidgey</span>
              <span id="enemy-gender"></span>
              <span id="enemy-status-badges" style="display: flex; gap: 4px; flex-wrap: wrap;"></span>
            </div>
            <span id="enemy-level" style="background: rgba(250, 204, 21, 0.16); border: 1.5px solid #FFD028; color: #FFD028; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 0 0 #070B14;">Lv. 3</span>
          </div>
          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8; font-weight: 700;">
              <span style="color: #facc15; letter-spacing: 0.5px;">HP</span>
              <span id="enemy-hp-text" style="font-family: 'Space Mono', monospace;">16 / 16 HP</span>
            </div>
            <div style="width: 100%; height: 9px; background: #070B14; border: 1.5px solid #22324F; border-radius: 99px; overflow: hidden;">
              <div id="enemy-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
            </div>
          </div>
          <!-- 2v2 Secondary Enemy Partner Plate -->
          <div id="enemy-partner-card" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(148, 163, 184, 0.35);">
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 13px; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; color: #38bdf8; font-weight: 800;">FOE 2</span>
                <span id="enemy-partner-name">Partner</span>
                <span id="enemy-partner-status-badges" style="display: flex; gap: 4px;"></span>
              </div>
              <span id="enemy-partner-level" style="color: #facc15; font-size: 11px; font-weight: 800; font-family: 'Space Mono', monospace;">Lv. 30</span>
            </div>
            <div style="margin-top: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; color: #94a3b8; font-weight: 700;">
                <span style="color: #facc15;">HP</span>
                <span id="enemy-partner-hp-text" style="font-family: 'Space Mono', monospace;">50 / 50 HP</span>
              </div>
              <div style="width: 100%; height: 7px; background: #070B14; border: 1.5px solid #22324F; border-radius: 99px; overflow: hidden;">
                <div id="enemy-partner-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
              </div>
            </div>
          </div>
        </div>

        <div id="battle-top-right-controls" style="pointer-events: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; position: relative;">
          <div id="battle-stadium-badge" style="
            display: none;
            background: #0D1322;
            border: 1.5px solid #FFD028;
            color: #FFD028;
            border-radius: 8px;
            padding: 5px 12px;
            font-size: 11px;
            font-weight: 700;
            font-family: 'Space Mono', monospace;
            letter-spacing: 0.4px;
            box-shadow: 0 3px 0 0 #070B14;
          "></div>
          <button id="battle-speed-btn" style="
            background: #141E33;
            color: #38BDF8;
            border: 2px solid #38BDF8;
            border-radius: 8px;
            padding: 7px 14px;
            font-size: 12px;
            font-weight: 700;
            font-family: 'Space Mono', monospace;
            cursor: pointer;
            box-shadow: 0 3px 0 0 #070B14;
            pointer-events: auto;
          ">
            <span>⚡ SPEED: 1x</span> <span class="keyboard-hint">(Shift)</span>
          </button>
        </div>
      </div>

      <!-- Mid-Right Area: Asymmetric Player HUD Card with Numeric HP, Cyan EXP Bar & 6-Dot Party Dock -->
      <div style="display: flex; justify-content: flex-end; width: 100%; margin-bottom: 10px;">
        <div id="player-card" style="
          background: rgba(13, 19, 34, 0.95);
          backdrop-filter: blur(8px);
          border: 2px solid #22324F;
          border-radius: 10px;
          padding: 12px 20px 10px 20px;
          min-width: min(290px, calc(100vw - 60px));
          box-shadow: 0 4px 0 0 #070B14;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 16px; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span id="player-name">Cyndaquil</span>
              <span id="player-gender"></span>
              <span id="player-status-badges" style="display: flex; gap: 4px; flex-wrap: wrap;"></span>
            </div>
            <span id="player-level" style="background: rgba(250, 204, 21, 0.16); border: 1.5px solid #FFD028; color: #FFD028; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; box-shadow: 0 2px 0 0 #070B14;">Lv. 5</span>
          </div>
          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8; font-weight: 700;">
              <span style="color: #facc15; letter-spacing: 0.5px;">HP</span>
              <span id="player-hp-text" style="color: #f8fafc; font-weight: 800; font-family: 'Space Mono', monospace;">20 / 20 HP</span>
            </div>
            <div style="width: 100%; height: 9px; background: #070B14; border: 1.5px solid #22324F; border-radius: 99px; overflow: hidden;">
              <div id="player-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
            </div>
          </div>
          <!-- 2v2 Secondary Player Partner Plate -->
          <div id="player-partner-card" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(148, 163, 184, 0.35);">
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 13px; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; color: #4ade80; font-weight: 800;">ALLY 2</span>
                <span id="player-partner-name">Partner</span>
                <span id="player-partner-status-badges" style="display: flex; gap: 4px;"></span>
              </div>
              <span id="player-partner-level" style="color: #facc15; font-size: 11px; font-weight: 800; font-family: 'Space Mono', monospace;">Lv. 30</span>
            </div>
            <div style="margin-top: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; color: #94a3b8; font-weight: 700;">
                <span style="color: #facc15;">HP</span>
                <span id="player-partner-hp-text" style="color: #f8fafc; font-weight: 800; font-family: 'Space Mono', monospace;">50 / 50 HP</span>
              </div>
              <div style="width: 100%; height: 7px; background: #070B14; border: 1.5px solid #22324F; border-radius: 99px; overflow: hidden;">
                <div id="player-partner-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
              </div>
            </div>
          </div>
          <!-- Cyan EXP Bar + 6-Dot Miniature Party Dock -->
          <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; font-family: 'Space Mono', monospace;">EXP</span>
              <div style="flex: 1; height: 5px; background: #070B14; border: 1px solid #22324F; border-radius: 3px; overflow: hidden;">
                <div id="player-exp-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8); transition: width 0.35s ease;"></div>
              </div>
            </div>
            <div id="player-party-dock" title="Party Status" style="display: flex; align-items: center; gap: 4px;"></div>
          </div>
        </div>
      </div>

      <!-- Bottom Control & Classic Double-Framed Dialogue Panel -->
      <div id="battle-bottom-panel" style="
        background: rgba(13, 19, 34, 0.96);
        backdrop-filter: blur(12px);
        border: 2px solid #22324F;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 6px 0 0 #070B14;
        pointer-events: auto;
        min-height: 132px;
        display: flex;
        gap: 20px;
        box-sizing: border-box;
      ">
        <!-- Dialogue Text -->
        <div id="battle-message-box" style="
          flex: 1;
          background: #141E33;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 16px;
          font-weight: 600;
          color: #f8fafc;
          line-height: 1.5;
          display: flex;
          align-items: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
        ">
          What will Cyndaquil do?
        </div>

        <!-- Main 2x2 Command Menu (FIGHT / BAG / POKEMON / RUN) -->
        <div id="battle-action-menu" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 280px;
        ">
          <button id="btn-fight" style="
            background: #dc2626;
            color: white;
            border: 2px solid #ef4444;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.8px;
            padding: 10px 12px;
            cursor: pointer;
            box-shadow: 0 4px 0 0 #070B14;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          "><span>FIGHT</span><span class="keyboard-hint" style="font-size: 10px; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px; font-family: 'Space Mono', monospace;">[F]</span></button>
          <button id="btn-bag" style="
            background: #d97706;
            color: white;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.8px;
            padding: 10px 12px;
            cursor: pointer;
            box-shadow: 0 4px 0 0 #070B14;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          "><span>BAG</span><span class="keyboard-hint" style="font-size: 10px; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px; font-family: 'Space Mono', monospace;">[B]</span></button>
          <button id="btn-pokemon" style="
            background: #059669;
            color: white;
            border: 2px solid #10b981;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.8px;
            padding: 10px 12px;
            cursor: pointer;
            box-shadow: 0 4px 0 0 #070B14;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          "><span>POKÉMON</span><span class="keyboard-hint" style="font-size: 10px; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px; font-family: 'Space Mono', monospace;">[P]</span></button>
          <button id="btn-run" style="
            background: #2563eb;
            color: white;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.8px;
            padding: 10px 12px;
            cursor: pointer;
            box-shadow: 0 4px 0 0 #070B14;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          "><span>RUN</span><span class="keyboard-hint" style="font-size: 10px; opacity: 0.85; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px; font-family: 'Space Mono', monospace;">[R]</span></button>
        </div>

        <!-- Fight Submenu (Unbound 2x2 Move Matrix + Tooltip) -->
        <div id="battle-fight-menu" style="
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
          width: 100%;
          max-height: 48dvh;
          overflow-y: auto;
          box-sizing: border-box;
          padding-bottom: env(safe-area-inset-bottom, 12px);
          -webkit-overflow-scrolling: touch;
        "></div>

        <!-- Bag Submenu (Medicine, Heals & Pokéballs) -->
        <div id="battle-bag-menu" style="
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          flex: 1;
          width: 100%;
          max-height: 220px;
          overflow-y: auto;
        "></div>

        <!-- Party Submenu (Switch Pokémon) -->
        <div id="battle-party-menu" style="
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
          width: 100%;
          max-height: 180px;
          overflow-y: auto;
        "></div>
      </div>
    `;

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

      // Global battle shortcuts: [L] toggles Battle Log, [Shift] cycles Battle Speed
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

      if ((isBagMenuOpen || (isPartyMenuOpen && !this.isForcedPartySwitch)) && (e.code === 'Escape' || e.code === 'KeyX')) {
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
    const activeBattler = this.getOrderingCombatant();
    const moveSlot = activeBattler?.moves[index];
    if (!moveSlot) return;
    const moveData = PokemonFactory.getMoveData(moveSlot.moveId);
    if (moveSlot.currentPp > 0) {
      moveSlot.currentPp--;
    }

    // If 2v2 Double Battle and Slot 1 just chose a move while Partner Slot 2 is conscious:
    if (
      this.isDoubleBattleMode &&
      this.activeCommandSlot === 0 &&
      this.playerPokemon.currentHp > 0 &&
      this.playerPartner &&
      this.playerPartner.currentHp > 0
    ) {
      this.pendingSlot1MoveId = moveData.id;
      this.activeCommandSlot = 1;
      this.showFightMenu();
      return;
    }

    const slot1Move =
      this.isDoubleBattleMode && this.activeCommandSlot === 1 && this.pendingSlot1MoveId
        ? this.pendingSlot1MoveId
        : moveData.id;
    const slot2Move =
      this.isDoubleBattleMode && this.activeCommandSlot === 1 ? moveData.id : undefined;

    this.activeCommandSlot = 0;
    this.pendingSlot1MoveId = null;
    this.fightMenu.style.display = 'none';
    this.messageBox.style.display = 'flex';

    if (this.isDoubleBattleMode && this.callbacks?.onDoubleMovesSelected) {
      this.callbacks.onDoubleMovesSelected(
        slot1Move,
        slot2Move,
        this.selectedSlot1Target,
        this.selectedSlot2Target
      );
    } else if (this.callbacks?.onMoveSelected) {
      this.callbacks.onMoveSelected(slot1Move);
    }
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
    (this.rootElement.querySelector('#enemy-gender') as HTMLElement).innerHTML = this.getGenderOrLegendBadge(
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
    (this.rootElement.querySelector('#player-gender') as HTMLElement).innerHTML = this.getGenderOrLegendBadge(
      playerPokemon.speciesId
    );
    (this.rootElement.querySelector('#player-level') as HTMLElement).innerText = `Lv. ${playerPokemon.level}`;
    this.updateHp(true, playerPokemon.currentHp, playerPokemon.stats.hp);
    this.updateExp(playerPokemon);
    this.updateStatusBadges();
    this.updatePartyDock();
  }

  /**
   * Smoothly slides in the player or opponent health card upon send-out (Ticket 5.5).
   */
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
    let html = '';
    for (let i = 0; i < 6; i++) {
      const member = this.playerParty[i];
      if (!member) {
        html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #0f172a; border: 1.5px solid #334155; display: inline-block;" title="Empty Slot"></span>`;
      } else if (member.currentHp <= 0) {
        html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #7f1d1d; border: 1.5px solid #ef4444; opacity: 0.55; display: inline-block;" title="${member.nickname} (Fainted)"></span>`;
      } else if (member.status && member.status !== 'NONE') {
        html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #f59e0b; border: 1.5px solid #fef08a; display: inline-block;" title="${member.nickname} (${member.status})"></span>`;
      } else {
        html += `<span style="width: 9px; height: 9px; border-radius: 50%; background: #22c55e; border: 1.5px solid #bbf7d0; box-shadow: 0 0 4px rgba(34, 197, 94, 0.7); display: inline-block;" title="${member.nickname} (Healthy)"></span>`;
      }
    }
    this.playerPartyDock.innerHTML = html;
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
    const parts: string[] = [];
    if (moveData.priority > 0) {
      parts.push(`Priority +${moveData.priority} (strikes first).`);
    } else if (moveData.priority < 0) {
      parts.push(`Priority ${moveData.priority} (strikes last).`);
    }
    if (moveData.trapsTarget) {
      parts.push('Prevents target from fleeing or switching.');
    }
    if (moveData.leavesOneHp) {
      parts.push('Always leaves the target with at least 1 HP.');
    }
    if (moveData.id === 'furycutter') {
      parts.push('Power doubles with each consecutive hit (up to 160).');
    }
    if (moveData.id === 'swift') {
      parts.push('Bypasses accuracy checks and never misses.');
    }
    if (moveData.inflictsStatus && moveData.inflictsStatus !== 'NONE') {
      parts.push(`Inflicts ${moveData.inflictsStatus} status on the target.`);
    }
    if (moveData.secondaryStatus) {
      const pct = Math.round(moveData.secondaryStatus.chance * 100);
      parts.push(`${pct}% chance to inflict ${moveData.secondaryStatus.status}.`);
    }
    if (moveData.statChanges) {
      const statNames: Record<StatId, string> = {
        atk: 'Attack',
        def: 'Defense',
        spa: 'Sp. Atk',
        spd: 'Sp. Def',
        spe: 'Speed',
        acc: 'Accuracy',
        eva: 'Evasion',
      };
      const who = moveData.statChanges.target === 'self' ? "user's" : "foe's";
      const dir = moveData.statChanges.stages > 0 ? 'Raises' : 'Lowers';
      const amt = Math.abs(moveData.statChanges.stages);
      parts.push(`${dir} ${who} ${statNames[moveData.statChanges.stat]} by ${amt} stage${amt > 1 ? 's' : ''}.`);
    }
    if (parts.length === 0) {
      parts.push(`Deals ${moveData.category.toLowerCase()} ${moveData.type}-type damage.`);
    }
    return parts.join(' ');
  }

  public getMoveEffectDescription(moveData: MoveData): string {
    return BattleHUD.getMoveEffectDescription(moveData);
  }

  public updateStatusBadges(): void {
    const renderBadges = (pkmn: PokemonInstance, containerId: string) => {
      const el = this.rootElement.querySelector(containerId) as HTMLElement;
      if (!el || !pkmn) return;
      let html = '';
      if (pkmn.status && pkmn.status !== 'NONE') {
        const bg = STATUS_COLORS[pkmn.status] || '#64748b';
        html += `<span class="status-condition-badge" style="background: ${bg}; color: white; font-size: 10px; font-weight: 800; padding: 2px 5px; border-radius: 4px;">${pkmn.status}</span>`;
      }
      if (pkmn.isTrapped) {
        html += `<span style="background: #7c3aed; color: white; font-size: 10px; font-weight: 800; padding: 2px 5px; border-radius: 4px;">🔒 TRAPPED</span>`;
      }
      if (pkmn.statStages) {
        const shortLabels: Record<StatId, string> = {
          atk: 'ATK',
          def: 'DEF',
          spa: 'SPA',
          spd: 'SPD',
          spe: 'SPE',
          acc: 'ACC',
          eva: 'EVA',
        };
        for (const [k, v] of Object.entries(pkmn.statStages) as Array<[StatId, number]>) {
          if (v !== 0) {
            const isBoost = v > 0;
            const bg = isBoost ? 'rgba(6, 78, 59, 0.9)' : 'rgba(136, 19, 55, 0.9)';
            const border = isBoost ? '#10b981' : '#f43f5e';
            const textCol = isBoost ? '#6ee7b7' : '#fda4af';
            const sign = isBoost ? `+${v}` : `${v}`;
            const arrow = isBoost ? '▲' : '▼';
            html += `<span class="stat-stage-badge" data-stat="${k}" data-stage="${v}" title="${shortLabels[k]} Stage ${sign}" style="background: ${bg}; color: ${textCol}; border: 1px solid ${border}; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px; font-family: monospace;">${shortLabels[k]}${sign}${arrow}</span>`;
          }
        }
      }
      el.innerHTML = html;
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

    // Scale HP bar drain transition duration by battleSpeedMultiplier
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

  public showFightMenu(): void {
    this.messageBox.style.display = 'none';
    this.actionMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.fightMenu.style.display = 'grid';
    this.fightMenu.innerHTML = '';

    if (
      this.isDoubleBattleMode &&
      this.playerPokemon.currentHp <= 0 &&
      this.playerPartner &&
      this.playerPartner.currentHp > 0
    ) {
      this.activeCommandSlot = 1;
    }

    const activeBattler = this.getOrderingCombatant();
    const currentTargetSlot =
      this.activeCommandSlot === 1 ? this.selectedSlot2Target : this.selectedSlot1Target;
    const activeTargetFoe =
      currentTargetSlot === 1 && this.enemyPartner && this.enemyPartner.currentHp > 0
        ? this.enemyPartner
        : this.enemyPokemon;

    // 2v2 Double Battle Command & Target Selector Bar
    if (this.isDoubleBattleMode) {
      const targetBar = document.createElement('div');
      targetBar.id = 'double-battle-target-bar';
      targetBar.style.cssText = `
        grid-column: span 2;
        background: rgba(30, 41, 59, 0.95);
        border: 1px solid #facc15;
        border-radius: 6px;
        padding: 5px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-size: 11px;
      `;
      const slotLabel = this.activeCommandSlot === 0 ? 'ALLY 1' : 'ALLY 2';
      targetBar.innerHTML = `
        <div style="font-weight: 800; color: #facc15;">
          🎯 ${slotLabel}: ${activeBattler.nickname.toUpperCase()}
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="color: #94a3b8; font-weight: 700;">TARGET:</span>
          <button id="target-foe-0-btn" type="button" style="
            background: ${currentTargetSlot === 0 ? '#2563eb' : '#0f172a'};
            color: white;
            border: 1px solid ${currentTargetSlot === 0 ? '#60a5fa' : '#334155'};
            border-radius: 4px;
            padding: 2px 7px;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
          ">FOE 1: ${this.enemyPokemon.nickname}</button>
          ${
            this.enemyPartner && this.enemyPartner.currentHp > 0
              ? `<button id="target-foe-1-btn" type="button" style="
                  background: ${currentTargetSlot === 1 ? '#2563eb' : '#0f172a'};
                  color: white;
                  border: 1px solid ${currentTargetSlot === 1 ? '#60a5fa' : '#334155'};
                  border-radius: 4px;
                  padding: 2px 7px;
                  font-size: 10px;
                  font-weight: 800;
                  cursor: pointer;
                ">FOE 2: ${this.enemyPartner.nickname}</button>`
              : ''
          }
        </div>
      `;
      this.fightMenu.appendChild(targetBar);

      const foe0Btn = targetBar.querySelector('#target-foe-0-btn');
      const foe1Btn = targetBar.querySelector('#target-foe-1-btn');
      foe0Btn?.addEventListener('click', () => {
        if (this.activeCommandSlot === 1) this.selectedSlot2Target = 0;
        else this.selectedSlot1Target = 0;
        this.showFightMenu();
      });
      foe1Btn?.addEventListener('click', () => {
        if (this.activeCommandSlot === 1) this.selectedSlot2Target = 1;
        else this.selectedSlot1Target = 1;
        this.showFightMenu();
      });
    }

    // Tactical Move Tooltip Preview Bar (spans both columns)
    const tooltipBar = document.createElement('div');
    tooltipBar.id = 'battle-move-tooltip';
    tooltipBar.style.cssText = `
      grid-column: span 2;
      background: rgba(13, 19, 34, 0.95);
      border: 1.5px solid #22324F;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 11px;
      color: #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      min-height: 28px;
      box-shadow: 0 3px 0 0 #070B14;
      font-family: 'Plus Jakarta Sans', sans-serif;
    `;

    const renderTooltipForMove = (moveData: MoveData, currentPp: number, maxPp: number) => {
      const pwrStr = moveData.power > 0 ? `${moveData.power}` : '—';
      const accStr = moveData.accuracy > 0 ? `${moveData.accuracy}%` : '—';
      const effectText = this.getMoveEffectDescription(moveData);
      const typeColor = TYPE_COLORS[moveData.type] || '#64748b';
      tooltipBar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="font-weight: 800; color: #38bdf8;">${moveData.name}</span>
          <span style="background: ${typeColor}; color: white; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px;">${moveData.type.toUpperCase()}</span>
          <span style="font-size: 10px; color: #94a3b8; font-weight: 700;">${moveData.category} · PWR ${pwrStr} · ACC ${accStr} · PP ${currentPp}/${maxPp}</span>
        </div>
        <div class="move-tooltip-effect" style="font-size: 11px; color: #f8fafc; font-weight: 600;">${effectText}</div>
      `;
    };

    if (activeBattler.moves.length > 0) {
      const firstSlot = activeBattler.moves[0];
      renderTooltipForMove(PokemonFactory.getMoveData(firstSlot.moveId), firstSlot.currentPp, firstSlot.maxPp);
    } else {
      tooltipBar.innerText = 'Select a move to preview its power, accuracy, and tactical effect.';
    }
    this.fightMenu.appendChild(tooltipBar);

    activeBattler.moves.forEach((moveSlot, idx) => {
      const moveData = PokemonFactory.getMoveData(moveSlot.moveId);
      const badge = EffectivenessHelper.evaluate(moveData, activeTargetFoe);
      const pill = EffectivenessHelper.getPillStyle(badge.multiplier, moveData.category === 'Status');

      const btn = document.createElement('button');
      btn.id = `move-btn-${idx}`;
      btn.className = 'battle-move-btn';
      btn.style.cssText = `
        background: #141E33;
        color: white;
        border: 1.5px solid #22324F;
        border-radius: 8px;
        padding: 9px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        min-width: 0 !important;
        box-shadow: 0 3px 0 0 #070B14;
        transition: transform 0.08s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.08s ease;
      `;

      const typeColor = TYPE_COLORS[moveData.type] || '#64748b';
      const categorySvg = this.getCategorySvg(moveData.category);
      const shortcutHint = MOVE_SHORTCUT_LABELS[idx] || `${idx + 1}`;
      const pwrStr = moveData.power > 0 ? `${moveData.power}` : '—';
      const accStr = moveData.accuracy > 0 ? `${moveData.accuracy}` : '—';
      const effectDesc = this.getMoveEffectDescription(moveData);

      btn.title = `${moveData.name} (${moveData.type.toUpperCase()}) | Category: ${moveData.category} | PWR: ${pwrStr} | ACC: ${accStr}% | PP: ${moveSlot.currentPp}/${moveSlot.maxPp} | ${effectDesc}`;
      btn.setAttribute('aria-label', btn.title);

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="keyboard-hint" style="font-size: 10px; font-weight: 800; color: #94a3b8; background: #0f172a; border: 1px solid #334155; padding: 1px 5px; border-radius: 4px;">[${shortcutHint}]</span>
            <span class="move-btn-name" style="font-weight: 800; font-size: 15px;">${moveData.name}</span>
          </div>
          <span style="display: flex; align-items: center;">${categorySvg}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 6px; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 10px; font-weight: 800; background: ${typeColor}; color: white; padding: 2px 6px; border-radius: 4px;">${moveData.type.toUpperCase()}</span>
            <span style="font-size: 11px; font-weight: 700; color: #cbd5e1;">PP ${moveSlot.currentPp}/${moveSlot.maxPp}</span>
            <span class="move-pwr-acc" style="font-size: 10px; font-weight: 700; color: #94a3b8;">PWR ${pwrStr}</span>
            <span class="move-pwr-acc" style="font-size: 10px; font-weight: 700; color: #94a3b8;">ACC ${accStr}</span>
          </div>
          <span class="${pill.pulse ? 'crystal-ultra-pill' : ''}" style="
            background: ${pill.background};
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 4px;
            text-decoration: ${pill.strikethrough ? 'line-through' : 'none'};
            white-space: nowrap;
          ">${pill.label}</span>
        </div>
      `;

      btn.addEventListener('mouseenter', () => {
        renderTooltipForMove(moveData, moveSlot.currentPp, moveSlot.maxPp);
      });
      btn.addEventListener('focus', () => {
        renderTooltipForMove(moveData, moveSlot.currentPp, moveSlot.maxPp);
      });
      btn.addEventListener('click', () => {
        this.selectMoveSlot(idx);
      });

      this.fightMenu.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
      background: #141E33;
      color: #cbd5e1;
      border: 1.5px solid #22324F;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      padding: 6px;
      cursor: pointer;
      grid-column: span 2;
      box-shadow: 0 3px 0 0 #070B14;
      font-family: 'Space Mono', monospace;
    `;
    backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
    backBtn.addEventListener('click', () => this.showActionMenu());
    this.fightMenu.appendChild(backBtn);
  }

  public showActionMenu(): void {
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.actionMenu.style.display = 'grid';
    this.messageBox.innerText = `What will ${this.playerPokemon.nickname} do?`;
    if (this.isMobileViewport()) {
      // Handheld: the 2x2 action quadrant takes over the full bottom tray
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
    this.isForcedPartySwitch = Boolean(options?.forcedSwitch);
    this.messageBox.style.display = 'none';
    this.actionMenu.style.display = 'none';
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.partyMenu.style.display = 'grid';
    this.partyMenu.innerHTML = '';

    for (const pkmn of this.playerParty) {
      const isActive = pkmn.uid === this.playerPokemon.uid;
      const isFainted = pkmn.currentHp <= 0;
      const isEgg = Boolean(pkmn.isEgg);
      const pct = Math.max(0, Math.min(100, (pkmn.currentHp / pkmn.stats.hp) * 100));
      const hpColor = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444';

      const btn = document.createElement('button');
      btn.style.cssText = `
        background: ${isActive ? '#0D1322' : '#141E33'};
        color: ${isFainted || isEgg ? '#64748b' : 'white'};
        border: 1.5px solid ${isActive ? '#38BDF8' : '#22324F'};
        border-radius: 8px;
        padding: 8px 12px;
        cursor: ${isActive || isFainted || isEgg ? 'default' : 'pointer'};
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        box-shadow: 0 3px 0 0 #070B14;
        font-family: 'Plus Jakarta Sans', sans-serif;
      `;

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="font-weight: 700; font-size: 14px;">${isEgg ? '🥚 EGG' : pkmn.nickname} ${isActive ? '(OUT)' : ''}</span>
          <span style="font-size: 11px; color: #facc15; font-weight: 700;">${isEgg ? 'EGG' : `Lv.${pkmn.level}`}</span>
        </div>
        <div style="width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; margin-top: 6px;">
          <div style="width: ${isEgg ? 100 : pct}%; height: 100%; background: ${isEgg ? '#facc15' : hpColor};"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 4px;">
          <span>${isEgg ? `Steps: ${pkmn.eggSteps ?? 0}` : `HP ${pkmn.currentHp}/${pkmn.stats.hp}`}</span>
          <span>${pkmn.status !== 'NONE' ? pkmn.status : ''}</span>
        </div>
      `;

      btn.addEventListener('click', async () => {
        if (isEgg) {
          await this.showMessage("An EGG can't battle!");
          this.partyMenu.style.display = 'grid';
          this.messageBox.style.display = 'none';
          return;
        }
        if (isActive) {
          await this.showMessage(`${pkmn.nickname} is already in battle!`);
          this.partyMenu.style.display = 'grid';
          this.messageBox.style.display = 'none';
          return;
        }
        if (isFainted) {
          await this.showMessage(`${pkmn.nickname} has no energy left to battle!`);
          this.partyMenu.style.display = 'grid';
          this.messageBox.style.display = 'none';
          return;
        }
        this.isForcedPartySwitch = false;
        this.partyMenu.style.display = 'none';
        this.messageBox.style.display = 'flex';
        if (options?.onSelected) {
          options.onSelected(pkmn);
        } else if (this.callbacks?.onPokemonSelected) {
          this.callbacks.onPokemonSelected(pkmn);
        }
      });

      this.partyMenu.appendChild(btn);
    }

    if (!this.isForcedPartySwitch) {
      const backBtn = document.createElement('button');
      backBtn.style.cssText = `
        background: #141E33;
        color: white;
        border: 1.5px solid #22324F;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        padding: 8px;
        cursor: pointer;
        grid-column: span 2;
        box-shadow: 0 3px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
      `;
      backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
      backBtn.addEventListener('click', () => this.showActionMenu());
      this.partyMenu.appendChild(backBtn);
    }
  }

  private getOwnedMedicineCount(itemId: string): number {
    const underscoreId = itemId.replace(/-/g, '_');
    return (
      (this.itemsInventory[itemId] ?? 0) +
      (underscoreId !== itemId ? (this.itemsInventory[underscoreId] ?? 0) : 0) +
      (this.berriesInventory[itemId] ?? 0) +
      (underscoreId !== itemId ? (this.berriesInventory[underscoreId] ?? 0) : 0)
    );
  }

  public showBagMenu(tab?: BattleBagTab): void {
    if (tab) {
      this.activeBagTab = tab;
    }
    this.messageBox.style.display = 'none';
    this.actionMenu.style.display = 'none';
    this.fightMenu.style.display = 'none';
    this.partyMenu.style.display = 'none';
    this.bagMenu.style.display = 'grid';
    this.bagMenu.innerHTML = '';

    // 1. Category Filter Tabs & Party Target Selector (spans 2 columns)
    const headerBar = document.createElement('div');
    headerBar.style.cssText = `
      grid-column: span 2;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: rgba(13, 19, 34, 0.95);
      border: 1.5px solid #22324F;
      border-radius: 8px;
      padding: 6px 10px;
      box-shadow: 0 3px 0 0 #070B14;
    `;

    const tabRow = document.createElement('div');
    tabRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;';

    const tabsLeft = document.createElement('div');
    tabsLeft.style.cssText = 'display: flex; gap: 6px;';
    const tabDefs: Array<{ id: BattleBagTab; label: string }> = [
      { id: 'ALL', label: '🎒 ALL' },
      { id: 'MEDICINE', label: '🧪 MEDICINE & ITEMS' },
      { id: 'BALLS', label: '🔴 POKé BALLS' },
    ];
    for (const t of tabDefs) {
      const isAct = this.activeBagTab === t.id;
      const tBtn = document.createElement('button');
      tBtn.type = 'button';
      tBtn.className = `battle-bag-tab-${t.id.toLowerCase()}`;
      tBtn.style.cssText = `
        background: ${isAct ? '#0284c7' : '#141E33'};
        color: ${isAct ? '#ffffff' : '#94a3b8'};
        border: 1.5px solid ${isAct ? '#38bdf8' : '#22324F'};
        border-radius: 6px;
        padding: 3px 10px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 2px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
      `;
      tBtn.innerText = t.label;
      tBtn.addEventListener('click', () => this.showBagMenu(t.id));
      tabsLeft.appendChild(tBtn);
    }
    tabRow.appendChild(tabsLeft);

    // Compact Party Target Selector for Medicine
    if (this.activeBagTab !== 'BALLS' && this.playerParty.length > 0) {
      const targetWrap = document.createElement('div');
      targetWrap.style.cssText = 'display: flex; align-items: center; gap: 4px; flex-wrap: wrap;';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size: 10px; font-weight: 800; color: #94a3b8; margin-right: 2px; font-family: \'Space Mono\', monospace;';
      lbl.innerText = 'TARGET:';
      targetWrap.appendChild(lbl);

      this.playerParty.forEach((pkmn, idx) => {
        if (pkmn.isEgg) return;
        const isSel = idx === this.selectedBagTargetIndex;
        const pBtn = document.createElement('button');
        pBtn.type = 'button';
        pBtn.className = 'battle-bag-target-btn';
        pBtn.style.cssText = `
          background: ${isSel ? '#065f46' : '#141E33'};
          color: ${isSel ? '#a7f3d0' : '#cbd5e1'};
          border: 1px solid ${isSel ? '#10b981' : '#22324F'};
          border-radius: 5px;
          padding: 2px 7px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 0 0 #070B14;
          font-family: 'Plus Jakarta Sans', sans-serif;
        `;
        const statusSuffix = pkmn.status !== 'NONE' ? ` [${pkmn.status}]` : '';
        pBtn.innerText = `${pkmn.nickname} (${pkmn.currentHp}/${pkmn.stats.hp})${statusSuffix}`;
        pBtn.addEventListener('click', () => {
          this.selectedBagTargetIndex = idx;
          this.showBagMenu();
        });
        targetWrap.appendChild(pBtn);
      });
      tabRow.appendChild(targetWrap);
    }

    headerBar.appendChild(tabRow);
    this.bagMenu.appendChild(headerBar);

    const targetPkmn = this.playerParty[this.selectedBagTargetIndex] || this.playerPokemon;
    let renderedCount = 0;

    // 2. Render Medicine, Heals, Revives & Battle Items
    if (this.activeBagTab === 'ALL' || this.activeBagTab === 'MEDICINE') {
      for (const item of BATTLE_ITEM_CATALOG) {
        const count = this.getOwnedMedicineCount(item.id);
        if (count <= 0) continue;
        renderedCount++;

        const btn = document.createElement('button');
        btn.className = 'battle-bag-item-btn';
        btn.setAttribute('data-item-id', item.id);
        btn.style.cssText = `
          background: #141E33;
          color: white;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: transform 0.1s ease;
        `;

        btn.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: ${item.color};">
              <span>${item.icon}</span>
              <span>${item.name}</span>
              <span style="font-size: 9px; background: rgba(15, 23, 42, 0.85); color: #a7f3d0; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.4); font-family: 'Space Mono', monospace;">${item.badge}</span>
            </span>
            <span style="font-size: 12px; font-weight: 700; color: #facc15; font-family: 'Space Mono', monospace;">x${count}</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
            ${item.desc}
          </div>
        `;

        btn.addEventListener('click', async () => {
          const useTarget = item.kind === 'X_STAT' ? this.playerPokemon : targetPkmn;
          if (!useTarget) return;

          if (item.kind === 'HEAL_HP') {
            if (useTarget.currentHp <= 0) {
              await this.showMessage(`${useTarget.nickname} has fainted! Use a Revive first.`);
              this.showBagMenu();
              return;
            }
            if (useTarget.currentHp >= useTarget.stats.hp) {
              await this.showMessage(`It won't have any effect! ${useTarget.nickname} is already at full HP.`);
              this.showBagMenu();
              return;
            }
          } else if (item.kind === 'FULL_RESTORE') {
            if (useTarget.currentHp <= 0) {
              await this.showMessage(`${useTarget.nickname} has fainted!`);
              this.showBagMenu();
              return;
            }
            if (useTarget.currentHp >= useTarget.stats.hp && useTarget.status === 'NONE') {
              await this.showMessage(`It won't have any effect on ${useTarget.nickname}!`);
              this.showBagMenu();
              return;
            }
          } else if (item.kind === 'REVIVE') {
            if (useTarget.currentHp > 0) {
              await this.showMessage(`${useTarget.nickname} hasn't fainted!`);
              this.showBagMenu();
              return;
            }
          } else if (item.kind === 'CURE_STATUS') {
            if (useTarget.currentHp <= 0 || !item.curesStatus?.includes(useTarget.status)) {
              await this.showMessage(`It won't have any effect on ${useTarget.nickname}!`);
              this.showBagMenu();
              return;
            }
          }

          this.bagMenu.style.display = 'none';
          this.messageBox.style.display = 'flex';
          if (this.callbacks?.onItemUsed) {
            this.callbacks.onItemUsed(item.id, useTarget);
          }
        });

        this.bagMenu.appendChild(btn);
      }
    }

    // 3. Render Pokéballs
    if (this.activeBagTab === 'ALL' || this.activeBagTab === 'BALLS') {
      const allBallMeta: Array<{ id: PokeballId; name: string; desc: string; color: string }> = [
        { id: 'quick-ball', name: 'Quick Ball', desc: '5.0x catch rate on Turn 1', color: '#0284c7' },
        { id: 'fast-ball', name: 'Fast Ball', desc: '4.0x if Base Speed ≥ 100', color: '#ea580c' },
        { id: 'net-ball', name: 'Net Ball', desc: '3.5x if Water or Bug', color: '#059669' },
        { id: 'dusk-ball', name: 'Dusk Ball', desc: '3.0x at Night or Caves', color: '#7c3aed' },
        { id: 'timer-ball', name: 'Timer Ball', desc: 'Scales up to 4.0x with turns', color: '#dc2626' },
        { id: 'repeat-ball', name: 'Repeat Ball', desc: '3.5x if species registered', color: '#f59e0b' },
        { id: 'nest-ball', name: 'Nest Ball', desc: 'Up to 4.0x on lower levels', color: '#10b981' },
        { id: 'dream-ball', name: 'Dream Ball', desc: '4.0x if target is Asleep (SLP)', color: '#ec4899' },
        { id: 'ultra-ball', name: 'Ultra Ball', desc: '2.0x high catch rate', color: '#ca8a04' },
        { id: 'great-ball', name: 'Great Ball', desc: '1.5x moderate catch rate', color: '#2563eb' },
        { id: 'poke-ball', name: 'Poké Ball', desc: '1.0x standard catch rate', color: '#ef4444' },
        { id: 'master-ball', name: 'Master Ball', desc: '100% Guaranteed capture', color: '#9333ea' },
      ];

      for (const ball of allBallMeta) {
        const count = this.ballsInventory[ball.id] ?? 0;
        if (count <= 0) continue;
        renderedCount++;

        const palette = EffectivenessHelper.getPokeballPalette(ball.id);
        const btn = document.createElement('button');
        btn.className = 'battle-bag-ball-btn';
        btn.setAttribute('data-ball-id', ball.id);
        btn.style.cssText = `
          background: #141E33;
          color: white;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: transform 0.1s ease;
        `;

        btn.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 14px; color: ${ball.color};">
              <img src="${palette.spritePath}" alt="${ball.name}" onerror="this.style.display='none'" style="width: 18px; height: 18px; image-rendering: pixelated;" />
              <span>${ball.name}</span>
            </span>
            <span style="font-size: 12px; font-weight: 700; color: #38bdf8; font-family: 'Space Mono', monospace;">x${count}</span>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
            ${ball.desc}
          </div>
        `;

        btn.addEventListener('click', () => {
          this.bagMenu.style.display = 'none';
          this.messageBox.style.display = 'flex';
          if (this.callbacks?.onBagSelected) {
            this.callbacks.onBagSelected(ball.id);
          }
        });

        this.bagMenu.appendChild(btn);
      }
    }

    if (renderedCount === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.style.cssText = `
        grid-column: span 2;
        text-align: center;
        color: #94a3b8;
        padding: 12px;
        font-size: 12px;
        background: #0D1322;
        border: 1.5px dashed #22324F;
        border-radius: 8px;
        box-shadow: 0 2px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
      `;
      emptyBox.innerText = 'No usable items in this category.';
      this.bagMenu.appendChild(emptyBox);
    }

    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
      background: #141E33;
      color: white;
      border: 1.5px solid #22324F;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      padding: 8px;
      cursor: pointer;
      grid-column: span 2;
      box-shadow: 0 3px 0 0 #070B14;
      font-family: 'Space Mono', monospace;
    `;
    backBtn.innerHTML = '<span>← BACK</span> <span class="keyboard-hint">(Esc / X)</span>';
    backBtn.addEventListener('click', () => this.showActionMenu());
    this.bagMenu.appendChild(backBtn);
  }

  /**
   * Renders battle dialogue at a fixed, snappy ~12ms/char with a ~500ms post-delay.
   * Intentionally decoupled from the battle speed multiplier so text stays readable at any battle speed.
   * The dialogue takes the full bottom tray; the action menu is hidden while a message is shown.
   */
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

    this.messageBox.innerText = '';
    for (let i = 1; i <= text.length; i++) {
      this.messageBox.innerText = text.slice(0, i);
      await new Promise((r) => setTimeout(r, BattleHUD.DIALOGUE_CHAR_DELAY_MS));
    }

    return new Promise((resolve) => setTimeout(resolve, BattleHUD.DIALOGUE_POST_DELAY_MS));
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  /**
   * Prompts the player to replace one of 4 known moves with a newly learned move (Ticket 6.4).
   * Returns slot index 0..3 to replace, or null if declined.
   */
  public promptMoveForget(pokemon: PokemonInstance, newMove: MoveData): Promise<number | null> {
    return new Promise((resolve) => {
      const prevMessageDisplay = this.messageBox ? this.messageBox.style.display : 'flex';
      if (this.messageBox) {
        this.messageBox.style.display = 'none';
      }

      const backdrop = document.createElement('div');
      backdrop.id = 'move-learn-backdrop';
      backdrop.className = 'interactive';
      backdrop.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.65);
        pointer-events: auto;
        z-index: 95;
      `;

      backdrop.style.pointerEvents = 'auto';

      const modal = document.createElement('div');
      modal.id = 'move-learn-modal';
      modal.className = 'interactive';
      modal.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 480px;
        max-width: 92vw;
        max-height: 85dvh;
        overflow-y: auto;
        background: #0D1322;
        border: 2px solid #38BDF8;
        border-radius: 12px;
        padding: 18px;
        box-shadow: 0 8px 0 0 #070B14;
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 100;
        pointer-events: auto;
        color: #f8fafc;
        font-family: 'Plus Jakarta Sans', sans-serif;
      `;
      modal.style.pointerEvents = 'auto';

      const newTypeColor = TYPE_COLORS[newMove.type] || '#64748b';
      const newPwr = newMove.power > 0 ? newMove.power : '—';
      const newAcc = newMove.accuracy > 0 ? `${newMove.accuracy}%` : '—';

      modal.innerHTML = `
        <div style="font-weight: 800; font-size: 16px; color: #38bdf8; font-family: 'Space Mono', monospace;">
          ✨ LEARN A NEW MOVE?
        </div>
        <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">
          <strong>${pokemon.nickname}</strong> wants to learn <strong>${newMove.name}</strong>, but already knows 4 moves! Select an existing move to replace, or cancel to keep current moves.
        </div>
        <div style="background: #141E33; border: 1.5px solid ${newTypeColor}; border-radius: 8px; box-shadow: 0 3px 0 0 #070B14; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 10px; font-weight: 800; background: ${newTypeColor}; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${newMove.type.toUpperCase()}</span>
            <strong style="font-size: 14px; color: #f8fafc;">${newMove.name}</strong>
            <span style="font-size: 11px; color: #94a3b8; margin-left: 6px;">[${newMove.category.toUpperCase()}]</span>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #cbd5e1; font-family: 'Space Mono', monospace;">
            PWR: ${newPwr} | ACC: ${newAcc} | PP: ${newMove.pp}
          </div>
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; font-family: 'Space Mono', monospace;">Existing Moves:</div>
        <div id="forget-slots-container" style="display: flex; flex-direction: column; gap: 8px;"></div>
        <button id="cancel-learn-btn" style="
          margin-top: 6px;
          background: #141E33;
          color: #f8fafc;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
        ">✕ Keep Existing Moves (Don't Learn)</button>
      `;

      let resolved = false;
      let cursorIndex = 0; // 0..3 = move slots, 4 = cancel
      const slotButtons: HTMLButtonElement[] = [];

      const cleanupAndResolve = (choice: number | null) => {
        if (resolved) return;
        resolved = true;
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', onKeyDown);
        }
        if ((backdrop as any).remove) {
          backdrop.remove();
        } else if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
        if ((modal as any).remove) {
          modal.remove();
        } else if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        if (this.messageBox) {
          this.messageBox.style.display = prevMessageDisplay || 'flex';
        }
        resolve(choice);
      };

      const slotsContainer = modal.querySelector('#forget-slots-container') as HTMLDivElement;
      pokemon.moves.forEach((slot, idx) => {
        const slotData = PokemonFactory.getMoveData(slot.moveId);
        const slotTypeColor = TYPE_COLORS[slotData.type] || '#64748b';
        const slotPwr = slotData.power > 0 ? slotData.power : '—';
        const slotAcc = slotData.accuracy > 0 ? `${slotData.accuracy}%` : '—';

        const slotBtn = document.createElement('button');
        slotBtn.id = `forget-slot-btn-${idx}`;
        slotBtn.style.cssText = `
          background: #141E33;
          color: white;
          border: 1.5px solid #22324F;
          border-radius: 8px;
          padding: 9px 12px;
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.08s ease;
        `;
        slotBtn.innerHTML = `
          <div>
            <span class="keyboard-hint" style="font-size: 10px; font-weight: 800; color: #94a3b8; margin-right: 4px; font-family: 'Space Mono', monospace;">[${idx + 1}]</span>
            <span style="font-size: 10px; font-weight: 800; background: ${slotTypeColor}; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${slotData.type.toUpperCase()}</span>
            <strong style="font-size: 13px;">Forget ${slotData.name}</strong>
          </div>
          <div style="font-size: 11px; color: #94a3b8; font-weight: 600; font-family: 'Space Mono', monospace;">
            PWR: ${slotPwr} | ACC: ${slotAcc} | PP: ${slot.currentPp}/${slot.maxPp}
          </div>
        `;
        slotBtn.addEventListener('mouseenter', () => {
          cursorIndex = idx;
          slotBtn.style.borderColor = '#ef4444';
          slotBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        });
        slotBtn.addEventListener('mouseleave', () => {
          slotBtn.style.borderColor = '#22324F';
          slotBtn.style.background = '#141E33';
        });
        slotBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(idx);
        });
        slotsContainer.appendChild(slotBtn);
        slotButtons.push(slotBtn);
      });

      const cancelBtn = modal.querySelector('#cancel-learn-btn') as HTMLButtonElement;
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        BattleAudio.playMenuSound('CANCEL');
        cleanupAndResolve(null);
      });

      const onKeyDown = (e: KeyboardEvent) => {
        if (resolved) return;
        if (e.code === 'Digit1' && pokemon.moves[0]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(0);
        } else if (e.code === 'Digit2' && pokemon.moves[1]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(1);
        } else if (e.code === 'Digit3' && pokemon.moves[2]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(2);
        } else if (e.code === 'Digit4' && pokemon.moves[3]) {
          e.preventDefault();
          BattleAudio.playMenuSound('CONFIRM');
          cleanupAndResolve(3);
        } else if (e.code === 'Escape' || e.code === 'KeyX') {
          e.preventDefault();
          BattleAudio.playMenuSound('CANCEL');
          cleanupAndResolve(null);
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          cursorIndex = (cursorIndex + 1) % (slotButtons.length + 1);
        } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          cursorIndex = (cursorIndex - 1 + slotButtons.length + 1) % (slotButtons.length + 1);
        } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
          e.preventDefault();
          if (cursorIndex < slotButtons.length) {
            BattleAudio.playMenuSound('CONFIRM');
            cleanupAndResolve(cursorIndex);
          } else {
            BattleAudio.playMenuSound('CANCEL');
            cleanupAndResolve(null);
          }
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeyDown);
      }

      this.container.appendChild(backdrop);
      this.container.appendChild(modal);
    });
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
