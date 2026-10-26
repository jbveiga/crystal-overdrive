export interface BattleLogEntry {
  id: string;
  turn?: number;
  type: 'turn' | 'move' | 'damage' | 'status' | 'stat' | 'faint' | 'info';
  text: string;
  timestamp: string;
}

export class BattleLogUI {
  private parentContainer: HTMLElement;
  private rootElement!: HTMLDivElement;
  private toggleButton!: HTMLButtonElement;
  private countBadge!: HTMLSpanElement;
  private logPanel!: HTMLDivElement;
  private logList!: HTMLDivElement;
  private entries: BattleLogEntry[] = [];
  private currentTurn: number = 0;
  private isOpen: boolean = false;

  constructor(parentContainer: HTMLElement) {
    this.parentContainer = parentContainer;
    this.createUI();
  }

  private injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById?.('crystal-battle-log-styles')) return;
    const style = document.createElement('style');
    style.id = 'crystal-battle-log-styles';
    style.textContent = `
      .hidden { display: none !important; }
      .battle-log-panel {
        display: none;
      }
      .battle-log-panel:not(.hidden) {
        display: flex;
      }
    `;
    (document.head || document.body)?.appendChild(style);
  }

  private createUI(): void {
    this.injectStyles();

    // 1. Root wrapper inside battle HUD container
    this.rootElement = document.createElement('div');
    this.rootElement.className = 'battle-log-root';
    this.rootElement.style.cssText =
      'position: relative; display: flex; flex-direction: column; align-items: flex-end; pointer-events: auto; margin-top: 4px; z-index: 30;';

    // 2. Toggle button & badge
    this.toggleButton = document.createElement('button');
    this.toggleButton.type = 'button';
    this.toggleButton.className = 'battle-log-toggle-btn';
    this.toggleButton.style.cssText =
      'padding: 6px 12px; background: #0D1322; color: #F8FAFC; border: 2px solid #38BDF8; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 0 0 #070B14; font-family: \'Space Mono\', monospace; pointer-events: auto;';

    const iconSpan = document.createElement('span');
    iconSpan.textContent = '📜';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = 'LOG';

    this.countBadge = document.createElement('span');
    this.countBadge.className = 'battle-log-count';
    this.countBadge.style.cssText =
      'font-size: 10px; background: rgba(56, 189, 248, 0.18); border: 1px solid #38BDF8; padding: 1px 6px; border-radius: 4px; color: #38BDF8; font-family: \'Space Mono\', monospace; font-weight: 700;';
    this.countBadge.textContent = '0';

    this.toggleButton.appendChild(iconSpan);
    this.toggleButton.appendChild(labelSpan);
    this.toggleButton.appendChild(this.countBadge);
    this.toggleButton.addEventListener('click', () => this.toggle());

    // 3. Log panel container (strictly hidden by default)
    this.logPanel = document.createElement('div');
    this.logPanel.className = 'battle-log-panel hidden';
    this.logPanel.style.cssText =
      'display: none; position: absolute; right: 0; top: 100%; margin-top: 6px; z-index: 60; width: min(340px, calc(100vw - 28px)); max-width: calc(100vw - 28px); max-height: min(320px, 55vh); background: rgba(13, 19, 34, 0.96); border: 2px solid #38BDF8; border-radius: 10px; box-shadow: 0 6px 0 0 #070B14; font-family: \'Plus Jakarta Sans\', sans-serif; color: #F8FAFC; overflow: hidden; pointer-events: auto;';
    this.logPanel.style.display = 'none';

    // 4. Panel Header
    const panelHeader = document.createElement('div');
    panelHeader.style.cssText =
      'padding: 10px 14px; background: #0D1322; border-bottom: 1.5px solid #22324F; display: flex; align-items: center; justify-content: space-between; font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; flex-shrink: 0; font-family: \'Space Mono\', monospace;';
    panelHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 14px;">📜</span>
        <span style="font-weight: 800; color: #38BDF8;">BATTLE LOG</span>
      </div>
      <button type="button" class="battle-log-close-btn" style="background: #141E33; border: 1.5px solid #22324F; border-radius: 6px; color: #CBD5E1; padding: 2px 8px; font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 2px 0 0 #070B14; font-family: 'Space Mono', monospace;" aria-label="Close log">✕</button>
    `;
    panelHeader.querySelector('.battle-log-close-btn')?.addEventListener('click', () => this.close());

    // 5. Scrollable Log List
    this.logList = document.createElement('div');
    this.logList.className = 'battle-log-list';
    this.logList.style.cssText =
      'overflow-y: auto; max-height: calc(min(320px, 55vh) - 44px); -webkit-overflow-scrolling: touch; font-size: 12px; line-height: 1.6; color: #f1f5f9; padding: 10px 12px; font-family: \'Plus Jakarta Sans\', sans-serif;';

    this.logPanel.appendChild(panelHeader);
    this.logPanel.appendChild(this.logList);

    this.rootElement.appendChild(this.toggleButton);
    this.rootElement.appendChild(this.logPanel);

    this.parentContainer.appendChild(this.rootElement);
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    this.isOpen = true;
    this.logPanel.classList.remove('hidden');
    this.logPanel.style.display = 'flex';
    this.toggleButton.classList.add('bg-sky-900/90', 'border-sky-400');
    this.scrollToBottom();
  }

  public close(): void {
    this.isOpen = false;
    this.logPanel.classList.add('hidden');
    this.logPanel.style.display = 'none';
    this.toggleButton.classList.remove('bg-sky-900/90', 'border-sky-400');
  }

  public isExpanded(): boolean {
    return this.isOpen;
  }

  public hideRoot(): void {
    if (this.rootElement) {
      this.rootElement.classList?.add('hidden');
      this.rootElement.style.display = 'none';
    }
  }

  public showRoot(): void {
    if (this.rootElement) {
      this.rootElement.classList?.remove('hidden');
      this.rootElement.style.display = 'flex';
    }
  }

  public clear(): void {
    this.entries = [];
    this.currentTurn = 0;
    this.logList.innerHTML = '';
    this.updateCountBadge();
  }

  public startTurn(turnNumber: number): void {
    this.currentTurn = turnNumber;
    this.addEntry('turn', `--- TURN ${turnNumber} ---`);
  }

  public addEntry(type: BattleLogEntry['type'], text: string, turn?: number): void {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const entry: BattleLogEntry = {
      id,
      turn: turn ?? this.currentTurn,
      type,
      text,
      timestamp,
    };

    this.entries.push(entry);
    this.renderEntry(entry);
    this.updateCountBadge();
    this.scrollToBottom();
  }

  private renderEntry(entry: BattleLogEntry): void {
    const item = document.createElement('div');
    item.className = 'battle-log-item';

    if (entry.type === 'turn') {
      item.style.cssText =
        'border-top: 1px solid rgba(56, 189, 248, 0.25); padding-top: 6px; margin-top: 4px; text-align: center; font-family: \'Space Mono\', monospace; font-size: 10px; font-weight: 700; color: #38BDF8; letter-spacing: 1.5px;';
      item.innerHTML = `<span>⚔️ TURN ${entry.turn || ''}</span>`;
      this.logList.appendChild(item);
      return;
    }

    let color = '#CBD5E1';
    let icon = '•';

    switch (entry.type) {
      case 'move':
        color = '#38BDF8';
        icon = '💥';
        break;

      case 'damage':
        if (entry.text.includes('super effective') || entry.text.includes('CRITICAL')) {
          color = '#FBBF24';
          icon = '⚡';
        } else {
          color = '#F87171';
          icon = '🩸';
        }
        break;

      case 'status':
        color = '#C084FC';
        icon = '✨';
        break;

      case 'stat':
        color = '#34D399';
        icon = '📊';
        break;

      case 'faint':
        color = '#94A3B8';
        icon = '💀';
        break;

      case 'info':
      default:
        color = '#CBD5E1';
        icon = 'ℹ️';
        break;
    }

    item.style.cssText = `display: flex; align-items: flex-start; gap: 6px; color: ${color}; font-size: 11.5px; line-height: 1.5; font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 4px;`;
    item.innerHTML = `
      <span style="font-size: 10px; opacity: 0.8; flex-shrink: 0; user-select: none;">${icon}</span>
      <span style="word-break: break-word; flex: 1;">${this.escapeHtml(entry.text)}</span>
    `;

    this.logList.appendChild(item);
  }

  private updateCountBadge(): void {
    if (this.countBadge) {
      const nonTurnEntries = this.entries.filter((e) => e.type !== 'turn').length;
      this.countBadge.textContent = nonTurnEntries.toString();
    } else {
      const badge = this.toggleButton?.querySelector('.battle-log-count');
      if (badge) {
        const nonTurnEntries = this.entries.filter((e) => e.type !== 'turn').length;
        badge.textContent = nonTurnEntries.toString();
      }
    }
  }

  private scrollToBottom(): void {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        if (this.logList) this.logList.scrollTop = this.logList.scrollHeight;
      });
    } else if (this.logList) {
      this.logList.scrollTop = this.logList.scrollHeight;
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public getEntries(): readonly BattleLogEntry[] {
    return this.entries;
  }
}
