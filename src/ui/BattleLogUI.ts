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
    this.rootElement.className = 'battle-log-root z-30 flex flex-col items-end pointer-events-auto';
    this.rootElement.style.cssText =
      'position: relative; display: flex; flex-direction: column; align-items: flex-end; pointer-events: auto; margin-top: 4px; z-index: 30;';

    // 2. Toggle button & badge
    this.toggleButton = document.createElement('button');
    this.toggleButton.type = 'button';
    this.toggleButton.className =
      'battle-log-toggle-btn px-3 py-1.5 bg-slate-900/85 hover:bg-slate-800 text-sky-300 hover:text-white border border-sky-500/40 hover:border-sky-400 rounded-lg text-xs font-semibold tracking-wide shadow-md transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md';
    this.toggleButton.style.cssText =
      'padding: 6px 12px; background: rgba(15, 23, 42, 0.92); color: #7dd3fc; border: 1.5px solid rgba(56, 189, 248, 0.45); border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.4px; display: flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);';

    const iconSpan = document.createElement('span');
    iconSpan.textContent = '📜';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = 'LOG';

    this.countBadge = document.createElement('span');
    this.countBadge.className = 'battle-log-count text-[10px] bg-sky-950 px-1.5 py-0.5 rounded text-sky-400 font-mono';
    this.countBadge.style.cssText =
      'font-size: 10px; background: #082f49; padding: 1px 6px; border-radius: 999px; color: #38bdf8; font-family: monospace;';
    this.countBadge.textContent = '0';

    this.toggleButton.appendChild(iconSpan);
    this.toggleButton.appendChild(labelSpan);
    this.toggleButton.appendChild(this.countBadge);
    this.toggleButton.addEventListener('click', () => this.toggle());

    // 3. Log panel container (strictly hidden by default)
    this.logPanel = document.createElement('div');
    this.logPanel.className =
      'battle-log-panel hidden mt-2 bg-slate-950/95 border border-sky-400/50 rounded-xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-slate-100 transition-all duration-200';
    this.logPanel.style.cssText =
      'display: none; position: absolute; right: 0; top: 100%; margin-top: 6px; z-index: 60; width: min(340px, calc(100vw - 28px)); max-width: calc(100vw - 28px); max-height: min(320px, 55vh); background: rgba(15, 23, 42, 0.98); border: 1.5px solid rgba(56, 189, 248, 0.55); border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.85); overflow: hidden;';
    this.logPanel.style.display = 'none';

    // 4. Panel Header
    const panelHeader = document.createElement('div');
    panelHeader.className =
      'px-3.5 py-2.5 bg-slate-900 border-b border-sky-500/30 flex items-center justify-between font-bold text-sky-300 text-xs tracking-wider uppercase flex-shrink-0';
    panelHeader.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-sm">📜</span>
        <span class="font-bold text-sky-200">BATTLE LOG</span>
      </div>
      <button type="button" class="battle-log-close-btn text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 font-bold text-sm cursor-pointer" aria-label="Close log">✕</button>
    `;
    panelHeader.querySelector('.battle-log-close-btn')?.addEventListener('click', () => this.close());

    // 5. Scrollable Log List
    this.logList = document.createElement('div');
    this.logList.className =
      'battle-log-list p-3 space-y-2 overflow-y-auto font-mono text-xs leading-relaxed flex-1';
    this.logList.style.cssText =
      'overflow-y: auto; max-height: calc(min(320px, 55vh) - 44px); -webkit-overflow-scrolling: touch; font-size: 12px; line-height: 1.6; color: #f1f5f9; padding: 10px 12px;';

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
    item.className = 'battle-log-item transition-all';

    let colorClass = 'text-slate-300';
    let icon = '•';

    switch (entry.type) {
      case 'turn':
        colorClass = 'text-sky-400 font-bold border-t border-sky-500/20 pt-1.5 mt-1 text-center text-[10px] tracking-widest';
        icon = '⚔️';
        item.innerHTML = `<span class="${colorClass}">${icon} TURN ${entry.turn || ''}</span>`;
        this.logList.appendChild(item);
        return;

      case 'move':
        colorClass = 'text-sky-300 font-semibold';
        icon = '💥';
        break;

      case 'damage':
        if (entry.text.includes('super effective') || entry.text.includes('CRITICAL')) {
          colorClass = 'text-amber-400 font-semibold';
          icon = '⚡';
        } else {
          colorClass = 'text-rose-400';
          icon = '🩸';
        }
        break;

      case 'status':
        colorClass = 'text-purple-400 font-semibold';
        icon = '✨';
        break;

      case 'stat':
        colorClass = 'text-emerald-400';
        icon = '📊';
        break;

      case 'faint':
        colorClass = 'text-slate-400 italic';
        icon = '💀';
        break;

      case 'info':
      default:
        colorClass = 'text-slate-300';
        icon = 'ℹ️';
        break;
    }

    item.innerHTML = `
      <div class="flex items-start gap-1.5 ${colorClass}">
        <span class="text-[10px] opacity-70 shrink-0 select-none">${icon}</span>
        <span class="break-words flex-1">${this.escapeHtml(entry.text)}</span>
      </div>
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
