import { BattleAudio } from '../../audio/BattleAudio';
import { DEFAULT_NPC_CONTEST_RECORDS } from '../../world/BugContestManager';
import { STADIUM_CHALLENGERS, STADIUM_CUPS } from '../../battle/StadiumArenaManager';
import type { StartMenuStateProvider, StartMenuCallbacks } from '../StartMenuUI';

export const JOHTO_BADGES = [
  { id: 'zephyr', name: 'Zephyr', leader: 'Falkner', icon: '🦅' },
  { id: 'hive', name: 'Hive', leader: 'Bugsy', icon: '🐞' },
  { id: 'plain', name: 'Plain', leader: 'Whitney', icon: '🩷' },
  { id: 'fog', name: 'Fog', leader: 'Morty', icon: '👻' },
  { id: 'storm', name: 'Storm', leader: 'Chuck', icon: '👊' },
  { id: 'mineral', name: 'Mineral', leader: 'Jasmine', icon: '⚙️' },
  { id: 'glacier', name: 'Glacier', leader: 'Pryce', icon: '❄️' },
  { id: 'rising', name: 'Rising', leader: 'Clair', icon: '🐉' },
];

export class TrainerCardAndSaveRenderer {
  constructor(
    private trainerCardModal: HTMLDivElement,
    private contestLeaderboardModal: HTMLDivElement,
    private saveConfirmModal: HTMLDivElement,
    private menuPanel: HTMLDivElement,
    private stateProvider: StartMenuStateProvider,
    private callbacks: StartMenuCallbacks,
    private formatPlayTime: (totalSeconds: number) => string,
    private closeAll: () => void,
    private getSpeedMultiplier: () => number = () => 1
  ) {}

  public openTrainerCard(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.menuPanel.style.display = 'none';
    this.trainerCardModal.style.display = 'flex';

    const name = this.stateProvider.getTrainerName();
    const money = this.stateProvider.getMoney();
    const badges = this.stateProvider.getBadges();
    const caughtCount = this.stateProvider.getCaughtCount();
    const seenCount = this.stateProvider.getSeenSpeciesIds?.()?.size ?? caughtCount;
    const keyItems = this.stateProvider.getKeyItems?.() ?? [];
    const playTime = this.formatPlayTime(this.stateProvider.getPlayTimeSeconds());

    // Calculate clearance stars (0 to 5)
    const starCount = badges.length >= 8 ? 5 : badges.length >= 6 ? 4 : badges.length >= 4 ? 3 : badges.length >= 2 ? 2 : badges.length >= 1 ? 1 : 0;
    const starsGlyphs = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);

    const badgesHtml = JOHTO_BADGES.map((b, i) => {
      const earned =
        badges.some((badge) => badge.toLowerCase().includes(b.id)) || i < badges.length;
      const bg = earned
        ? 'linear-gradient(135deg, rgba(255, 208, 40, 0.18) 0%, rgba(20, 30, 51, 0.85) 100%)'
        : '#080E1D';
      const border = earned ? '#FFD028' : '#22324F';
      const col = earned ? '#FEF08A' : '#64748B';
      const shadow = earned ? '0 0 14px rgba(255,208,40,0.45), 0 3px 0 0 #070B14' : '0 2px 0 0 #070B14';
      const bText = earned ? `${b.name.toUpperCase()}` : b.name.toUpperCase();
      const statusText = earned ? `CLEARED // ${b.leader.toUpperCase()} GYM` : `LOCKED // ${b.leader.toUpperCase()} GYM`;

      return `
        <div
          data-badge-id="${b.id}"
          data-earned="${earned}"
          class="neo-kanto-tactile-btn"
          style="background:${bg};border:1.5px solid ${border};box-shadow:${shadow};border-radius:8px;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:3px;opacity:${earned ? 1 : 0.55};"
        >
          <span style="font-size:22px;filter:${earned ? 'drop-shadow(0 0 6px #FFD028)' : 'grayscale(1)'};">${earned ? b.icon : '🔒'}</span>
          <span style="font-family:'Space Mono',monospace;font-size:10px;font-weight:800;color:${col};">${bText}</span>
          <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:8px;font-weight:700;color:${earned ? '#4ADE80' : '#475569'};">${statusText}</span>
        </div>
      `;
    }).join('');

    const cBg = 'background:#080E1D;border-radius:8px;padding:10px 12px;border:1px solid #22324F;box-shadow:0 2px 0 0 #070B14;';
    const cLbl = 'font-family:\'Space Mono\',monospace;font-size:9px;color:#94A3B8;font-weight:700;letter-spacing:0.5px;';

