export type BattleLogFilter = 'all' | 'move' | 'damage' | 'status';

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
  private filterBar!: HTMLDivElement;
  private logList!: HTMLDivElement;
  private entries: BattleLogEntry[] = [];
  private entryElements: Array<{ entry: BattleLogEntry; el: HTMLDivElement }> = [];
  private currentTurn: number = 0;
  private isOpen: boolean = false;
  private activeFilter: BattleLogFilter = 'all';
  private filterButtons: Partial<Record<BattleLogFilter, HTMLButtonElement>> = {};

  constructor(parentContainer: HTMLElement) {
    this.parentContainer = parentContainer;
    this.createUI();
  }

  private createUI(): void {
    // 1. Root wrapper inside battle HUD top-right controls
    this.rootElement = document.createElement('div');
    this.rootElement.className = 'battle-log-root';
    this.rootElement.style.cssText = `
      position: relative;
      z-index: 40;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: auto;
    `;

    // 2. Toggle button & badge
    this.toggleButton = document.createElement('button');
    this.toggleButton.type = 'button';
    this.toggleButton.className = 'battle-log-toggle-btn';
    this.toggleButton.style.cssText = `
      padding: 6px 12px;
      background: rgba(15, 23, 42, 0.9);
      color: #7dd3fc;
      border: 1px solid rgba(56, 189, 248, 0.45);
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      backdrop-filter: blur(8px);
    `;

    const iconSpan = document.createElement('span');
    iconSpan.textContent = '📜';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = 'LOG';
    const shortcutSpan = document.createElement('span');
    shortcutSpan.className = 'keyboard-hint';
    shortcutSpan.style.cssText = 'font-size: 10px; color: #94a3b8; font-family: monospace;';
    shortcutSpan.textContent = '(L)';

    this.countBadge = document.createElement('span');
    this.countBadge.className = 'battle-log-count';
    this.countBadge.style.cssText = `
      font-size: 10px;
      background: #082f49;
      padding: 1px 6px;
      border-radius: 999px;
      color: #38bdf8;
      font-family: monospace;
      font-weight: 800;
      border: 1px solid rgba(56, 189, 248, 0.3);
    `;
    this.countBadge.textContent = '0';

    this.toggleButton.appendChild(iconSpan);
    this.toggleButton.appendChild(labelSpan);
    this.toggleButton.appendChild(shortcutSpan);
    this.toggleButton.appendChild(this.countBadge);
    this.toggleButton.addEventListener('click', () => this.toggle());

    // 3. Log panel container (hidden by default)
    this.logPanel = document.createElement('div');
    this.logPanel.className = 'battle-log-panel hidden';
    this.logPanel.style.cssText = `
      display: none;
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      width: min(310px, calc(100vw - 24px));
      max-height: 230px;
      background: rgba(2, 6, 23, 0.96);
      border: 1.5px solid rgba(56, 189, 248, 0.45);
      border-radius: 12px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(12px);
      flex-direction: column;
      overflow: hidden;
      font-size: 12px;
      color: #e2e8f0;
      z-index: 60;
    `;

    // 4. Panel Header
    const panelHeader = document.createElement('div');
    panelHeader.style.cssText = `
      padding: 8px 12px;
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(56, 189, 248, 0.25);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 800;
      color: #7dd3fc;
      font-size: 11px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    `;
    panelHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span>📜</span>
        <span>BATTLE LOG</span>
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'battle-log-close-btn';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 2px 6px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      border-radius: 4px;
    `;
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.close());
    panelHeader.appendChild(closeBtn);

    // 5. Category Filter Bar (ALL | MOVES | DAMAGE | STATUS)
    this.filterBar = document.createElement('div');
    this.filterBar.className = 'battle-log-filters';
    this.filterBar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid #1e293b;
    `;
    const filterSpecs: Array<{ id: BattleLogFilter; label: string }> = [
      { id: 'all', label: 'ALL' },
      { id: 'move', label: 'MOVES' },
      { id: 'damage', label: 'DAMAGE' },
      { id: 'status', label: 'STATUS' },
    ];
    for (const spec of filterSpecs) {
      const fBtn = document.createElement('button');
      fBtn.type = 'button';
      fBtn.className = `battle-log-filter-${spec.id}`;
      fBtn.style.cssText = `
        padding: 3px 8px;
        border-radius: 4px;
        border: none;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.5px;
        cursor: pointer;
      `;
      fBtn.textContent = spec.label;
      fBtn.addEventListener('click', () => this.setFilter(spec.id));
      this.filterButtons[spec.id] = fBtn;
      this.filterBar.appendChild(fBtn);
    }

    // 6. Scrollable Log List
    this.logList = document.createElement('div');
    this.logList.className = 'battle-log-list';
    this.logList.style.cssText = `
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      overflow-y: auto;
      max-height: 155px;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.4;
    `;

    this.logPanel.appendChild(panelHeader);
    this.logPanel.appendChild(this.filterBar);
    this.logPanel.appendChild(this.logList);

    this.rootElement.appendChild(this.toggleButton);
    this.rootElement.appendChild(this.logPanel);

    this.parentContainer.appendChild(this.rootElement);
    this.updateFilterButtonStyles();
  }

  public showRoot(): void {
    this.rootElement.style.display = 'flex';
  }

  public hideRoot(): void {
    this.close();
    this.rootElement.style.display = 'none';
  }

  public setFilter(filter: BattleLogFilter): void {
    this.activeFilter = filter;
    this.updateFilterButtonStyles();
    this.applyFilterToEntries();
  }

  public getActiveFilter(): BattleLogFilter {
    return this.activeFilter;
  }

  private updateFilterButtonStyles(): void {
    for (const [key, btn] of Object.entries(this.filterButtons) as Array<[BattleLogFilter, HTMLButtonElement]>) {
      if (!btn) continue;
      if (key === this.activeFilter) {
        btn.style.background = '#0284c7';
        btn.style.color = '#ffffff';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#94a3b8';
      }
    }
  }

  private doesEntryMatchFilter(entry: BattleLogEntry): boolean {
    if (this.activeFilter === 'all') return true;
    if (entry.type === 'turn') return true;
    if (this.activeFilter === 'move') return entry.type === 'move';
    if (this.activeFilter === 'damage') return entry.type === 'damage';
    if (this.activeFilter === 'status') {
      return entry.type === 'status' || entry.type === 'stat' || entry.type === 'faint';
    }
    return true;
  }

  private applyFilterToEntries(): void {
    for (const item of this.entryElements) {
      const visible = this.doesEntryMatchFilter(item.entry);
      item.el.style.display = visible ? '' : 'none';
      if (visible) {
        item.el.classList.remove('hidden');
      } else {
        item.el.classList.add('hidden');
      }
    }
    this.scrollToBottom();
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
    this.logPanel.classList?.remove('hidden');
    this.logPanel.style.display = 'flex';
    this.toggleButton.style.background = 'rgba(12, 74, 110, 0.95)';
    this.toggleButton.style.borderColor = '#38bdf8';
    this.scrollToBottom();
  }

  public close(): void {
    this.isOpen = false;
    this.logPanel.classList?.add('hidden');
    this.logPanel.style.display = 'none';
    this.toggleButton.style.background = 'rgba(15, 23, 42, 0.9)';
    this.toggleButton.style.borderColor = 'rgba(56, 189, 248, 0.45)';
  }

  public isExpanded(): boolean {
    return this.isOpen;
  }

  public clear(): void {
    this.entries = [];
    this.entryElements = [];
    this.currentTurn = 0;
    this.logList.innerHTML = '';
    this.updateCountBadge();
  }

  public startTurn(turnNumber: number): void {
    this.currentTurn = turnNumber;
    this.addEntry('turn', `--- TURN ${turnNumber} ---`, turnNumber);
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

    let textColor = '#cbd5e1';
    let fontWeight = '500';
    let icon = '•';

    switch (entry.type) {
      case 'turn':
        item.style.cssText = `
          color: #38bdf8;
          font-weight: 800;
          border-top: 1px solid rgba(56, 189, 248, 0.2);
          padding-top: 4px;
          margin-top: 3px;
          text-align: center;
          font-size: 10px;
          letter-spacing: 1px;
        `;
        item.innerHTML = `<span>⚔️ TURN ${entry.turn || ''}</span>`;
        if (!this.doesEntryMatchFilter(entry)) {
          item.style.display = 'none';
          item.classList.add('hidden');
        }
        this.entryElements.push({ entry, el: item });
        this.logList.appendChild(item);
        return;

      case 'move':
        textColor = '#7dd3fc';
        fontWeight = '700';
        icon = '💥';
        break;

      case 'damage':
        if (entry.text.includes('super effective') || entry.text.includes('critical hit') || entry.text.includes('CRITICAL')) {
          textColor = '#fbbf24';
          fontWeight = '700';
          icon = '⚡';
        } else {
          textColor = '#fb7185';
          icon = '🩸';
        }
        break;

      case 'status':
        textColor = '#c084fc';
        fontWeight = '700';
        icon = '✨';
        break;

      case 'stat':
        textColor = '#34d399';
        icon = '📊';
        break;

      case 'faint':
        textColor = '#94a3b8';
        icon = '💀';
        break;

      case 'info':
      default:
        textColor = '#cbd5e1';
        icon = 'ℹ️';
        break;
    }

    item.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 6px; color: ${textColor}; font-weight: ${fontWeight};">
        <span style="font-size: 10px; opacity: 0.85; flex-shrink: 0; user-select: none;">${icon}</span>
        <span style="word-break: break-word; flex: 1;">${this.escapeHtml(entry.text)}</span>
      </div>
    `;

    if (!this.doesEntryMatchFilter(entry)) {
      item.style.display = 'none';
      item.classList.add('hidden');
    }

    this.entryElements.push({ entry, el: item });
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

  public getFilteredEntries(): BattleLogEntry[] {
    return this.entries.filter((e) => this.doesEntryMatchFilter(e));
  }
}
