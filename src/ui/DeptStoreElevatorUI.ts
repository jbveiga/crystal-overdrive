/**
 * Goldenrod Dept Store Elevator UI (Google Stitch Neo-Kanto Protocol)
 * Desktop Screen: ce7ddb8c8e3a48f1aafce49d45d44e21
 * Mobile Screen: f9a712020093425fbf7dda836027f9da (100dvh safe-area)
 * Ticket: TICKET-WORLD-GOLDENROD-CITY-01
 */

export interface DeptStoreFloor {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  mapId: string;
  stockSummary: string[];
  description: string;
}

export const DEPT_STORE_FLOORS: DeptStoreFloor[] = [
  {
    id: 'roof',
    name: 'ROOFTOP LOOKOUT',
    shortName: 'ROOF',
    tagline: 'Scenic Skyline & Rooftop Bargains',
    mapId: 'goldenrod_dept_store_roof',
    stockSummary: ['Fresh Water (₽200)', 'Soda Pop (₽300)', 'Lemonade (₽350)'],
    description: 'Breathtaking panoramic overlook across Goldenrod City and the Radio Tower. Refreshing vending machines available.',
  },
  {
    id: '6f',
    name: '6F: TRANQUIL SQUARE',
    shortName: '6F',
    tagline: 'Vending Machines & Relaxation Lounge',
    mapId: 'goldenrod_dept_store_6f',
    stockSummary: ['Fresh Water (₽200)', 'Soda Pop (₽300)', 'Lemonade (₽350)'],
    description: 'Take a break from your journey! Our automated drink dispensers offer cost-effective healing beverages.',
  },
  {
    id: '5f',
    name: '5F: TM CORNER',
    shortName: '5F',
    tagline: 'Tactical Technical Machines',
    mapId: 'goldenrod_dept_store_5f',
    stockSummary: ['TM02 Headbutt (₽2000)', 'TM08 Rock Smash (₽1000)', 'TM41 ThunderPunch (₽3000)', 'TM48 Fire Punch (₽3000)', 'TM33 Ice Punch (₽3000)'],
    description: 'Empower your battle squad with top-tier elemental and field moves. All TMs are permanently reusable!',
  },
  {
    id: '4f',
    name: '4F: MEDICINE BOX',
    shortName: '4F',
    tagline: 'Permanent Stat Vitamins & Tonics',
    mapId: 'goldenrod_dept_store_4f',
    stockSummary: ['HP Up (₽9800)', 'Protein (₽9800)', 'Iron (₽9800)', 'Carbos (₽9800)', 'Calcium (₽9800)'],
    description: 'High-grade nutritional supplements designed to permanently maximize your Pokémon’s core effort attributes.',
  },
  {
    id: '3f',
    name: '3F: BATTLE COLLECTION',
    shortName: '3F',
    tagline: 'Combat Enhancers & Strategic Items',
    mapId: 'goldenrod_dept_store_3f',
    stockSummary: ['X Attack (₽500)', 'X Defend (₽550)', 'X Speed (₽350)', 'X Special (₽350)', 'Dire Hit (₽650)', 'Guard Spec. (₽700)'],
    description: 'Essential consumable battle items favored by Gym challengers to turn the tides of high-stakes duels.',
  },
  {
    id: '2f',
    name: "2F: TRAINER'S MARKET",
    shortName: '2F',
    tagline: 'General Provisions & Adventure Supplies',
    mapId: 'goldenrod_dept_store_2f',
    stockSummary: ['Poké Ball (₽200)', 'Great Ball (₽600)', 'Potion (₽300)', 'Super Potion (₽700)', 'Antidote (₽100)', 'Revive (₽1500)'],
    description: 'Fully stocked with standard Poké Balls, restoration medicines, and travel staples for Johto trainers.',
  },
  {
    id: '1f',
    name: '1F: SERVICE COUNTER',
    shortName: '1F',
    tagline: 'Information Desk & Grand Lobby',
    mapId: 'goldenrod_dept_store_1f',
    stockSummary: ['Directory Services', 'City Information', 'Lost & Found'],
    description: 'Welcome to the largest shopping center in Johto. Our receptionists are ready to guide you to all six shopping tiers.',
  },
];

export interface DeptStoreElevatorCallbacks {
  currentMapId: string;
  onSelectFloor: (floor: DeptStoreFloor) => void;
  onClose: () => void;
}

export class DeptStoreElevatorUI {
  private containerId: string;
  private active: boolean = false;
  private selectedIndex: number = 0;
  private callbacks: DeptStoreElevatorCallbacks | null = null;
  private modalElement: HTMLElement | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(containerId: string = 'modal-container') {
    this.containerId = containerId;
    this.injectStyles();
  }

  private injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('dept-store-elevator-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'dept-store-elevator-styles';
    styleEl.textContent = `
      .elevator-btn-active:hover {
        filter: brightness(1.1);
      }
      .elevator-btn-active:active {
        transform: translateY(2px);
      }
    `;
    document.head.appendChild(styleEl);
  }

