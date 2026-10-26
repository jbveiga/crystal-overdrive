import { BattleAudio } from '../../audio/BattleAudio';
import { findHabitatsForSpecies } from '../../world/townMapData';
import type { StartMenuStateProvider, StartMenuCallbacks } from '../StartMenuUI';
import {
  JOHTO_DEX_SPECIES,
  type DexSpeciesData,
  CANONICAL_SPECIES_DATA,
  getNeoKantoTypeColor,
  getCompleteDexSpecies,
} from './pokedexData';

export {
  JOHTO_DEX_SPECIES,
  type DexSpeciesData,
  CANONICAL_SPECIES_DATA,
  getNeoKantoTypeColor,
  getCompleteDexSpecies,
};

export class PokedexModalRenderer {
  public selectedDexSpeciesId: string = 'cyndaquil';
  public dexFilter: 'ALL' | 'JOHTO' | 'KANTO' | 'CAUGHT' | 'SEEN' | 'HABITAT' = 'ALL';
  public dexSearchQuery: string = '';
  public dexSort: 'num' | 'bst' | 'name' | 'mass' = 'num';

  constructor(
    private pokedexModal: HTMLDivElement,
    private menuPanel: HTMLDivElement,
    private stateProvider: StartMenuStateProvider,
    private callbacks: StartMenuCallbacks,
    private hideMenuOnly: () => void,
    private closeAll: () => void
  ) {}

