import type { PokemonInstance, SpeedMultiplier, PokeballId } from '../types/game';
import { EffectivenessHelper } from '../battle/EffectivenessHelper';
import { PokemonFactory } from '../battle/PokemonFactory';

export interface BattleHUDCallbacks {
  onMoveSelected: (moveId: string) => void;
  onBagSelected: (ballId: PokeballId) => void;
  onRunSelected: () => void;
  onSpeedToggle: () => SpeedMultiplier;
}

export class BattleHUD {
  private container: HTMLElement;
  private rootElement!: HTMLDivElement;
  private messageBox!: HTMLDivElement;
  private actionMenu!: HTMLDivElement;
  private fightMenu!: HTMLDivElement;
  private bagMenu!: HTMLDivElement;
  private playerHpBar!: HTMLDivElement;
  private enemyHpBar!: HTMLDivElement;
  private playerHpText!: HTMLSpanElement;
  private enemyHpText!: HTMLSpanElement;
  private speedButton!: HTMLButtonElement;

  private playerPokemon!: PokemonInstance;
  private enemyPokemon!: PokemonInstance;
  private callbacks!: BattleHUDCallbacks;
  private speedMultiplier: SpeedMultiplier = 1;

  constructor(containerId: string = 'ui-overlay') {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`HUD Container #${containerId} not found in DOM`);
    }
    this.container = el;
    this.createUI();
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
      padding: 20px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    root.innerHTML = `
      <!-- Top Area: Enemy Info & Speed Toggle -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <div id="enemy-card" style="
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 12px 20px;
          min-width: 260px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        ">
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px;">
            <span id="enemy-name">Wild Pidgey</span>
            <span id="enemy-level" style="color: #94a3b8; font-size: 14px;">Lv. 3</span>
          </div>
          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8; font-weight: 600;">
              <span>HP</span>
              <span id="enemy-hp-text">16 / 16</span>
            </div>
            <div style="width: 100%; height: 8px; background: #334155; border-radius: 4px; overflow: hidden;">
              <div id="enemy-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>

        <div style="pointer-events: auto;">
          <button id="battle-speed-btn" style="
            background: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
          ">
            BATTLE: 1x (Shift)
          </button>
        </div>
      </div>

      <!-- Mid-Lower Area: Player Info -->
      <div style="display: flex; justify-content: flex-end; width: 100%; margin-bottom: 10px;">
        <div id="player-card" style="
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 12px 20px;
          min-width: 280px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        ">
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px;">
            <span id="player-name">Cyndaquil</span>
            <span id="player-level" style="color: #94a3b8; font-size: 14px;">Lv. 5</span>
          </div>
          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #94a3b8; font-weight: 600;">
              <span>HP</span>
              <span id="player-hp-text">20 / 20</span>
            </div>
            <div style="width: 100%; height: 8px; background: #334155; border-radius: 4px; overflow: hidden;">
              <div id="player-hp-bar" style="width: 100%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Control & Dialogue Panel -->
      <div style="
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.6);
        pointer-events: auto;
        min-height: 120px;
        display: flex;
        gap: 20px;
      ">
        <!-- Dialogue Text -->
        <div id="battle-message-box" style="
          flex: 1;
          font-size: 18px;
          font-weight: 600;
          color: #f8fafc;
          line-height: 1.5;
          display: flex;
          align-items: center;
        ">
          What will Cyndaquil do?
        </div>

        <!-- Main Action Menu (FIGHT / BAG / POKEMON / RUN) -->
        <div id="battle-action-menu" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 280px;
        ">
          <button id="btn-fight" style="
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            padding: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
          ">FIGHT</button>
          <button id="btn-bag" style="
            background: #d97706;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            padding: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
          ">BAG</button>
          <button id="btn-pokemon" style="
            background: #16a34a;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            padding: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4);
          ">POKÉMON</button>
          <button id="btn-run" style="
            background: #475569;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            padding: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(71, 85, 105, 0.4);
          ">RUN</button>
        </div>

        <!-- Fight Submenu (Unbound Move Buttons) -->
        <div id="battle-fight-menu" style="
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 2;
        "></div>

        <!-- Bag Submenu (Pokéballs) -->
        <div id="battle-bag-menu" style="
          display: none;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 2;
          max-height: 140px;
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
    this.playerHpBar = root.querySelector('#player-hp-bar') as HTMLDivElement;
    this.enemyHpBar = root.querySelector('#enemy-hp-bar') as HTMLDivElement;
    this.playerHpText = root.querySelector('#player-hp-text') as HTMLSpanElement;
    this.enemyHpText = root.querySelector('#enemy-hp-text') as HTMLSpanElement;
    this.speedButton = root.querySelector('#battle-speed-btn') as HTMLButtonElement;

    // Button event listeners
    this.speedButton.addEventListener('click', () => {
      if (this.callbacks?.onSpeedToggle) {
        const nextSpeed = this.callbacks.onSpeedToggle();
        this.updateSpeedDisplay(nextSpeed);
      }
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
      this.showMessage(`${this.playerPokemon.nickname} is ready for battle!`);
    });
  }

  public initBattle(
    playerPokemon: PokemonInstance,
    enemyPokemon: PokemonInstance,
    callbacks: BattleHUDCallbacks
  ): void {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.callbacks = callbacks;
    this.rootElement.style.display = 'flex';

    // Populate Player Card
    (this.rootElement.querySelector('#player-name') as HTMLElement).innerText = playerPokemon.nickname;
    (this.rootElement.querySelector('#player-level') as HTMLElement).innerText = `Lv. ${playerPokemon.level}`;
    this.updateHp(true, playerPokemon.currentHp, playerPokemon.stats.hp);

    // Populate Enemy Card
    (this.rootElement.querySelector('#enemy-name') as HTMLElement).innerText = enemyPokemon.nickname;
    (this.rootElement.querySelector('#enemy-level') as HTMLElement).innerText = `Lv. ${enemyPokemon.level}`;
    this.updateHp(false, enemyPokemon.currentHp, enemyPokemon.stats.hp);

    this.showActionMenu();
    this.showMessage(`What will ${playerPokemon.nickname} do?`);
  }

  public updateSpeedDisplay(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
    if (this.speedButton) {
      this.speedButton.innerText = `BATTLE: ${speed}x (Shift)`;
      if (speed === 1) this.speedButton.style.background = '#2563eb';
      else if (speed === 2) this.speedButton.style.background = '#d97706';
      else this.speedButton.style.background = '#dc2626';
    }
  }

  public updateHp(isPlayer: boolean, currentHp: number, maxHp: number): void {
    const bar = isPlayer ? this.playerHpBar : this.enemyHpBar;
    const text = isPlayer ? this.playerHpText : this.enemyHpText;
    const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

    bar.style.width = `${pct}%`;
    text.innerText = `${currentHp} / ${maxHp}`;

    if (pct > 50) bar.style.background = '#22c55e'; // Green
    else if (pct > 20) bar.style.background = '#eab308'; // Yellow
    else bar.style.background = '#ef4444'; // Red
  }

  public showFightMenu(): void {
    this.actionMenu.style.display = 'none';
    this.fightMenu.style.display = 'grid';
    this.fightMenu.innerHTML = '';

    // Render Unbound Move Buttons
    for (const moveSlot of this.playerPokemon.moves) {
      const moveData = PokemonFactory.getMoveData(moveSlot.moveId);
      const badge = EffectivenessHelper.evaluate(moveData, this.enemyPokemon);

      const btn = document.createElement('button');
      btn.style.cssText = `
        background: #1e293b;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        transition: transform 0.1s ease, background 0.15s ease;
      `;

      // Badge color styling
      let badgeBg = '#64748b'; // normal
      let badgeGlow = 'none';
      if (badge.multiplier === 4) {
        badgeBg = '#059669';
        badgeGlow = '0 0 8px rgba(5, 150, 105, 0.8)';
      } else if (badge.multiplier === 2) {
        badgeBg = '#16a34a';
      } else if (badge.multiplier === 0.5 || badge.multiplier === 0.25) {
        badgeBg = '#d97706';
      } else if (badge.multiplier === 0) {
        badgeBg = '#dc2626';
      }

      // Split Category Icon indicator
      const categoryIcon =
        moveData.category === 'Physical' ? '💥' : moveData.category === 'Special' ? '🌀' : '🛡️';

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="font-weight: 700; font-size: 15px;">${moveData.name}</span>
          <span style="font-size: 12px;">${categoryIcon}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 6px;">
          <span style="font-size: 11px; font-weight: 600; color: #94a3b8;">${moveData.type.toUpperCase()} | PP ${moveSlot.currentPp}/${moveSlot.maxPp}</span>
          <span style="
            background: ${badgeBg};
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 4px;
            box-shadow: ${badgeGlow};
          ">${badge.label}</span>
        </div>
      `;

      btn.addEventListener('click', () => {
        if (this.callbacks?.onMoveSelected) {
          this.callbacks.onMoveSelected(moveData.id);
        }
      });

      this.fightMenu.appendChild(btn);
    }
  }

  public showActionMenu(): void {
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'none';
    this.actionMenu.style.display = 'grid';
  }

  public showBagMenu(): void {
    this.actionMenu.style.display = 'none';
    this.fightMenu.style.display = 'none';
    this.bagMenu.style.display = 'grid';
    this.bagMenu.innerHTML = '';

    const balls: Array<{ id: PokeballId; name: string; desc: string; count: number; color: string }> = [
      { id: 'quick-ball', name: 'Quick Ball', desc: '5x catch rate on Turn 1', count: 5, color: '#0284c7' },
      { id: 'fast-ball', name: 'Fast Ball', desc: '4x if Base Speed >= 100', count: 5, color: '#ea580c' },
      { id: 'net-ball', name: 'Net Ball', desc: '3.5x if Water or Bug', count: 5, color: '#059669' },
      { id: 'ultra-ball', name: 'Ultra Ball', desc: '2x high catch rate', count: 10, color: '#ca8a04' },
      { id: 'great-ball', name: 'Great Ball', desc: '1.5x moderate catch rate', count: 15, color: '#2563eb' },
      { id: 'poke-ball', name: 'Poké Ball', desc: '1x standard catch rate', count: 30, color: '#dc2626' },
      { id: 'master-ball', name: 'Master Ball', desc: '100% Guaranteed capture', count: 1, color: '#7c3aed' },
    ];

    for (const ball of balls) {
      const btn = document.createElement('button');
      btn.style.cssText = `
        background: #1e293b;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: left;
        transition: transform 0.1s ease;
      `;

      btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="font-weight: 700; font-size: 14px; color: ${ball.color};">🔴 ${ball.name}</span>
          <span style="font-size: 12px; font-weight: 700; color: #94a3b8;">x${ball.count}</span>
        </div>
        <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
          ${ball.desc}
        </div>
      `;

      btn.addEventListener('click', () => {
        if (this.callbacks?.onBagSelected) {
          this.callbacks.onBagSelected(ball.id);
        }
      });

      this.bagMenu.appendChild(btn);
    }

    // Back button
    const backBtn = document.createElement('button');
    backBtn.style.cssText = `
      background: #334155;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      padding: 8px;
      cursor: pointer;
    `;
    backBtn.innerText = '← BACK';
    backBtn.addEventListener('click', () => this.showActionMenu());
    this.bagMenu.appendChild(backBtn);
  }

  public async showMessage(text: string): Promise<void> {
    this.messageBox.innerText = text;
    // Delay based on battle speed
    const baseDelay = 1200;
    const dur = baseDelay / this.speedMultiplier;
    return new Promise((resolve) => setTimeout(resolve, dur));
  }

  public hide(): void {
    this.rootElement.style.display = 'none';
  }
}