  public isOpen(): boolean {
    return this.active;
  }

  public open(callbacks: DeptStoreElevatorCallbacks): void {
    this.callbacks = callbacks;
    this.active = true;

    // Default cursor to current floor if matching
    const matchingIdx = DEPT_STORE_FLOORS.findIndex((f) => f.mapId === callbacks.currentMapId);
    this.selectedIndex = matchingIdx >= 0 ? matchingIdx : 0;

    this.render();
    this.setupKeyboardShortcuts();
  }

  public close(): void {
    this.active = false;
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
      const key = e.key.toLowerCase();
      if (key === 'escape' || key === 'b' || key === 'x') {
        e.stopPropagation();
        e.preventDefault();
        this.close();
      } else if (key === 'arrowup' || key === 'w') {
        e.stopPropagation();
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex - 1 + DEPT_STORE_FLOORS.length) % DEPT_STORE_FLOORS.length;
        this.render();
      } else if (key === 'arrowdown' || key === 's') {
        e.stopPropagation();
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % DEPT_STORE_FLOORS.length;
        this.render();
      } else if (key === 'enter' || key === ' ' || key === 'a' || key === 'z') {
        e.stopPropagation();
        e.preventDefault();
        this.confirmFloor();
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  private confirmFloor(): void {
    const floor = DEPT_STORE_FLOORS[this.selectedIndex];
    if (!floor || !this.callbacks) return;
    const cb = this.callbacks.onSelectFloor;
    this.close();
    cb(floor);
  }

  public render(): void {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (!this.active) return;

    const overlay = document.createElement('div');
    overlay.id = 'dept-store-elevator-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(7, 11, 20, 0.85);
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
    card.id = 'dept-store-elevator-container';
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
        width: min(840px, 92vw);
        max-height: 85vh;
        background: #0D1322;
        border: 2px solid #2A3A5E;
        box-shadow: 0 12px 0 0 #070B14;
        border-radius: 4px;
        padding: 24px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 16px;
        color: #F6F8F3;
        overflow: hidden;
      `;

    // 1. Header with Goldenrod Dept Store Telemetry
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #2A3A5E;
      padding-bottom: 12px;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">🛗</span>
        <div>
          <div style="font-weight: 700; font-size: 14px; letter-spacing: 0.08em; color: #FFD028;">
            GOLDENROD DEPT. STORE // ELEVATOR DIRECTORY
          </div>
          <div style="font-size: 11px; color: #8A9DBF;">
            SELECT LEVEL TO ENGAGE VERTICAL TRANSIT
          </div>
        </div>
      </div>
      <button id="dept-elevator-close-btn" class="elevator-btn-active" style="
        background: transparent;
        border: 1px solid #2A3A5E;
        color: #8A9DBF;
        padding: 6px 10px;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        cursor: pointer;
        border-radius: 3px;
        min-height: 32px;
      ">
        [ESC] CLOSE
      </button>
    `;

    const closeBtn = header.querySelector('#dept-elevator-close-btn');
    closeBtn?.addEventListener('click', () => this.close());
    card.appendChild(header);

    // 2. Main Floor Selector Body
    const currentFloor = DEPT_STORE_FLOORS[this.selectedIndex];

    if (isMobile) {
      // Mobile Viewport: Horizontal scroll rail chips + Body card + Sticky travel button
      const chipsRail = document.createElement('div');
      chipsRail.id = 'elevator-chips-rail';
      chipsRail.style.cssText = `
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 4px 0;
        -webkit-overflow-scrolling: touch;
      `;

      DEPT_STORE_FLOORS.forEach((floor, idx) => {
        const isSelected = idx === this.selectedIndex;
        const chip = document.createElement('button');
        chip.id = `elevator-chip-${floor.id}`;
        chip.className = 'elevator-btn-active';
        chip.style.cssText = `
          padding: 8px 14px;
          border-radius: 3px;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
          cursor: pointer;
          min-height: 48px;
          border: 1px solid ${isSelected ? '#FFD028' : '#2A3A5E'};
          background: ${isSelected ? '#FFD028' : '#141E33'};
          color: ${isSelected ? '#070B14' : '#8A9DBF'};
          box-shadow: ${isSelected ? '0 3px 0 0 #070B14' : 'none'};
        `;
        chip.textContent = floor.shortName;
        chip.addEventListener('click', () => {
          this.selectedIndex = idx;
          this.render();
        });
        chipsRail.appendChild(chip);
      });
      card.appendChild(chipsRail);

      // Floor Details Card
      const details = document.createElement('div');
      details.style.cssText = `
        background: #141E33;
        border: 1px solid #2A3A5E;
        border-radius: 4px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
      `;
      details.innerHTML = `
        <div style="border-bottom: 1px solid rgba(42, 58, 94, 0.4); padding-bottom: 8px;">
          <div style="font-weight: 700; font-size: 15px; color: #FFD028;">
            ${currentFloor.name}
          </div>
          <div style="font-size: 11px; color: #8A9DBF; margin-top: 2px;">
            ${currentFloor.tagline}
          </div>
        </div>
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; line-height: 1.4; color: #F6F8F3;">
          ${currentFloor.description}
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #2A75D3; margin-bottom: 6px;">
            FLOOR CATALOG & STOCK:
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #8A9DBF; display: flex; flex-direction: column; gap: 4px;">
            ${currentFloor.stockSummary.map((item) => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
      card.appendChild(details);

      // Sticky Bottom Travel Button
      const travelBtn = document.createElement('button');
      travelBtn.id = 'elevator-travel-btn';
      travelBtn.className = 'elevator-btn-active';
      travelBtn.style.cssText = `
        background: #FFD028;
        color: #070B14;
        border: 1px solid #070B14;
        box-shadow: 0 4px 0 0 #070B14;
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        font-size: 13px;
        padding: 12px;
        cursor: pointer;
        min-height: 48px;
        border-radius: 3px;
        text-align: center;
      `;
      travelBtn.textContent = `TAKE ELEVATOR TO ${currentFloor.shortName}`;
      travelBtn.addEventListener('click', () => this.confirmFloor());
      card.appendChild(travelBtn);
    } else {
      // Desktop Architecture: Split-Rail Layout (Left Deck Rail + Right Preview)
      const body = document.createElement('div');
      body.style.cssText = `
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 16px;
        min-height: 380px;
      `;

      // Left Deck Rail
      const rail = document.createElement('div');
      rail.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #141E33;
        border: 1px solid #2A3A5E;
        border-radius: 4px;
        padding: 12px;
      `;

      DEPT_STORE_FLOORS.forEach((floor, idx) => {
        const isSelected = idx === this.selectedIndex;
        const btn = document.createElement('button');
        btn.id = `elevator-floor-btn-${floor.id}`;
        btn.className = 'elevator-btn-active';
        btn.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 3px;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          border: 1px solid ${isSelected ? '#FFD028' : '#2A3A5E'};
          background: ${isSelected ? '#FFD028' : '#0D1322'};
          color: ${isSelected ? '#070B14' : '#8A9DBF'};
          box-shadow: ${isSelected ? '0 3px 0 0 #070B14' : 'none'};
          text-align: left;
        `;
        btn.innerHTML = `
          <span>${floor.shortName}</span>
          <span style="font-size: 10px; opacity: 0.85;">${isSelected ? '◄' : ''}</span>
        `;
        btn.addEventListener('click', () => {
          this.selectedIndex = idx;
          this.render();
        });
        rail.appendChild(btn);
      });
      body.appendChild(rail);

      // Right Preview Station
      const preview = document.createElement('div');
      preview.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #141E33;
        border: 1px solid #2A3A5E;
        border-radius: 4px;
        padding: 20px;
      `;
      preview.innerHTML = `
        <div style="border-bottom: 1px solid rgba(42, 58, 94, 0.4); padding-bottom: 10px;">
          <div style="font-weight: 700; font-size: 16px; color: #FFD028;">
            ${currentFloor.name}
          </div>
          <div style="font-size: 12px; color: #8A9DBF; margin-top: 4px;">
            ${currentFloor.tagline}
          </div>
        </div>

        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; line-height: 1.5; color: #F6F8F3; background: #0D1322; border: 1px solid #2A3A5E; padding: 12px; border-radius: 4px;">
          ${currentFloor.description}
        </div>

        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 700; color: #2A75D3; margin-bottom: 8px;">
            FEATURED MERCHANDISE & SERVICES:
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            ${currentFloor.stockSummary
              .map(
                (item) => `
              <div style="background: #0D1322; border: 1px solid #2A3A5E; padding: 6px 10px; border-radius: 3px; font-size: 11px; color: #F6F8F3;">
                ${item}
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <button id="elevator-travel-btn" class="elevator-btn-active" style="
          background: #FFD028;
          color: #070B14;
          border: 1px solid #070B14;
          box-shadow: 0 4px 0 0 #070B14;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          padding: 12px;
          cursor: pointer;
          min-height: 44px;
          border-radius: 3px;
          text-align: center;
        ">
          TAKE ELEVATOR TO ${currentFloor.shortName} [ENTER]
        </button>
      `;

      const travelBtn = preview.querySelector('#elevator-travel-btn');
      travelBtn?.addEventListener('click', () => this.confirmFloor());
      body.appendChild(preview);
      card.appendChild(body);
    }

    overlay.appendChild(card);
    const host = document.getElementById(this.containerId) || document.body;
    host.appendChild(overlay);
    this.modalElement = overlay;
  }
}