  private filterAndSortDexList(
    all: DexSpeciesData[],
    caughtSet: Set<string>,
    seenSet: Set<string>
  ): DexSpeciesData[] {
    let list = all;

    if (this.dexFilter === 'JOHTO') {
      list = list.filter((s) => s.num >= 152 && s.num <= 251);
    } else if (this.dexFilter === 'KANTO') {
      list = list.filter((s) => s.num >= 1 && s.num <= 151);
    } else if (this.dexFilter === 'CAUGHT') {
      list = list.filter((s) => caughtSet.has(s.id));
    } else if (this.dexFilter === 'SEEN') {
      list = list.filter((s) => caughtSet.has(s.id) || seenSet.has(s.id));
    } else if (this.dexFilter === 'HABITAT') {
      list = list.filter((s) => findHabitatsForSpecies(s.id).length > 0);
    }

    if (this.dexSearchQuery.trim()) {
      const q = this.dexSearchQuery.trim().toLowerCase().replace(/^#/, '');
      list = list.filter((s) => {
        const matchesMeta =
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          String(s.num).includes(q) ||
          s.types.some((t) => t.toLowerCase().includes(q));
        if (matchesMeta) return true;
        const habitats = findHabitatsForSpecies(s.id);
        return habitats.some(
          (lm) => lm.name.toLowerCase().includes(q) || lm.id.toLowerCase().includes(q)
        );
      });
    }

    if (this.dexSort === 'bst') {
      list = [...list].sort((a, b) => b.bst - a.bst);
    } else if (this.dexSort === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.dexSort === 'mass') {
      list = [...list].sort((a, b) => b.weightkg - a.weightkg);
    } else {
      list = [...list].sort((a, b) => a.num - b.num);
    }

    return list;
  }

  private renderPokedexModalShell(caughtSet: Set<string>, seenSet: Set<string>): void {
    const activeBtnStyle = 'background: #FFD028; color: #0D1322; font-weight: 800; border: 1px solid #FFD028;';
    const inactiveBtnStyle = 'background: #151B2B; color: #94A3B8; font-weight: 700; border: 1px solid #22324F;';

    this.pokedexModal.innerHTML = `
      <!-- Pokédex Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #22324F; padding-bottom: 12px; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="neo-kanto-pulse-dot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #FFD028; box-shadow: 0 0 8px #FFD028;"></span>
          <div>
            <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #FFD028; letter-spacing: 1px;">DEXSPHERE OS // KANTO-JOHTO ARCHIVE</div>
            <h2 style="font-family: 'Space Mono', monospace; margin: 2px 0 0 0; font-size: 20px; font-weight: 900; color: #F6F8F3; letter-spacing: -0.5px;">📕 PROF. OAK DIGITAL POKéDEX</h2>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span id="dex-seen-pill" style="background: #141E33; border: 1.5px solid #2A75D3; color: #38BDF8; padding: 5px 10px; border-radius: 6px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; box-shadow: 0 2px 0 0 #070B14;">SEEN: ${seenSet.size} / 251</span>
          <span id="dex-owned-pill" style="background: #141E33; border: 1.5px solid #48C774; color: #4ADE80; padding: 5px 10px; border-radius: 6px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; box-shadow: 0 2px 0 0 #070B14;">OWNED: ${caughtSet.size} / 251</span>
          <button id="close-pokedex-btn" class="neo-kanto-tactile-btn" style="background: #1E293B; color: #F6F8F3; border: 1.5px solid #475569; border-radius: 6px; padding: 6px 12px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 0 0 #070B14;">← BACK TO MENU</button>
        </div>
      </div>

      <!-- Tactical Search & Filter Ribbon -->
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; background: #141E33; border: 1px solid #22324F; padding: 8px 10px; border-radius: 8px;">
        <div style="position: relative; flex: 1; min-width: 200px;">
          <input
            id="dex-search-input"
            type="text"
            placeholder="QUERY INDEX BY NAME, ID, OR TYPE..."
            value="${this.dexSearchQuery}"
            style="width: 100%; background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 6px 10px; font-family: 'Space Mono', monospace; font-size: 11px; color: #F6F8F3; outline: none; box-sizing: border-box;"
          />
        </div>

        <div style="display: flex; gap: 4px; align-items: center; overflow-x: auto;">
          <button id="dex-filter-all" class="neo-kanto-tactile-btn" style="border-radius: 4px; padding: 5px 8px; font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; ${this.dexFilter === 'ALL' ? activeBtnStyle : inactiveBtnStyle}">ALL (251)</button>
          <button id="dex-filter-johto" class="neo-kanto-tactile-btn" style="border-radius: 4px; padding: 5px 8px; font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; ${this.dexFilter === 'JOHTO' ? activeBtnStyle : inactiveBtnStyle}">JOHTO (#152-251)</button>
          <button id="dex-filter-kanto" class="neo-kanto-tactile-btn" style="border-radius: 4px; padding: 5px 8px; font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; ${this.dexFilter === 'KANTO' ? activeBtnStyle : inactiveBtnStyle}">KANTO (#001-151)</button>
          <button id="dex-filter-caught" class="neo-kanto-tactile-btn" style="border-radius: 4px; padding: 5px 8px; font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; ${this.dexFilter === 'CAUGHT' ? activeBtnStyle : inactiveBtnStyle}">OWNED (${caughtSet.size})</button>
          <button id="dex-filter-seen" class="neo-kanto-tactile-btn" style="border-radius: 4px; padding: 5px 8px; font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; ${this.dexFilter === 'SEEN' ? activeBtnStyle : inactiveBtnStyle}">SEEN (${seenSet.size})</button>
          <button id="dex-filter-habitat" class="neo-kanto-tactile-btn" style="border-radius: 4px; padding: 5px 8px; font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; ${this.dexFilter === 'HABITAT' ? activeBtnStyle : inactiveBtnStyle}">🗺️ HABITATS</button>
        </div>

        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8;">SORT:</span>
          <select id="dex-sort-select" style="background: #080E1D; border: 1px solid #22324F; color: #FFD028; border-radius: 4px; padding: 4px 6px; font-family: 'Space Mono', monospace; font-size: 10px; outline: none; cursor: pointer;">
            <option value="num" ${this.dexSort === 'num' ? 'selected' : ''}>#001 - #251 NUMERICAL</option>
            <option value="bst" ${this.dexSort === 'bst' ? 'selected' : ''}>BASE STAT TOTAL (HIGH-LOW)</option>
            <option value="name" ${this.dexSort === 'name' ? 'selected' : ''}>ALPHABETICAL (A-Z)</option>
            <option value="mass" ${this.dexSort === 'mass' ? 'selected' : ''}>HEAVIEST MASS</option>
          </select>
        </div>
      </div>

      <!-- 3-Pane Workstation Matrix -->
      <div id="pokedex-modal-workstation" style="display: flex; gap: 12px; flex: 1; min-height: 0; overflow: hidden;">
        <!-- Left: Specimen Roster Column -->
        <div id="dex-roster-column" style="flex: 0 0 310px; max-width: 330px; display: flex; flex-direction: column; background: #141E33; border: 1px solid #22324F; border-radius: 8px; padding: 8px; box-shadow: 0 4px 0 0 #070B14; min-height: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #FFD028; letter-spacing: 0.5px;">SPECIMEN ROSTER</span>
            <span id="dex-roster-count" style="font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8; background: #080E1D; padding: 2px 6px; border-radius: 4px;">251</span>
          </div>
          <div id="dex-roster-list" class="neo-kanto-scrollbar" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;"></div>
        </div>

        <!-- Center: Holographic Stage Bay -->
        <div id="dex-stage-column" style="flex: 1.1; display: flex; flex-direction: column; gap: 10px; background: #141E33; border: 1px solid #22324F; border-radius: 8px; padding: 12px; box-shadow: 0 4px 0 0 #070B14; min-height: 0; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028;">HOLOGRAPHIC SPECIMEN BAY</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button id="dex-prev-btn" class="neo-kanto-tactile-btn" style="background: #080E1D; border: 1px solid #22324F; color: #F6F8F3; border-radius: 4px; padding: 4px 8px; font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; cursor: pointer; box-shadow: 0 2px 0 0 #070B14;">◀ PREV</button>
              <button id="dex-next-btn" class="neo-kanto-tactile-btn" style="background: #080E1D; border: 1px solid #22324F; color: #F6F8F3; border-radius: 4px; padding: 4px 8px; font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; cursor: pointer; box-shadow: 0 2px 0 0 #070B14;">NEXT ▶</button>
            </div>
          </div>

          <!-- Stage Viewport Platform -->
          <div style="position: relative; height: 180px; background: #080E1D; border: 1px solid #22324F; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);">
            <div style="position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(42, 117, 211, 0.22) 0%, rgba(8, 14, 29, 0.95) 70%);"></div>
            <div style="position: absolute; bottom: 20px; width: 140px; height: 26px; border-radius: 50%; background: rgba(255, 208, 40, 0.15); box-shadow: 0 0 16px rgba(255, 208, 40, 0.45); transform: rotateX(60deg);"></div>
            <span id="dex-gen-pill" style="position: absolute; top: 8px; left: 8px; background: #141E33; border: 1px solid #22324F; color: #94A3B8; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; z-index: 2;">GEN II</span>
            <span id="dex-scan-pill" style="position: absolute; top: 8px; right: 8px; background: #141E33; border: 1px solid #22324F; color: #FFD028; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; z-index: 2;">SCAN: 100%</span>

            <img
              id="dex-stage-sprite"
              alt="Specimen Bay"
              src="./assets/sprites/pokemon/unown_front.png"
              onerror="this.onerror=null; this.src='./assets/sprites/pokemon/unown_front.png';"
              style="width: 110px; height: 110px; object-fit: contain; image-rendering: pixelated; position: relative; z-index: 3; transition: transform 0.2s ease;"
            />
          </div>

          <!-- Specimen Headline & Type Badges -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span id="dex-stage-num" style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: #94A3B8; letter-spacing: 1px;">NO. 155</span>
              <span id="dex-stage-status" style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #4ADE80;">🔴 CAUGHT</span>
            </div>
            <h2 id="dex-stage-name" style="font-family: 'Space Mono', monospace; font-size: 24px; font-weight: 900; color: #FFD028; margin: 0; letter-spacing: -0.5px;">CYNDAQUIL</h2>
            <div id="dex-stage-category" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 600; color: #DDE2F7;">FIRE MOUSE POKéMON</div>
            <div id="dex-stage-types" style="display: flex; gap: 6px; margin-top: 4px;"></div>
          </div>
        </div>

        <!-- Right: Biometric Telemetry & Base Stats Column -->
        <div id="dex-telemetry-column" style="flex: 0 0 290px; max-width: 310px; display: flex; flex-direction: column; gap: 8px; background: #141E33; border: 1px solid #22324F; border-radius: 8px; padding: 12px; box-shadow: 0 4px 0 0 #070B14; min-height: 0; overflow-y: auto;">
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px;">
            BIOMETRIC TELEMETRY
          </div>

          <!-- Vitals Bento -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
            <div style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 6px; text-align: center;">
              <div style="font-family: 'Space Mono', monospace; font-size: 9px; color: #94A3B8; font-weight: 700;">HEIGHT</div>
              <div id="dex-height-val" style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #38BDF8; margin-top: 2px;">0.5 m</div>
            </div>
            <div style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 6px; text-align: center;">
              <div style="font-family: 'Space Mono', monospace; font-size: 9px; color: #94A3B8; font-weight: 700;">WEIGHT</div>
              <div id="dex-weight-val" style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #38BDF8; margin-top: 2px;">7.9 kg</div>
            </div>
            <div style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 6px; text-align: center;">
              <div style="font-family: 'Space Mono', monospace; font-size: 9px; color: #94A3B8; font-weight: 700;">BST</div>
              <div id="dex-bst-val" style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #FFD028; margin-top: 2px;">309</div>
            </div>
          </div>

          <!-- Base Stats Meters -->
          <div style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 5px;">
            <div style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; color: #94A3B8; margin-bottom: 2px;">BASE STAT CALIBRATION</div>

            <!-- HP -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #DDE2F7; width: 44px;">HP</span>
              <div style="flex: 1; height: 6px; background: #141E33; border-radius: 3px; overflow: hidden;">
                <div id="dex-bar-hp" style="height: 100%; width: 25%; background: #EE4238; border-radius: 3px; transition: width 0.3s ease;"></div>
              </div>
              <span id="dex-val-hp" style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #DDE2F7; width: 26px; text-align: right;">39</span>
            </div>

            <!-- ATK -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #DDE2F7; width: 44px;">ATK</span>
              <div style="flex: 1; height: 6px; background: #141E33; border-radius: 3px; overflow: hidden;">
                <div id="dex-bar-atk" style="height: 100%; width: 32%; background: #FFD028; border-radius: 3px; transition: width 0.3s ease;"></div>
              </div>
              <span id="dex-val-atk" style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #DDE2F7; width: 26px; text-align: right;">52</span>
            </div>

            <!-- DEF -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #DDE2F7; width: 44px;">DEF</span>
              <div style="flex: 1; height: 6px; background: #141E33; border-radius: 3px; overflow: hidden;">
                <div id="dex-bar-def" style="height: 100%; width: 28%; background: #EE4238; border-radius: 3px; transition: width 0.3s ease;"></div>
              </div>
              <span id="dex-val-def" style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #DDE2F7; width: 26px; text-align: right;">43</span>
            </div>

            <!-- SP.ATK -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #DDE2F7; width: 44px;">SP.ATK</span>
              <div style="flex: 1; height: 6px; background: #141E33; border-radius: 3px; overflow: hidden;">
                <div id="dex-bar-spa" style="height: 100%; width: 38%; background: #FFD028; border-radius: 3px; transition: width 0.3s ease;"></div>
              </div>
              <span id="dex-val-spa" style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #DDE2F7; width: 26px; text-align: right;">60</span>
            </div>

            <!-- SP.DEF -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #DDE2F7; width: 44px;">SP.DEF</span>
              <div style="flex: 1; height: 6px; background: #141E33; border-radius: 3px; overflow: hidden;">
                <div id="dex-bar-spd" style="height: 100%; width: 31%; background: #EE4238; border-radius: 3px; transition: width 0.3s ease;"></div>
              </div>
              <span id="dex-val-spd" style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #DDE2F7; width: 26px; text-align: right;">50</span>
            </div>

            <!-- SPEED -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #DDE2F7; width: 44px;">SPEED</span>
              <div style="flex: 1; height: 6px; background: #141E33; border-radius: 3px; overflow: hidden;">
                <div id="dex-bar-spe" style="height: 100%; width: 40%; background: #FFD028; border-radius: 3px; transition: width 0.3s ease;"></div>
              </div>
              <span id="dex-val-spe" style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #DDE2F7; width: 26px; text-align: right;">65</span>
            </div>
          </div>

          <!-- Regional Habitat Map Tracker Card -->
          <div id="dex-habitat-card" style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; color: #38BDF8;">🗺️ REGIONAL HABITAT TRACKER</span>
              <span id="dex-habitat-count" style="font-family: 'Space Mono', monospace; font-size: 9px; color: #94A3B8;">0 ZONES</span>
            </div>
            <div id="dex-habitat-list" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
          </div>

          <!-- Lore Observation Card -->
          <div style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 8px 10px; flex: 1; display: flex; flex-direction: column;">
            <div style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 800; color: #FFD028; margin-bottom: 4px;">PROF. OAK FIELD NOTES</div>
            <p id="dex-lore-text" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; line-height: 1.5; color: #DDE2F7; margin: 0;"></p>
          </div>
        </div>
      </div>
    `;

    // Hook Close Button
    this.pokedexModal.querySelector('#close-pokedex-btn')?.addEventListener('click', () => {
      BattleAudio.playMenuSound('CANCEL');
      this.pokedexModal.style.display = 'none';
      this.menuPanel.style.display = 'flex';
    });

    // Hook Search Input
    const searchInput = this.pokedexModal.querySelector('#dex-search-input') as HTMLInputElement | null;
    searchInput?.addEventListener('input', (e) => {
      this.dexSearchQuery = (e.target as HTMLInputElement).value;
      this.renderPokedexRoster(caughtSet, seenSet);
    });

    // Hook Filter Buttons
    const filterIds: Array<{ id: string; filter: 'ALL' | 'JOHTO' | 'KANTO' | 'CAUGHT' | 'SEEN' | 'HABITAT' }> = [
      { id: '#dex-filter-all', filter: 'ALL' },
      { id: '#dex-filter-johto', filter: 'JOHTO' },
      { id: '#dex-filter-kanto', filter: 'KANTO' },
      { id: '#dex-filter-caught', filter: 'CAUGHT' },
      { id: '#dex-filter-seen', filter: 'SEEN' },
      { id: '#dex-filter-habitat', filter: 'HABITAT' },
    ];

    filterIds.forEach(({ id, filter }) => {
      this.pokedexModal.querySelector(id)?.addEventListener('click', () => {
        BattleAudio.playMenuSound('CURSOR');
        this.dexFilter = filter;
        filterIds.forEach((f) => {
          const btn = this.pokedexModal.querySelector(f.id) as HTMLButtonElement | null;
          if (btn) btn.style.cssText = `border-radius: 4px; padding: 5px 8px; font-family: 'Space Mono', monospace; font-size: 10px; cursor: pointer; ${f.filter === filter ? activeBtnStyle : inactiveBtnStyle}`;
        });
        this.renderPokedexRoster(caughtSet, seenSet);
      });
    });

    // Hook Sort Selector
    const sortSelect = this.pokedexModal.querySelector('#dex-sort-select') as HTMLSelectElement | null;
    sortSelect?.addEventListener('change', (e) => {
      this.dexSort = (e.target as HTMLSelectElement).value as any;
      this.renderPokedexRoster(caughtSet, seenSet);
    });

    // Hook Prev / Next specimen buttons
    this.pokedexModal.querySelector('#dex-prev-btn')?.addEventListener('click', () => {
      const all = getCompleteDexSpecies();
      const list = this.filterAndSortDexList(all, caughtSet, seenSet);
      if (list.length === 0) return;
      const idx = list.findIndex((s) => s.id === this.selectedDexSpeciesId);
      const nextIdx = (idx - 1 + list.length) % list.length;
      BattleAudio.playMenuSound('CURSOR');
      this.updatePokedexDetails(list[nextIdx].id, caughtSet, seenSet);
    });

    this.pokedexModal.querySelector('#dex-next-btn')?.addEventListener('click', () => {
      const all = getCompleteDexSpecies();
      const list = this.filterAndSortDexList(all, caughtSet, seenSet);
      if (list.length === 0) return;
      const idx = list.findIndex((s) => s.id === this.selectedDexSpeciesId);
      const nextIdx = (idx + 1) % list.length;
      BattleAudio.playMenuSound('CURSOR');
      this.updatePokedexDetails(list[nextIdx].id, caughtSet, seenSet);
    });
  }

  private renderPokedexRoster(caughtSet: Set<string>, seenSet: Set<string>): void {
    const rosterList = this.pokedexModal.querySelector('#dex-roster-list');
    const rosterCount = this.pokedexModal.querySelector('#dex-roster-count');
    if (!rosterList) return;

    const all = getCompleteDexSpecies();
    const list = this.filterAndSortDexList(all, caughtSet, seenSet);

    if (rosterCount) {
      rosterCount.textContent = String(list.length);
    }

    if (list.length === 0) {
      rosterList.innerHTML = `
        <div style="background: #080E1D; border: 1px dashed #22324F; border-radius: 6px; padding: 16px; text-align: center; color: #94A3B8; font-family: 'Space Mono', monospace; font-size: 11px;">
          NO SPECIMENS MATCH QUERY
        </div>
      `;
      return;
    }

    // If currently selected specimen is not in the filtered list, select the first visible
    if (!list.some((s) => s.id === this.selectedDexSpeciesId)) {
      this.selectedDexSpeciesId = list[0].id;
      this.updatePokedexDetails(this.selectedDexSpeciesId, caughtSet, seenSet);
    }

    const rowsHtml = list
      .map((sp) => {
        const isCaught = caughtSet.has(sp.id);
        const isSeen = isCaught || seenSet.has(sp.id);
        const isSelected = sp.id === this.selectedDexSpeciesId;
        const dexNum = String(sp.num).padStart(3, '0');
        const bCol = isSelected ? '#FFD028' : isCaught ? 'rgba(74, 222, 128, 0.4)' : isSeen ? 'rgba(56, 189, 248, 0.4)' : '#22324F';
        const bg = isSelected ? '#192846' : '#080E1D';
        const sCol = isCaught ? '#4ADE80' : isSeen ? '#38BDF8' : '#64748B';

        const thumb = isSeen
          ? `<img src="./assets/sprites/pokemon/${sp.id}_front.png" alt="${sp.name}" onerror="this.onerror=null; this.src='./assets/sprites/pokemon/unown_front.png';" style="width:28px;height:28px;image-rendering:pixelated;object-fit:contain;" />`
          : '<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#141E33;border-radius:4px;font-family:\'Space Mono\',monospace;font-size:11px;font-weight:700;color:#64748B;">?</div>';

        return `
          <div
            data-dex-id="${sp.id}"
            class="neo-kanto-tactile-btn"
            style="background:${bg};border:1.5px solid ${bCol};box-shadow:${isSelected ? '0 0 10px rgba(255,208,40,0.35), 0 2px 0 0 #070B14' : '0 2px 0 0 #070B14'};border-radius:6px;padding:6px 8px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;opacity:${isSeen ? 1 : 0.6};"
          >
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-family:'Space Mono',monospace;font-size:10px;font-weight:700;color:#94A3B8;">#${dexNum}</span>
              ${thumb}
              <div>
                <div style="font-family:'Space Mono',monospace;font-size:12px;font-weight:800;color:${isSelected ? '#FFD028' : '#F6F8F3'};">${isSeen ? sp.name.toUpperCase() : '-----'}</div>
                <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:10px;color:#94A3B8;">${isSeen ? sp.types.join(' / ') : 'Unknown Species'}</div>
              </div>
            </div>
            <div style="font-family:'Space Mono',monospace;font-size:10px;font-weight:800;color:${sCol};">
              ${isCaught ? '🔴 CAUGHT' : isSeen ? '👁️ SEEN' : '---'}
            </div>
          </div>
        `;
      })
      .join('');

    rosterList.innerHTML = rowsHtml;

    // Attach row click listeners
    const rows = rosterList.querySelectorAll('div[data-dex-id]');
    rows.forEach((row) => {
      row.addEventListener('click', () => {
        const spId = row.getAttribute('data-dex-id');
        if (spId && spId !== this.selectedDexSpeciesId) {
          BattleAudio.playMenuSound('CURSOR');
          this.updatePokedexDetails(spId, caughtSet, seenSet);
        }
      });
    });
  }

  private updatePokedexDetails(speciesId: string, caughtSet: Set<string>, seenSet: Set<string>): void {
    this.selectedDexSpeciesId = speciesId;
    const all = getCompleteDexSpecies();
    const sp = all.find((s) => s.id === speciesId);
    if (!sp) return;

    const isCaught = caughtSet.has(sp.id);
    const isSeen = isCaught || seenSet.has(sp.id);
    const dexNum = String(sp.num).padStart(3, '0');

    // Update Stage Sprite
    const stageSprite = this.pokedexModal.querySelector('#dex-stage-sprite') as HTMLImageElement | null;
    if (stageSprite) {
      stageSprite.src = `./assets/sprites/pokemon/${sp.id}_front.png`;
      stageSprite.style.filter = isSeen ? 'none' : 'brightness(0)';
      stageSprite.style.opacity = isSeen ? '1' : '0.25';
    }

    // Update Stage Labels
    const stageNum = this.pokedexModal.querySelector('#dex-stage-num');
    if (stageNum) stageNum.textContent = `NO. ${dexNum}`;

    const stageName = this.pokedexModal.querySelector('#dex-stage-name');
    if (stageName) stageName.textContent = isSeen ? sp.name.toUpperCase() : '-----';

    const stageCat = this.pokedexModal.querySelector('#dex-stage-category');
    if (stageCat) stageCat.textContent = isSeen ? sp.category.toUpperCase() : 'UNKNOWN CLASSIFICATION';

    const genPill = this.pokedexModal.querySelector('#dex-gen-pill');
    if (genPill) genPill.textContent = `GEN ${sp.gen === 1 ? 'I' : 'II'}`;

    const scanPill = this.pokedexModal.querySelector('#dex-scan-pill') as HTMLElement | null;
    if (scanPill) {
      scanPill.textContent = isCaught ? '🔴 CAUGHT // 100%' : isSeen ? '👁️ OBSERVED' : '🔒 ENCRYPTED';
      scanPill.style.color = isCaught ? '#4ADE80' : isSeen ? '#38BDF8' : '#94A3B8';
    }

    const stageStatus = this.pokedexModal.querySelector('#dex-stage-status') as HTMLElement | null;
    if (stageStatus) {
      stageStatus.textContent = isCaught ? '🔴 CAUGHT IN WILD' : isSeen ? '👁️ SEEN IN REGION' : '🔒 UNREGISTERED';
      stageStatus.style.color = isCaught ? '#4ADE80' : isSeen ? '#38BDF8' : '#64748B';
    }

    // Update Type Capsules
    const typeBay = this.pokedexModal.querySelector('#dex-stage-types');
    if (typeBay) {
      if (isSeen) {
        typeBay.innerHTML = sp.types
          .map((t) => {
            const col = getNeoKantoTypeColor(t);
            return `<span style="background:${col.bg};color:${col.text};padding:3px 10px;border-radius:4px;font-family:'Space Mono',monospace;font-size:10px;font-weight:800;letter-spacing:0.5px;box-shadow:0 2px 0 0 #070B14;">${t.toUpperCase()}</span>`;
          })
          .join('');
      } else {
        typeBay.innerHTML = `<span style="background:#080E1D;border:1px solid #22324F;color:#64748B;padding:3px 8px;border-radius:4px;font-family:'Space Mono',monospace;font-size:10px;font-weight:700;">???</span>`;
      }
    }

    // Update Biometrics
    const heightVal = this.pokedexModal.querySelector('#dex-height-val');
    if (heightVal) heightVal.textContent = isSeen ? `${sp.heightm.toFixed(1)} m` : '?.? m';

    const weightVal = this.pokedexModal.querySelector('#dex-weight-val');
    if (weightVal) weightVal.textContent = isSeen ? `${sp.weightkg.toFixed(1)} kg` : '?.? kg';

    const bstVal = this.pokedexModal.querySelector('#dex-bst-val');
    if (bstVal) bstVal.textContent = isCaught ? String(sp.bst) : isSeen ? `~${sp.bst}` : '---';

    // Update Base Stat Meters
    const statsMap: Array<{ key: keyof typeof sp.baseStats; barId: string; valId: string }> = [
      { key: 'hp', barId: '#dex-bar-hp', valId: '#dex-val-hp' },
      { key: 'atk', barId: '#dex-bar-atk', valId: '#dex-val-atk' },
      { key: 'def', barId: '#dex-bar-def', valId: '#dex-val-def' },
      { key: 'spa', barId: '#dex-bar-spa', valId: '#dex-val-spa' },
      { key: 'spd', barId: '#dex-bar-spd', valId: '#dex-val-spd' },
      { key: 'spe', barId: '#dex-bar-spe', valId: '#dex-val-spe' },
    ];

    statsMap.forEach(({ key, barId, valId }) => {
      const bar = this.pokedexModal.querySelector(barId) as HTMLElement | null;
      const valEl = this.pokedexModal.querySelector(valId);
      if (!bar || !valEl) return;

      if (isCaught || isSeen) {
        const val = sp.baseStats[key];
        const pct = Math.min(100, Math.round((val / 160) * 100));
        const color = val >= 85 ? '#48C774' : val >= 55 ? '#FFD028' : '#EE4238';
        bar.style.width = `${pct}%`;
        bar.style.background = color;
        valEl.textContent = String(val);
      } else {
        bar.style.width = '0%';
        valEl.textContent = '???';
      }
    });

    // Update Lore Text
    const loreEl = this.pokedexModal.querySelector('#dex-lore-text');
    if (loreEl) {
      loreEl.textContent = isCaught || isSeen
        ? sp.lore
        : 'Undiscovered specimen. Telemetry encrypted. Encounter in wild habitats or defeat in trainer battles to catalog telemetry in DexSphere OS.';
    }

    // Update Regional Habitat Tracker
    const habitatListEl = this.pokedexModal.querySelector('#dex-habitat-list');
    const habitatCountEl = this.pokedexModal.querySelector('#dex-habitat-count');
    if (habitatListEl) {
      const habitats = findHabitatsForSpecies(sp.id);
      if (habitatCountEl) {
        habitatCountEl.textContent = isSeen ? `${habitats.length} ZONES` : 'UNKNOWN';
      }
      if (!isSeen) {
        habitatListEl.innerHTML = `<span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #64748B;">🔒 HABITAT ENCRYPTED</span>`;
      } else if (habitats.length === 0) {
        habitatListEl.innerHTML = `<span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8;">🧬 EVOLUTION / SPECIAL GIFT</span>`;
      } else {
        habitatListEl.innerHTML = habitats
          .map(
            (lm) => `
              <button
                type="button"
                class="dex-habitat-chip"
                data-habitat-landmark="${lm.id}"
                style="
                  background: #141E33;
                  border: 1px solid #38BDF8;
                  color: #38BDF8;
                  border-radius: 4px;
                  padding: 3px 7px;
                  font-family: 'Space Mono', monospace;
                  font-size: 10px;
                  font-weight: 700;
                  cursor: pointer;
                "
              >📍 ${lm.name}</button>
            `
          )
          .join('');
        const chips = habitatListEl.querySelectorAll('.dex-habitat-chip');
        chips.forEach((chip) => {
          chip.addEventListener('click', () => {
            const lmId = chip.getAttribute('data-habitat-landmark');
            if (!lmId) return;
            BattleAudio.playMenuSound('CONFIRM');
            this.closeAll();
            if (this.callbacks.onOpenTownMapAtLandmark) {
              this.callbacks.onOpenTownMapAtLandmark(lmId);
            } else if (this.callbacks.onOpenTownMap) {
              this.callbacks.onOpenTownMap();
            }
          });
        });
      }
    }

    // Update selection highlight in roster list without full reload
    const rosterList = this.pokedexModal.querySelector('#dex-roster-list');
    if (rosterList) {
      const rows = rosterList.querySelectorAll('div[data-dex-id]');
      rows.forEach((r) => {
        const rid = r.getAttribute('data-dex-id');
        const isTarget = rid === sp.id;
        const rowEl = r as HTMLElement;
        if (isTarget) {
          rowEl.style.background = '#192846';
          rowEl.style.borderColor = '#FFD028';
          rowEl.style.boxShadow = '0 0 10px rgba(255,208,40,0.35), 0 2px 0 0 #070B14';
        } else {
          rowEl.style.background = '#080E1D';
          const rCaught = caughtSet.has(rid || '');
          const rSeen = rCaught || seenSet.has(rid || '');
          rowEl.style.borderColor = rCaught ? 'rgba(74, 222, 128, 0.4)' : rSeen ? 'rgba(56, 189, 248, 0.4)' : '#22324F';
          rowEl.style.boxShadow = '0 2px 0 0 #070B14';
        }
      });
    }
  }

  public openPokedex(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.menuPanel.style.display = 'none';
    this.pokedexModal.style.display = 'flex';

    const caughtSet = this.stateProvider.getCaughtSpeciesIds?.() ?? new Set<string>();
    const seenSet = this.stateProvider.getSeenSpeciesIds?.() ?? caughtSet;
    const allSpecies = getCompleteDexSpecies();

    if (!this.selectedDexSpeciesId || !allSpecies.some((s) => s.id === this.selectedDexSpeciesId)) {
      const firstCaught = allSpecies.find((s) => caughtSet.has(s.id));
      const firstSeen = allSpecies.find((s) => seenSet.has(s.id));
      this.selectedDexSpeciesId = firstCaught?.id || firstSeen?.id || 'cyndaquil';
    }

    this.renderPokedexModalShell(caughtSet, seenSet);
    this.renderPokedexRoster(caughtSet, seenSet);
    this.updatePokedexDetails(this.selectedDexSpeciesId, caughtSet, seenSet);
  }
}
