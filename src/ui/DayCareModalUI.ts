import type { PokemonInstance } from '../types/game';
import { DayCareManager, type DayCareSlot } from '../world/DayCareManager';
import { BattleAudio } from '../audio/BattleAudio';

export interface DayCareModalCallbacks {
  onClose: () => void;
  onDeposit: (pokemon: PokemonInstance) => boolean;
  onWithdraw: (slotIndex: 0 | 1) => PokemonInstance | null;
  onCollectEgg: () => PokemonInstance | null;
  getPlayerMoney: () => number;
  getPlayerParty: () => PokemonInstance[];
}

export class DayCareModalUI {
  private container: HTMLElement;
  private modalElement: HTMLDivElement | null = null;
  private active: boolean = false;
  private manager: DayCareManager;
  private callbacks: DayCareModalCallbacks | null = null;
  private selectingDepositSlot: (0 | 1) | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(manager: DayCareManager, containerId: string = 'overworld-hud-container') {
    const el = document.getElementById(containerId) || document.body;
    this.container = el;
    this.manager = manager;
    this.injectStyles();
  }

  public isOpen(): boolean {
    return this.active;
  }

  private injectStyles(): void {
    if (document.getElementById('crystal-daycare-modal-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'crystal-daycare-modal-styles';
    styleEl.textContent = `
      @keyframes eggGlowPulse {
        0% { box-shadow: 0 0 8px rgba(255, 208, 40, 0.4); border-color: #FFD028; }
        100% { box-shadow: 0 0 18px rgba(255, 208, 40, 0.9); border-color: #48C774; }
      }
      @keyframes bioHeartPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
      .daycare-btn-active:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 0 #070B14 !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  public open(callbacks: DayCareModalCallbacks): void {
    this.callbacks = callbacks;
    this.active = true;
    this.selectingDepositSlot = null;
    this.render();
    this.setupKeyboardShortcuts();
  }

  public close(): void {
    this.active = false;
    this.selectingDepositSlot = null;
    if (this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (this.callbacks?.onClose) {
      this.callbacks.onClose();
    }
  }

  private setupKeyboardShortcuts(): void {
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (!this.active) return;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'x') {
        e.stopPropagation();
        e.preventDefault();
        if (this.selectingDepositSlot !== null) {
          this.selectingDepositSlot = null;
          this.render();
        } else {
          this.close();
        }
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  public render(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (!this.active) return;

    const overlay = document.createElement('div');
    overlay.id = 'daycare-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(7, 11, 20, 0.82);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      font-family: 'Space Mono', monospace;
      padding: env(safe-area-inset-top, 12px) env(safe-area-inset-right, 12px) env(safe-area-inset-bottom, 12px) env(safe-area-inset-left, 12px);
      box-sizing: border-box;
    `;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const card = document.createElement('div');
    card.id = 'daycare-modal-container';
    card.style.cssText = isMobile
      ? `
        width: 100vw;
        height: 100dvh;
        max-height: 100dvh;
        background: #0D1322;
        padding: 16px 16px calc(env(safe-area-inset-bottom, 16px) + 16px);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        gap: 12px;
        color: #F6F8F3;
      `
      : `
        width: min(720px, 92vw);
        max-height: 88vh;
        background: #0D1322;
        border: 2px solid #2A3A5E;
        box-shadow: 0 12px 0 0 #070B14;
        border-radius: 4px;
        padding: 24px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        gap: 18px;
        color: #F6F8F3;
      `;

    // 1. Header Bar
    const playerMoney = this.callbacks?.getPlayerMoney() ?? 0;
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #2A3A5E;
      padding-bottom: 12px;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">🏡</span>
        <div>
          <div style="font-weight: 700; font-size: ${isMobile ? '14px' : '16px'}; letter-spacing: 0.08em; color: #F6F8F3;">DAY-CARE NURSERY</div>
          <div style="font-size: 11px; color: #8A9DBF; font-family: 'Plus Jakarta Sans', sans-serif;">ROUTE 34 // BREEDING MATRIX</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="background: #141E33; border: 1px solid #2A3A5E; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 700; color: #FFD028;">
          ₽ ${playerMoney.toLocaleString()}
        </div>
        <button id="daycare-close-btn" class="daycare-btn-active" style="
          background: #EE4238;
          color: white;
          border: 1px solid #070B14;
          box-shadow: 0 3px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 12px;
          padding: 6px 12px;
          cursor: pointer;
          min-height: 44px;
        ">✕ CLOSE</button>
      </div>
    `;
    header.querySelector('#daycare-close-btn')?.addEventListener('click', () => this.close());
    card.appendChild(header);

    // If currently selecting a party member to deposit
    if (this.selectingDepositSlot !== null) {
      card.appendChild(this.buildPartySelectorView(this.selectingDepositSlot));
      overlay.appendChild(card);
      this.container.appendChild(overlay);
      this.modalElement = overlay;
      return;
    }

    // 2. Egg Alert Banner (If ready)
    if (this.manager.isEggReady()) {
      const eggBanner = document.createElement('div');
      eggBanner.id = 'daycare-egg-alert';
      eggBanner.className = 'daycare-egg-alert';
      eggBanner.style.cssText = `
        background: linear-gradient(135deg, rgba(255, 208, 40, 0.16), rgba(20, 30, 51, 0.95));
        border: 2px solid #FFD028;
        box-shadow: 0 4px 0 0 #070B14;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        animation: eggGlowPulse 2s ease-in-out infinite alternate;
      `;

      const party = this.callbacks?.getPlayerParty() ?? [];
      const partyFull = party.length >= 6;

      eggBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="./assets/sprites/pokemon/icons/egg.png" alt="EGG" onerror="this.onerror=null; this.src='./assets/sprites/pokemon/egg_front.png';" style="width: 32px; height: 32px; image-rendering: pixelated;" />
          <div>
            <div style="font-weight: 700; font-size: 13px; color: #FFD028;">AN EGG WAS DISCOVERED IN THE MEADOW!</div>
            <div style="font-size: 11px; color: #F6F8F3; font-family: 'Plus Jakarta Sans', sans-serif;">
              ${partyFull ? 'Party is full (6/6). Make room to collect the Egg.' : 'The Day-Care Man has an Egg waiting for you!'}
            </div>
          </div>
        </div>
        <button id="daycare-collect-egg-btn" class="daycare-btn-active" ${partyFull ? 'disabled' : ''} style="
          background: ${partyFull ? '#475569' : '#48C774'};
          color: #070B14;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 12px;
          border: 1px solid #070B14;
          box-shadow: 0 3px 0 0 #070B14;
          padding: 8px 14px;
          cursor: ${partyFull ? 'not-allowed' : 'pointer'};
          opacity: ${partyFull ? '0.6' : '1'};
          min-height: 44px;
        ">🥚 COLLECT EGG</button>
      `;

      eggBanner.querySelector('#daycare-collect-egg-btn')?.addEventListener('click', () => {
        if (partyFull) return;
        const egg = this.callbacks?.onCollectEgg();
        if (egg) {
          BattleAudio.playOverworldSound('KEY_ITEM');
          this.render();
        }
      });
      card.appendChild(eggBanner);
    }

    // 3. Deposit Bays Grid (Slot 1 & Slot 2)
    const baysContainer = document.createElement('div');
    baysContainer.id = 'daycare-bays-grid';
    baysContainer.style.cssText = isMobile
      ? `display: flex; flex-direction: column; gap: 12px;`
      : `display: grid; grid-template-columns: 1fr 1fr; gap: 16px;`;

    baysContainer.appendChild(this.buildBayCard(0, this.manager.getSlot(0), playerMoney));
    baysContainer.appendChild(this.buildBayCard(1, this.manager.getSlot(1), playerMoney));
    card.appendChild(baysContainer);

    // 4. Breeding Compatibility Telemetry Banner (when both occupied)
    const compat = this.manager.getCompatibility();
    if (compat) {
      const compatBox = document.createElement('div');
      compatBox.id = 'daycare-compatibility-banner';
      compatBox.style.cssText = `
        background: #141E33;
        border: 1px solid #2A3A5E;
        box-shadow: 0 4px 0 0 #070B14;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-left: 4px solid ${compat.color};
      `;
      const heartIcon = compat.tier >= 2 ? '💖' : compat.tier === 1 ? '💛' : '💔';
      compatBox.innerHTML = `
        <span style="font-size: 20px; animation: bioHeartPulse 1.5s infinite ease-in-out;">${heartIcon}</span>
        <div style="flex: 1;">
          <div style="font-size: 10px; color: #8A9DBF; font-weight: 700; letter-spacing: 0.05em;">COMPATIBILITY TELEMETRY (TIER ${compat.tier})</div>
          <div style="font-size: 13px; font-weight: 700; color: ${compat.color}; font-family: 'Plus Jakarta Sans', sans-serif;">
            "${compat.message}"
          </div>
        </div>
      `;
      card.appendChild(compatBox);
    }

    // 5. Footer info
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #8A9DBF;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin-top: auto;
      padding-top: 8px;
    `;
    footer.innerHTML = `
      <span>Rate: ₽ 100 base + ₽ 100 / level gained.</span>
      <span style="font-family: 'Space Mono', monospace;">[ESC] / [B] to return</span>
    `;
    card.appendChild(footer);

    overlay.appendChild(card);
    this.container.appendChild(overlay);
    this.modalElement = overlay;
  }

  private buildBayCard(slotIndex: 0 | 1, slot: DayCareSlot | null, playerMoney: number): HTMLElement {
    const bay = document.createElement('div');
    bay.id = `daycare-slot-${slotIndex}`;

    if (!slot) {
      // Empty Bay
      bay.style.cssText = `
        border: 2px dashed #2A3A5E;
        background: rgba(20, 30, 51, 0.4);
        border-radius: 4px;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 180px;
        box-sizing: border-box;
      `;
      bay.innerHTML = `
        <div style="font-size: 28px; opacity: 0.4;">🔘</div>
        <div style="font-size: 12px; color: #8A9DBF; font-weight: 700;">SLOT 0${slotIndex + 1}: VACANT</div>
        <button id="daycare-deposit-slot-${slotIndex}-btn" class="daycare-btn-active" style="
          background: #141E33;
          border: 1px solid #2A3A5E;
          box-shadow: 0 3px 0 0 #070B14;
          color: #FFD028;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 12px;
          padding: 8px 16px;
          cursor: pointer;
          min-height: 44px;
        ">+ DEPOSIT POKÉMON</button>
      `;
      bay.querySelector(`#daycare-deposit-slot-${slotIndex}-btn`)?.addEventListener('click', () => {
        this.selectingDepositSlot = slotIndex;
        this.render();
      });
      return bay;
    }

    // Occupied Bay
    const fee = DayCareManager.calculateFee(slot);
    const levelDelta = Math.max(0, slot.pokemon.level - slot.depositLevel);
    const canAfford = playerMoney >= fee;
    const party = this.callbacks?.getPlayerParty() ?? [];
    const partyFull = party.length >= 6;

    bay.style.cssText = `
      border: 1px solid #2A3A5E;
      background: #141E33;
      box-shadow: 0 4px 0 0 #070B14;
      border-radius: 4px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-sizing: border-box;
    `;

    bay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(42, 58, 94, 0.4); padding-bottom: 6px;">
        <span style="font-size: 11px; font-weight: 700; color: #8A9DBF;">SLOT 0${slotIndex + 1}</span>
        <span style="font-size: 11px; font-weight: 700; background: #2A3A5E; padding: 2px 6px; border-radius: 3px; color: #FFD028;">LV. ${slot.pokemon.level}</span>
      </div>

      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 64px; height: 64px; background: rgba(7, 11, 20, 0.5); border: 1px solid #2A3A5E; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <img src="./assets/sprites/pokemon/${slot.pokemon.speciesId}_front.png"
               alt="${slot.pokemon.nickname}"
               onerror="this.onerror=null; this.src='./assets/sprites/pokemon/icons/egg.png';"
               style="width: 56px; height: 56px; image-rendering: pixelated; object-fit: contain;" />
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; font-size: 14px; color: #F6F8F3; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${slot.pokemon.nickname}
          </div>
          <div style="font-size: 11px; color: #8A9DBF; text-transform: uppercase;">
            ${slot.pokemon.speciesId}
          </div>
          <div style="font-size: 11px; margin-top: 4px; color: #F6F8F3; font-family: 'Plus Jakarta Sans', sans-serif;">
            Initial: Lv.${slot.depositLevel} ➔ <span style="color: #48C774; font-weight: 700;">Lv.${slot.pokemon.level}</span>
            ${levelDelta > 0 ? `<span style="color: #48C774; font-weight: 700;">(+${levelDelta})</span>` : ''}
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(7, 11, 20, 0.4); border: 1px solid #2A3A5E; border-radius: 4px; padding: 6px 10px; margin-top: 4px;">
        <span style="font-size: 11px; color: #8A9DBF;">RETRIEVAL FEE:</span>
        <span style="font-size: 13px; font-weight: 700; color: ${canAfford ? '#FFD028' : '#EE4238'};">₽ ${fee.toLocaleString()}</span>
      </div>

      <button id="daycare-withdraw-slot-${slotIndex}-btn" class="daycare-btn-active" ${!canAfford || partyFull ? 'disabled' : ''} style="
        background: ${!canAfford || partyFull ? '#475569' : '#FFD028'};
        color: #070B14;
        border: 1px solid #070B14;
        box-shadow: 0 3px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        font-size: 12px;
        padding: 8px 14px;
        cursor: ${!canAfford || partyFull ? 'not-allowed' : 'pointer'};
        opacity: ${!canAfford || partyFull ? '0.6' : '1'};
        margin-top: 4px;
        min-height: 44px;
      ">
        ${partyFull ? 'PARTY FULL (6/6)' : !canAfford ? 'INSUFFICIENT FUNDS' : 'WITHDRAW POKÉMON'}
      </button>
    `;

    bay.querySelector(`#daycare-withdraw-slot-${slotIndex}-btn`)?.addEventListener('click', () => {
      if (!canAfford || partyFull) return;
      const withdrawn = this.callbacks?.onWithdraw(slotIndex);
      if (withdrawn) {
        BattleAudio.playOverworldSound('KEY_ITEM');
        this.render();
      }
    });

    return bay;
  }

  private buildPartySelectorView(slotIndex: 0 | 1): HTMLElement {
    const wrap = document.createElement('div');
    wrap.id = 'daycare-party-selector-view';
    wrap.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    `;

    const party = this.callbacks?.getPlayerParty() ?? [];
    const validParty = party.filter((p) => !p.isEgg);

    wrap.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; font-size: 13px; color: #FFD028;">SELECT A POKÉMON TO DEPOSIT (SLOT 0${slotIndex + 1})</span>
        <button id="daycare-cancel-select-btn" class="daycare-btn-active" style="
          background: #334155;
          color: white;
          border: 1px solid #070B14;
          box-shadow: 0 2px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 11px;
          padding: 4px 10px;
          cursor: pointer;
        ">← BACK</button>
      </div>
      <div id="daycare-party-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto;"></div>
    `;

    wrap.querySelector('#daycare-cancel-select-btn')?.addEventListener('click', () => {
      this.selectingDepositSlot = null;
      this.render();
    });

    const list = wrap.querySelector('#daycare-party-list') as HTMLDivElement;
    if (validParty.length <= 1) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.cssText = `
        padding: 24px;
        text-align: center;
        color: #8A9DBF;
        font-family: 'Plus Jakarta Sans', sans-serif;
      `;
      emptyMsg.innerText = "You cannot deposit your last conscious Pokémon!";
      list.appendChild(emptyMsg);
      return wrap;
    }

    for (let i = 0; i < party.length; i++) {
      const p = party[i];
      if (p.isEgg) continue;

      const item = document.createElement('button');
      item.className = 'daycare-party-pick-btn daycare-btn-active';
      item.style.cssText = `
        background: #141E33;
        border: 1px solid #2A3A5E;
        box-shadow: 0 3px 0 0 #070B14;
        border-radius: 4px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        color: #F6F8F3;
        font-family: 'Space Mono', monospace;
        min-height: 44px;
      `;

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="./assets/sprites/pokemon/${p.speciesId}_front.png"
               alt="${p.nickname}"
               onerror="this.onerror=null; this.src='./assets/sprites/pokemon/icons/egg.png';"
               style="width: 36px; height: 36px; image-rendering: pixelated; object-fit: contain;" />
          <div style="text-align: left;">
            <div style="font-weight: 700; font-size: 13px;">${p.nickname}</div>
            <div style="font-size: 11px; color: #8A9DBF;">Lv. ${p.level} • HP ${p.currentHp}/${p.stats.hp}</div>
          </div>
        </div>
        <span style="color: #FFD028; font-weight: 700; font-size: 12px;">DEPOSIT ➔</span>
      `;

      item.addEventListener('click', () => {
        const success = this.callbacks?.onDeposit(p);
        if (success) {
          BattleAudio.playOverworldSound('KEY_ITEM');
          this.selectingDepositSlot = null;
          this.render();
        }
      });
      list.appendChild(item);
    }

    return wrap;
  }
}
