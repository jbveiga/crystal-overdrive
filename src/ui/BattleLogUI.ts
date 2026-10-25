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
      'battle-log-panel hidden mt-2 w-72 md:w-80 max-h-56 bg-slate-950/92 border border-sky-500/30 rounded-xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-xs text-slate-200 transition-all duration-200';
    this.logPanel.style.display = 'none';
    this.logPanel.style.maxWidth = 'min(320px, 90vw)';
    this.logPanel.style.maxHeight = 'min(220px, 45vh)';

    // 4. Panel Header
    const panelHeader = document.createElement('div');
    panelHeader.className =
      'px-3 py-2 bg-slate-900/90 border-b border-sky-500/20 flex items-center justify-between font-bold text-sky-300 text-xs tracking-wider uppercase flex-shrink-0';
    panelHeader.innerHTML = `
      <div class="flex items-center gap-1.5">
        <span>📜</span>
        <span>BATTLE LOG</span>
      </div>
      <button type="button" class="battle-log-close-btn text-slate-400 hover:text-white px-1 font-bold text-sm">✕</button>
    `;
    panelHeader.querySelector('.battle-log-close-btn')?.addEventListener('click', () => this.close());

    // 5. Scrollable Log List
    this.logList = document.createElement('div');
    this.logList.className =
      'battle-log-list p-2.5 space-y-1.5 overflow-y-auto max-h-48 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-sky-600/50 scrollbar-track-transparent flex-1';

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