    this.trainerCardModal.innerHTML = `
      <!-- Top System Telemetry Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #22324F; padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="neo-kanto-pulse-dot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #FFD028; box-shadow: 0 0 8px #FFD028;"></span>
          <span style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: #FFD028; letter-spacing: 0.8px;">REGISTRATION ACTIVE // INDIGO NETWORK VERIFIED</span>
        </div>

        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8;">CHIP: <span style="color: #38BDF8;">SILPH-NFC-v9</span></span>
          <span style="background: #141E33; border: 1px solid #2A75D3; color: #38BDF8; font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">LVL-4 ENCRYPTED</span>
          <button id="close-trainer-card-btn" class="neo-kanto-tactile-btn" style="background: #1E293B; color: #F6F8F3; border: 1.5px solid #475569; border-radius: 6px; padding: 6px 12px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 0 0 #070B14;">← BACK TO MENU</button>
        </div>
      </div>

      <!-- Main Bento Grid: Holographic Passport & Badges Rack -->
      <div id="trainer-card-bento" style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; align-items: stretch;">
        <!-- Left Column: Holographic Trainer Passport -->
        <div style="background: linear-gradient(135deg, rgba(255, 208, 40, 0.4) 0%, rgba(42, 117, 211, 0.6) 50%, rgba(238, 66, 56, 0.3) 100%); padding: 2px; border-radius: 12px; box-shadow: 0 4px 0 0 #070B14;">
          <div style="background: #080E1D; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 14px; height: 100%; box-sizing: border-box; position: relative; overflow: hidden;">
            <!-- Background Watermark -->
            <div style="position: absolute; right: -20px; bottom: -20px; width: 140px; height: 140px; border-radius: 50%; border: 12px solid rgba(255,255,255,0.03); pointer-events: none;"></div>

            <!-- Card Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="background: #FFD028; color: #0D1322; font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">LEAGUE ID</span>
                  <span style="font-family: 'Space Mono', monospace; font-size: 9px; color: #94A3B8; letter-spacing: 0.5px;">INDIGO PLATEAU REGISTRATION</span>
                </div>
                <h1 style="font-family: 'Space Mono', monospace; font-size: 20px; font-weight: 900; color: #FFD028; margin: 4px 0 0 0; letter-spacing: -0.5px;">TRAINER PASSPORT</h1>
              </div>

              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                <span style="font-family: 'Space Mono', monospace; font-size: 9px; color: #94A3B8;">CLEARANCE RANK</span>
                <span style="font-family: 'Space Mono', monospace; font-size: 13px; color: #FFD028; letter-spacing: 2px;">${starsGlyphs}</span>
              </div>
            </div>

            <!-- Profile Info Bay -->
            <div style="display: flex; align-items: center; gap: 12px; background: #141E33; border: 1px solid #22324F; border-radius: 8px; padding: 10px 12px; box-shadow: 0 2px 0 0 #070B14;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #1E293B; border: 2px solid #FFD028; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 0 10px rgba(255,208,40,0.4);">
                🧢
              </div>
              <div style="flex: 1;">
                <div style="font-family: 'Space Mono', monospace; font-size: 18px; font-weight: 900; color: #F6F8F3;">${name}</div>
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 600; color: #38BDF8;">JOHTO LEAGUE CHALLENGER</div>
              </div>
              <div style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 4px 8px; text-align: right;">
                <div style="font-family: 'Space Mono', monospace; font-size: 8px; color: #94A3B8;">PASSPORT NO.</div>
                <div style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; color: #FFD028;">IDNo. 25199</div>
              </div>
            </div>

            <!-- Vitals 2x2 Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div style="${cBg}">
                <div style="${cLbl}">MONEY ACCOUNTS</div>
                <div style="font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 900; color: #FFD028; margin-top: 2px;">$${money.toLocaleString()}</div>
              </div>
              <div style="${cBg}">
                <div style="${cLbl}">SYSTEM TIME</div>
                <div style="font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 800; color: #38BDF8; margin-top: 2px;">⏱️ ${playTime}</div>
              </div>
              <div style="${cBg}">
                <div style="${cLbl}">POKéDEX TELEMETRY</div>
                <div style="font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 800; color: #4ADE80; margin-top: 2px;">📕 ${caughtCount} OWN / ${seenCount} SEEN</div>
              </div>
              <div style="${cBg}">
                <div style="${cLbl}">REGISTERED GEAR</div>
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700; color: #F6F8F3; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${
                  keyItems.length > 0 ? keyItems.join(', ') : 'POKéGEAR'
                }</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Official Johto League Gym Badges Rack -->
        <div style="background: #141E33; border: 1px solid #22324F; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 0 0 #070B14;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #FFD028; letter-spacing: 0.5px;">JOHTO LEAGUE SANCTION</div>
              <div style="font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 900; color: #F6F8F3;">GYM BADGE RACK</div>
            </div>
            <span style="background: #080E1D; border: 1.5px solid #FFD028; color: #FFD028; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; box-shadow: 0 2px 0 0 #070B14;">
              ${badges.length} / 8 CLEARED
            </span>
          </div>

          <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #94A3B8; margin: 0; line-height: 1.4;">
            Official commemorative badges accredited by the Indigo League Regulatory Commission.
          </p>

          <!-- 8 Badges Grid (4 columns x 2 rows) -->
          <div class="trainer-badges-rack" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 4px;">
            ${badgesHtml}
          </div>
        </div>
      </div>
    `;

    this.trainerCardModal.querySelector('#close-trainer-card-btn')?.addEventListener('click', () => {
      BattleAudio.playMenuSound('CANCEL');
      this.trainerCardModal.style.display = 'none';
      this.menuPanel.style.display = 'flex';
    });
  }

  public openBugContestLeaderboard(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.menuPanel.style.display = 'none';
    this.trainerCardModal.style.display = 'none';
    this.contestLeaderboardModal.style.display = 'flex';

    const leaderboard =
      this.stateProvider.getBugContestLeaderboard?.() ?? DEFAULT_NPC_CONTEST_RECORDS.slice(0, 5);
    const personalBest = this.stateProvider.getBugContestPersonalBest?.() ?? null;

    const rankBadge = (idx: number) => {
      if (idx === 0) return '🥇 #1';
      if (idx === 1) return '🥈 #2';
      if (idx === 2) return '🥉 #3';
      return `#${idx + 1}`;
    };

    const leaderboardRowsHtml = leaderboard
      .map((entry, idx) => {
        const isPlayerRow = entry.isPlayer;
        const borderCol = isPlayerRow ? '#FFD028' : idx === 0 ? '#38BDF8' : '#22324F';
        const bgCol = isPlayerRow ? 'rgba(255, 208, 40, 0.12)' : '#080E1D';
        const gradeCol =
          entry.grade === 'S'
            ? '#FFD028'
            : entry.grade === 'A'
            ? '#4ADE80'
            : entry.grade === 'B'
            ? '#38BDF8'
            : '#94A3B8';

        return `
          <div
            data-contest-rank="${idx + 1}"
            style="display: grid; grid-template-columns: 64px 1.2fr 1.1fr 80px 56px; align-items: center; gap: 8px; background: ${bgCol}; border: 1.5px solid ${borderCol}; border-radius: 8px; padding: 8px 12px; font-family: 'Space Mono', monospace; font-size: 11px;"
          >
            <span style="font-weight: 900; color: ${idx === 0 ? '#FFD028' : '#F6F8F3'};">${rankBadge(idx)}</span>
            <span style="font-weight: 800; color: ${isPlayerRow ? '#FFD028' : '#F6F8F3'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${entry.trainerName}${isPlayerRow ? ' (YOU)' : ''}</span>
            <span style="color: #38BDF8; font-weight: 700;">🐞 ${entry.speciesId.toUpperCase()} Lv.${entry.level}</span>
            <span style="font-weight: 900; color: #4ADE80; text-align: right;">${entry.score} PTS</span>
            <span style="background: #141E33; border: 1px solid ${gradeCol}; color: ${gradeCol}; border-radius: 4px; padding: 2px 6px; text-align: center; font-weight: 900;">${entry.grade}</span>
          </div>
        `;
      })
      .join('');

    const stadiumCardsHtml = STADIUM_CHALLENGERS.map((challenger) => {
      const isDouble = Boolean(challenger.rules.isDoubleBattle);
      const defaultCup = challenger.cupId || (isDouble ? 'prime_double_cup' : 'poke_cup');
      const weatherTag =
        challenger.id === 'stadium_weather_lance_clair' ? '🌧️ RAIN CLASH' : isDouble ? '⚔️ 2v2 DOUBLE' : '🥊 1v1 SINGLE';

      return `
        <div
          data-stadium-card="${challenger.id}"
          style="background: #080E1D; border: 1.5px solid #22324F; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;"
        >
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
              <span style="font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 900; color: #FFD028; background: #141E33; border: 1px solid #FFD028; padding: 2px 6px; border-radius: 4px;">${weatherTag}</span>
              <span style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 800; color: #4ADE80;">+$${challenger.rewardMoney}</span>
            </div>
            <div style="font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 900; color: #F6F8F3; margin-top: 6px;">${challenger.name}</div>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">${challenger.title} — ${challenger.rules.cupName || 'Stadium Rules'}</div>
          </div>
          <button
            id="launch-stadium-${challenger.id}"
            data-stadium-challenger="${challenger.id}"
            data-stadium-cup="${defaultCup}"
            class="neo-kanto-tactile-btn"
            style="background: #1E3A8A; color: #F6F8F3; border: 1.5px solid #38BDF8; border-radius: 6px; padding: 7px 10px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 900; cursor: pointer; width: 100%; box-shadow: 0 2px 0 0 #070B14;"
          >
            🏟️ CHALLENGE (${isDouble ? '2v2 DOUBLE BATTLE' : '1v1 STADIUM'})
          </button>
        </div>
      `;
    }).join('');

    this.contestLeaderboardModal.innerHTML = `
      <!-- Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #22324F; padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="neo-kanto-pulse-dot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #4ADE80; box-shadow: 0 0 8px #4ADE80;"></span>
          <div>
            <div style="font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; color: #4ADE80; letter-spacing: 0.8px;">NATIONAL PARK & GOLDENROD COLOSSEUM // OFFICIAL STANDINGS</div>
            <h2 style="font-family: 'Space Mono', monospace; margin: 2px 0 0 0; font-size: 18px; font-weight: 900; color: #F6F8F3;">🏆 BUG-CATCHING CONTEST & STADIUM ARENA</h2>
          </div>
        </div>
        <button id="close-contest-leaderboard-btn" class="neo-kanto-tactile-btn" style="background: #1E293B; color: #F6F8F3; border: 1.5px solid #475569; border-radius: 6px; padding: 6px 12px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 0 0 #070B14;">← BACK TO MENU</button>
      </div>

      <!-- Two-Column Bento: Bug Contest Leaderboard + Stadium Arena -->
      <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 14px; align-items: start;">
        <!-- Left Column: National Park Bug-Catching Contest Leaderboard -->
        <div style="background: #141E33; border: 1px solid #22324F; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 0 0 #070B14;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 900; color: #FFD028;">🐞 NATIONAL PARK TOP 5 STANDINGS</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #94A3B8;">TUE / THU / SAT</span>
          </div>

          <div id="contest-personal-best-banner" style="background: #080E1D; border: 1.5px solid ${personalBest ? '#4ADE80' : '#22324F'}; border-radius: 8px; padding: 8px 12px; font-family: 'Space Mono', monospace; font-size: 11px; color: ${personalBest ? '#4ADE80' : '#94A3B8'};">
            ${
              personalBest
                ? `⭐ PERSONAL BEST: ${personalBest.score} PTS (${personalBest.speciesId.toUpperCase()} Lv.${personalBest.level} — ${personalBest.grade})`
                : '📋 PERSONAL BEST: No entry recorded yet. Speak to the National Park Gate Officer on Tue/Thu/Sat!'
            }
          </div>

          <div id="contest-leaderboard-list" style="display: flex; flex-direction: column; gap: 6px;">
            ${leaderboardRowsHtml}
          </div>

          <div style="background: #080E1D; border: 1px solid #22324F; border-radius: 6px; padding: 8px 10px; font-size: 10px; color: #94A3B8; line-height: 1.4;">
            <strong style="color: #FFD028; font-family: 'Space Mono', monospace;">JUDGE SCORING FORMULA:</strong>
            Base Species Score + (Level × 4) + (Current HP% × 100) + IV Total. Grade A+ / A awards a Sun Stone!
          </div>
        </div>

        <!-- Right Column: Johto Stadium 2v2 Double Battle Arena -->
        <div id="stadium-arena-section" style="background: #141E33; border: 1px solid #22324F; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 0 0 #070B14;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 900; color: #38BDF8;">🏟️ JOHTO STADIUM CUP ARENA</span>
            <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #FFD028;">1v1 & 2v2 MODES</span>
          </div>

          <div style="font-size: 11px; color: #94A3B8; line-height: 1.35;">
            Challenge Ranked Stadium Cups featuring simultaneous <strong style="color: #F6F8F3;">2v2 Double Battles</strong>, spread moves (0.75× damage), Item Clause, and Weather Clash arenas (${STADIUM_CUPS.map((c) => c.cupName).join(' • ')}).
          </div>

          <div id="stadium-challengers-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${stadiumCardsHtml}
          </div>
        </div>
      </div>
    `;

    this.contestLeaderboardModal
      .querySelector('#close-contest-leaderboard-btn')
      ?.addEventListener('click', () => {
        BattleAudio.playMenuSound('CANCEL');
        this.contestLeaderboardModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
      });

    const launchBtns = this.contestLeaderboardModal.querySelectorAll('button[data-stadium-challenger]');
    launchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const challengerId = btn.getAttribute('data-stadium-challenger');
        const cupId = btn.getAttribute('data-stadium-cup') || 'prime_double_cup';
        if (challengerId) {
          BattleAudio.playMenuSound('CONFIRM');
          this.closeAll();
          this.callbacks.onLaunchStadiumBattle?.(challengerId, cupId);
        }
      });
    });
  }

  public openSaveConfirm(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.menuPanel.style.display = 'none';
    this.saveConfirmModal.style.display = 'flex';

    const name = this.stateProvider.getTrainerName();
    const mapName = this.stateProvider.getMapName();
    const badgesCount = this.stateProvider.getBadges().length;
    const pokedexCount = this.stateProvider.getCaughtCount ? this.stateProvider.getCaughtCount() : 0;
    const playTime = this.formatPlayTime(this.stateProvider.getPlayTimeSeconds());

    this.saveConfirmModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #22324F; padding-bottom: 10px;">
        <div style="font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 800; color: #38bdf8; letter-spacing: 0.6px; display: flex; align-items: center; gap: 6px;">
          <span class="neo-kanto-pulse-dot" style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 6px #38bdf8;"></span>
          <span>💾 MEMORY CARD // SAVE CONSOLE</span>
        </div>
        <span style="font-family: 'Space Mono', monospace; font-size: 10px; color: #4ADE80; background: #080E1D; border: 1px solid #22324F; padding: 2px 6px; border-radius: 4px;">SLOT 1</span>
      </div>

      <div class="nk-save-slot-card" style="background: #080E1D; border: 1.5px solid #22324F; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 7px; font-family: 'Space Mono', monospace; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #94a3b8;">PLAYER</span><strong style="color: #38BDF8;">${name}</strong></div>
        <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #94a3b8;">LOCATION</span><strong style="color: #F8FAFC;">${mapName}</strong></div>
        <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #94a3b8;">BADGES</span><strong style="color: #FFD028;">${badgesCount}</strong></div>
        <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #94a3b8;">POKéDEX</span><strong style="color: #4ADE80;">${pokedexCount}</strong></div>
        <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #94a3b8;">TIME</span><strong style="color: #E2E8F0;">${playTime}</strong></div>
      </div>

      <div id="save-confirm-status" style="font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: #f8fafc; text-align: center; padding: 4px 0;">
        Would you like to save the game?
      </div>

      <div id="save-confirm-buttons" style="display: flex; gap: 10px;">
        <button id="confirm-save-yes-btn" class="neo-kanto-tactile-btn" style="
          flex: 1;
          background: #059669;
          color: white;
          border: 1.5px solid #34D399;
          box-shadow: 0 4px 0 0 #070B14;
          border-radius: 8px;
          padding: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        ">YES, SAVE</button>
        <button id="confirm-save-no-btn" class="neo-kanto-tactile-btn" style="
          flex: 1;
          background: #1E293B;
          color: white;
          border: 1.5px solid #475569;
          box-shadow: 0 4px 0 0 #070B14;
          border-radius: 8px;
          padding: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        ">NO</button>
      </div>
    `;

    const yesBtn = this.saveConfirmModal.querySelector('#confirm-save-yes-btn') as HTMLButtonElement;
    const noBtn = this.saveConfirmModal.querySelector('#confirm-save-no-btn') as HTMLButtonElement;
    const statusText = this.saveConfirmModal.querySelector('#save-confirm-status') as HTMLDivElement;
    const btnsRow = this.saveConfirmModal.querySelector('#save-confirm-buttons') as HTMLDivElement;

    yesBtn.addEventListener('click', async () => {
      btnsRow.style.display = 'none';
      statusText.style.color = '#38bdf8';
      statusText.innerText = "SAVING... DON'T TURN OFF THE POWER.";
      await this.callbacks.onSaveGame();
      BattleAudio.playMenuSound('SAVE');
      statusText.style.color = '#4ade80';
      statusText.innerText = `💾 ${name} saved the game!`;
      const closeDelay = 850 / this.getSpeedMultiplier();
      setTimeout(() => {
        this.closeAll();
      }, closeDelay);
    });

    noBtn.addEventListener('click', () => {
      BattleAudio.playMenuSound('CANCEL');
      this.saveConfirmModal.style.display = 'none';
      this.menuPanel.style.display = 'flex';
    });
  }
}
