import type {
  SpeedMultiplier,
  TouchControlStyle,
  ExpShareMode,
  EncounterRateMode,
  GbcPaletteMode,
} from '../types/game';
import { BattleAudio } from '../audio/BattleAudio';
import { PokemonFactory } from '../battle/PokemonFactory';
import { findHabitatsForSpecies } from '../world/townMapData';
import { GBC_PALETTE_SPECS } from './DisplayThemeManager';
import { DEFAULT_NPC_CONTEST_RECORDS, type BugContestLeaderboardEntry } from '../world/BugContestManager';
import { STADIUM_CUPS, STADIUM_CHALLENGERS } from '../battle/StadiumArenaManager';
import { Dex } from '@pkmn/dex';

export const JOHTO_DEX_SPECIES: Array<{ id: string; name: string; types: string[] }> = [
  { id: 'cyndaquil', name: 'Cyndaquil', types: ['Fire'] },
  { id: 'sentret', name: 'Sentret', types: ['Normal'] },
  { id: 'pidgey', name: 'Pidgey', types: ['Normal', 'Flying'] },
  { id: 'pidgeotto', name: 'Pidgeotto', types: ['Normal', 'Flying'] },
  { id: 'spearow', name: 'Spearow', types: ['Normal', 'Flying'] },
  { id: 'rattata', name: 'Rattata', types: ['Normal'] },
  { id: 'hoot-hoot', name: 'Hoothoot', types: ['Normal', 'Flying'] },
  { id: 'hoppip', name: 'Hoppip', types: ['Grass', 'Flying'] },
  { id: 'caterpie', name: 'Caterpie', types: ['Bug'] },
  { id: 'weedle', name: 'Weedle', types: ['Bug', 'Poison'] },
  { id: 'ledyba', name: 'Ledyba', types: ['Bug', 'Flying'] },
  { id: 'spinarak', name: 'Spinarak', types: ['Bug', 'Poison'] },
  { id: 'bellsprout', name: 'Bellsprout', types: ['Grass', 'Poison'] },
  { id: 'poliwag', name: 'Poliwag', types: ['Water'] },
  { id: 'poliwhirl', name: 'Poliwhirl', types: ['Water'] },
  { id: 'marill', name: 'Marill', types: ['Water'] },
  { id: 'togepi', name: 'Togepi', types: ['Normal'] },
  { id: 'sudowoodo', name: 'Sudowoodo', types: ['Rock'] },
  { id: 'geodude', name: 'Geodude', types: ['Rock', 'Ground'] },
  { id: 'gastly', name: 'Gastly', types: ['Ghost', 'Poison'] },
  { id: 'smeargle', name: 'Smeargle', types: ['Normal'] },
  { id: 'raikou', name: 'Raikou', types: ['Electric'] },
  { id: 'entei', name: 'Entei', types: ['Fire'] },
  { id: 'suicune', name: 'Suicune', types: ['Water'] },
];

export interface DexSpeciesData {
  num: number;
  id: string;
  name: string;
  types: string[];
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  bst: number;
  weightkg: number;
  heightm: number;
  category: string;
  lore: string;
  gen: number;
}

const CANONICAL_SPECIES_DATA: Record<string, { category: string; heightm: number; lore: string }> = {
  chikorita: {
    category: 'Leaf Pokémon',
    heightm: 0.9,
    lore: 'A sweet aroma gently wafts from the leaf on its head. It is docile and loves to soak up the sun.',
  },
  bayleef: {
    category: 'Leaf Pokémon',
    heightm: 1.2,
    lore: 'The scent of spices comes from around its neck. Somehow, sniffing it makes you want to fight.',
  },
  meganium: {
    category: 'Herb Pokémon',
    heightm: 1.8,
    lore: 'The aroma that rises from its petals contains a substance that calms aggressive feelings.',
  },
  cyndaquil: {
    category: 'Fire Mouse Pokémon',
    heightm: 0.5,
    lore: 'It is timid, and always curls itself up into a ball. If attacked, it flares up its back for protection.',
  },
  quilava: {
    category: 'Volcano Pokémon',
    heightm: 0.9,
    lore: 'Be careful if it turns its back during battle. It means that it will attack with searing fire on its back.',
  },
  typhlosion: {
    category: 'Volcano Pokémon',
    heightm: 1.7,
    lore: 'If its rage peaks, it becomes so hot that anything that touches it will instantly go up in flames.',
  },
  totodile: {
    category: 'Big Jaw Pokémon',
    heightm: 0.6,
    lore: 'It is small but rough and tough. It will bite anything that moves in front of it without hesitation.',
  },
  croconaw: {
    category: 'Big Jaw Pokémon',
    heightm: 1.1,
    lore: 'The tips of its fangs are slanted backward. Once those fangs clamp down, prey has no hope of escape.',
  },
  feraligatr: {
    category: 'Big Jaw Pokémon',
    heightm: 2.3,
    lore: 'It is tough to hold back when it attacks. It swings its massive arms to bring down its opponents.',
  },
  sentret: {
    category: 'Scout Pokémon',
    heightm: 0.8,
    lore: 'A very cautious Pokémon, it raises itself up on its tail to get a better view of its surroundings.',
  },
  furret: {
    category: 'Long Body Pokémon',
    heightm: 1.8,
    lore: 'It makes a nest to suit its long and skinny body. The nest is impossible for other Pokémon to enter.',
  },
  hoothoot: {
    category: 'Owl Pokémon',
    heightm: 0.7,
    lore: 'It always stands on one foot. It changes feet so fast, the movement can rarely be seen.',
  },
  noctowl: {
    category: 'Owl Pokémon',
    heightm: 1.6,
    lore: 'Its eyes are specially adapted. They concentrate even faint light and enable it to see in the dark.',
  },
  ledyba: {
    category: 'Five Star Pokémon',
    heightm: 1.0,
    lore: 'It is very timid. It will be afraid to move if it is alone. But it will be active if it is in a group.',
  },
  spinarak: {
    category: 'String Spit Pokémon',
    heightm: 0.5,
    lore: 'It lies still in the same pose for days in its web, waiting for its unsuspecting prey to wander close.',
  },
  pidgey: {
    category: 'Tiny Bird Pokémon',
    heightm: 0.3,
    lore: 'It usually hides in tall grass. Because it dislikes fighting, it protects itself by kicking up sand.',
  },
  pidgeotto: {
    category: 'Bird Pokémon',
    heightm: 1.1,
    lore: 'It has outstanding vision. However high it flies, it is able to distinguish the movements of its prey.',
  },
  spearow: {
    category: 'Tiny Bird Pokémon',
    heightm: 0.3,
    lore: 'It flaps its short wings diligently to fly among wild grass while searching for insects.',
  },
  rattata: {
    category: 'Mouse Pokémon',
    heightm: 0.3,
    lore: 'Bites anything when it attacks. Small and very quick, it is a common sight in places across Johto.',
  },
  bellsprout: {
    category: 'Flower Pokémon',
    heightm: 0.7,
    lore: 'Even though its body is extremely skinny, it is blindingly fast when catching its prey.',
  },
  geodude: {
    category: 'Rock Pokémon',
    heightm: 0.4,
    lore: 'Most people do not notice, but when you look closely at rocks along paths, they may be Geodude.',
  },
  gastly: {
    category: 'Gas Pokémon',
    heightm: 1.3,
    lore: 'Almost invisible, this gaseous Pokémon cloaks the target and puts it to sleep without warning.',
  },
  zubat: {
    category: 'Bat Pokémon',
    heightm: 0.8,
    lore: 'Capable of flying safely in dark places, it emits ultrasonic cries to check for any obstacles.',
  },
  slowpoke: {
    category: 'Dopey Pokémon',
    heightm: 1.2,
    lore: 'It is always vacantly lost in thought, but nobody knows what it is thinking about in Slowpoke Well.',
  },
  mareep: {
    category: 'Wool Pokémon',
    heightm: 0.6,
    lore: 'Its fleece grows continually. In summer, the fleece is sheared, but it grows back in a week.',
  },
  marill: {
    category: 'Aqua Mouse Pokémon',
    heightm: 0.4,
    lore: 'The tip of its tail, which contains oil lighter than water, lets it swim without drowning.',
  },
  sudowoodo: {
    category: 'Imitation Pokémon',
    heightm: 1.2,
    lore: 'Although it always pretends to be a tree, its composition is closer to a rock than a plant.',
  },
  togepi: {
    category: 'Spike Ball Pokémon',
    heightm: 0.3,
    lore: 'The shell seems to be filled with joy. It is said that it will share good luck when treated kindly.',
  },
  scyther: {
    category: 'Mantis Pokémon',
    heightm: 1.5,
    lore: 'It slashes through grass with its sharp scythes, moving too fast for the human eye to track.',
  },
  heracross: {
    category: 'Single Horn Pokémon',
    heightm: 1.5,
    lore: 'Usually docile, but if disturbed while sipping honey, it chases off intruders with its great horn.',
  },
  raikou: {
    category: 'Thunder Pokémon',
    heightm: 1.9,
    lore: 'The rain clouds it carries let it fire thunderbolts at will. They say that it descended with lightning.',
  },
  entei: {
    category: 'Volcano Pokémon',
    heightm: 2.1,
    lore: 'Volcanoes erupt when it barks. Unable to restrain its extreme power, it races headlong around the land.',
  },
  suicune: {
    category: 'Aurora Pokémon',
    heightm: 2.0,
    lore: 'Said to be the reincarnation of north winds, it can instantly purify filthy, murky water.',
  },
  pikachu: {
    category: 'Mouse Pokémon',
    heightm: 0.4,
    lore: 'When several of these Pokémon gather, their electricity could build and cause lightning storms.',
  },
  bulbasaur: {
    category: 'Seed Pokémon',
    heightm: 0.7,
    lore: 'A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokémon.',
  },
  charmander: {
    category: 'Lizard Pokémon',
    heightm: 0.6,
    lore: 'The flame on its tail indicates its life force. If the Pokémon is healthy, the flame burns brightly.',
  },
  squirtle: {
    category: 'Tiny Turtle Pokémon',
    heightm: 0.5,
    lore: 'Shoots water at prey while in the water. Withdraws into its shell when in danger from foes.',
  },
};

function getNeoKantoTypeColor(type: string): { bg: string; text: string } {
  switch (type.toLowerCase()) {
    case 'fire': return { bg: '#EE4238', text: '#F6F8F3' };
    case 'water': return { bg: '#2A75D3', text: '#F6F8F3' };
    case 'grass': return { bg: '#48C774', text: '#0D1322' };
    case 'electric': return { bg: '#FFD028', text: '#0D1322' };
    case 'ice': return { bg: '#98D8D8', text: '#0D1322' };
    case 'fighting': return { bg: '#C03028', text: '#F6F8F3' };
    case 'poison': return { bg: '#9B51E0', text: '#F6F8F3' };
    case 'ground': return { bg: '#E0C068', text: '#0D1322' };
    case 'flying': return { bg: '#74B9FF', text: '#0D1322' };
    case 'psychic': return { bg: '#F85888', text: '#F6F8F3' };
    case 'bug': return { bg: '#A8B820', text: '#0D1322' };
    case 'rock': return { bg: '#B8A038', text: '#F6F8F3' };
    case 'ghost': return { bg: '#705898', text: '#F6F8F3' };
    case 'dragon': return { bg: '#5E5CE6', text: '#F6F8F3' };
    case 'steel': return { bg: '#8A9BA8', text: '#0D1322' };
    case 'dark': return { bg: '#705746', text: '#F6F8F3' };
    case 'fairy': return { bg: '#EE99AC', text: '#0D1322' };
    default: return { bg: '#8A9BA8', text: '#0D1322' };
  }
}

let cachedDexList: DexSpeciesData[] | null = null;
function getCompleteDexSpecies(): DexSpeciesData[] {
  if (cachedDexList) return cachedDexList;

  const raw = Dex.species.all().filter((s) => s.num >= 1 && s.num <= 251 && !s.forme);
  cachedDexList = raw.map((sp) => {
    const custom = CANONICAL_SPECIES_DATA[sp.id];
    const category = custom?.category || `${sp.types.join('/')} POKéMON`;
    const heightm = custom?.heightm || Number(((sp.weightkg || 10) * 0.08 + 0.3).toFixed(1));
    const lore =
      custom?.lore ||
      `Specimen #${String(sp.num).padStart(3, '0')} recorded in the regional Johto/Kanto research archives. Baseline battle telemetry BST is ${sp.bst}.`;

    return {
      num: sp.num,
      id: sp.id,
      name: sp.name,
      types: sp.types,
      baseStats: sp.baseStats,
      bst: sp.bst,
      weightkg: sp.weightkg,
      heightm,
      category,
      lore,
      gen: sp.gen || (sp.num <= 151 ? 1 : 2),
    };
  });

  return cachedDexList;
}

export interface StartMenuStateProvider {
  getTrainerName: () => string;
  getMoney: () => number;
  getBadges: () => string[];
  getPartyCount: () => number;
  getCaughtCount: () => number;
  getCaughtSpeciesIds?: () => Set<string>;
  getSeenSpeciesIds?: () => Set<string>;
  getKeyItems?: () => string[];
  getPlayTimeSeconds: () => number;
  getMapName: () => string;
  isMuted?: () => boolean;
  getSpeedMultiplier?: () => SpeedMultiplier;
  isGamepadActive?: () => boolean;
  getTouchControlStyle?: () => TouchControlStyle;
  getExpShareMode?: () => ExpShareMode;
  getEncounterRateMode?: () => EncounterRateMode;
  getAutoHm?: () => boolean;
  getCrtScanlines?: () => boolean;
  getGbcPalette?: () => GbcPaletteMode;
  getLevelCap?: () => number;
  getGymAceLevel?: () => number;
  getBugContestLeaderboard?: () => BugContestLeaderboardEntry[];
  getBugContestPersonalBest?: () => BugContestLeaderboardEntry | null;
}

export interface StartMenuCallbacks {
  onOpenParty: () => void;
  onOpenBag: () => void;
  onOpenPokegear: () => void;
  onOpenTownMap?: () => void;
  onOpenTownMapAtLandmark?: (landmarkId: string) => void;
  onOpenMissions?: () => void;
  onLaunchStadiumBattle?: (challengerId: string, cupId: string) => void;
  onSaveGame: () => Promise<void>;
  onToggleMute?: () => boolean;
  onCycleSpeed?: () => SpeedMultiplier;
  onToggleGamepad?: () => boolean;
  onToggleTouchControlStyle?: () => TouchControlStyle;
  onCycleExpShareMode?: () => ExpShareMode;
  onSetExpShareMode?: (mode: ExpShareMode) => ExpShareMode | void;
  onSetEncounterRateMode?: (mode: EncounterRateMode) => EncounterRateMode | void;
  onToggleAutoHm?: (enabled: boolean) => boolean | void;
  onToggleCrtScanlines?: (enabled: boolean) => boolean | void;
  onSetGbcPalette?: (palette: GbcPaletteMode) => GbcPaletteMode | void;
}

const JOHTO_BADGES = [
  { id: 'zephyr', name: 'Zephyr', leader: 'Falkner', icon: '🦅' },
  { id: 'hive', name: 'Hive', leader: 'Bugsy', icon: '🐞' },
  { id: 'plain', name: 'Plain', leader: 'Whitney', icon: '🩷' },
  { id: 'fog', name: 'Fog', leader: 'Morty', icon: '👻' },
  { id: 'storm', name: 'Storm', leader: 'Chuck', icon: '👊' },
  { id: 'mineral', name: 'Mineral', leader: 'Jasmine', icon: '⚙️' },
  { id: 'glacier', name: 'Glacier', leader: 'Pryce', icon: '❄️' },
  { id: 'rising', name: 'Rising', leader: 'Clair', icon: '🐉' },
];

export class StartMenuUI {
  private container: HTMLElement;
  private menuPanel!: HTMLDivElement;
  private pokedexModal!: HTMLDivElement;
  private trainerCardModal!: HTMLDivElement;
  private contestLeaderboardModal!: HTMLDivElement;
  private saveConfirmModal!: HTMLDivElement;
  private settingsModal!: HTMLDivElement;
  private stateProvider: StartMenuStateProvider;
  private callbacks: StartMenuCallbacks;
  private cursorIndex: number = 0;
  private speedMultiplier: SpeedMultiplier = 1;
  private menuItems: Array<{ id: string; label: string; icon: string; shortcut: string; action: () => void }> = [];

  // Pokedex interactive workstation state
  private selectedDexSpeciesId: string = 'cyndaquil';
  private dexFilter: 'ALL' | 'JOHTO' | 'KANTO' | 'CAUGHT' | 'SEEN' | 'HABITAT' = 'ALL';
  private dexSearchQuery: string = '';
  private dexSort: 'num' | 'bst' | 'name' | 'mass' = 'num';

  constructor(
    containerId: string = 'modal-container',
    stateProvider: StartMenuStateProvider,
    callbacks: StartMenuCallbacks
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`UI Container #${containerId} not found`);
    this.container = el;
    this.stateProvider = stateProvider;
    this.callbacks = callbacks;
    this.ensureNeoKantoStyles();

    this.menuItems = [
      {
        id: 'start-opt-pokedex',
        label: 'POKéDEX',
        icon: '📕',
        shortcut: 'P',
        action: () => {
          this.openPokedex();
        },
      },
      {
        id: 'start-opt-pokemon',
        label: 'POKéMON',
        icon: '🟢',
        shortcut: 'K',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenParty();
        },
      },
      {
        id: 'start-opt-bag',
        label: 'BAG',
        icon: '🎒',
        shortcut: 'B',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenBag();
        },
      },
      {
        id: 'start-opt-pokegear',
        label: 'POKéGEAR',
        icon: '📻',
        shortcut: 'G',
        action: () => {
          this.hideMenuOnly();
          this.callbacks.onOpenPokegear();
        },
      },
      {
        id: 'start-opt-missions',
        label: 'MISSIONS',
        icon: '📜',
        shortcut: 'M',
        action: () => {
          BattleAudio.playMenuSound('CONFIRM');
          this.hideMenuOnly();
          this.callbacks.onOpenMissions?.();
        },
      },
      {
        id: 'start-opt-contests',
        label: 'CONTESTS',
        icon: '🏆',
        shortcut: 'C',
        action: () => {
          this.openBugContestLeaderboard();
        },
      },
      {
        id: 'start-opt-trainer',
        label: this.stateProvider.getTrainerName() || 'TRAINER',
        icon: '🪪',
        shortcut: 'T',
        action: () => {
          this.openTrainerCard();
        },
      },
      {
        id: 'start-opt-save',
        label: 'SAVE',
        icon: '💾',
        shortcut: 'S',
        action: () => {
          this.openSaveConfirm();
        },
      },
      {
        id: 'start-opt-settings',
        label: 'SETTINGS',
        icon: '⚙️',
        shortcut: 'O',
        action: () => {
          this.openSettings();
        },
      },
      {
        id: 'start-opt-cancel',
        label: 'CANCEL',
        icon: '✕',
        shortcut: '9',
        action: () => {
          BattleAudio.playMenuSound('CANCEL');
          this.closeAll();
        },
      },
    ];

    this.createUI();
  }

  public setSpeedMultiplier(speed: SpeedMultiplier): void {
    this.speedMultiplier = speed;
    const dur = (0.16 / this.speedMultiplier).toFixed(2);
    if (this.menuPanel) this.menuPanel.style.transition = `opacity ${dur}s ease, transform ${dur}s ease`;
  }

  public isOpen(): boolean {
    return (
      this.menuPanel?.style.display === 'flex' ||
      this.pokedexModal?.style.display === 'flex' ||
      this.trainerCardModal?.style.display === 'flex' ||
      this.contestLeaderboardModal?.style.display === 'flex' ||
      this.saveConfirmModal?.style.display === 'flex' ||
      this.settingsModal?.style.display === 'flex'
    );
  }

  public toggle(): void {
    if (this.isOpen()) {
      BattleAudio.playMenuSound('CANCEL');
      this.closeAll();
    } else {
      this.open();
    }
  }

  public open(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.pokedexModal.style.display = 'none';
    this.trainerCardModal.style.display = 'none';
    this.contestLeaderboardModal.style.display = 'none';
    this.saveConfirmModal.style.display = 'none';
    this.settingsModal.style.display = 'none';
    this.menuPanel.style.display = 'flex';
    this.renderMenuItems();
  }

  private hideMenuOnly(): void {
    this.menuPanel.style.display = 'none';
  }

  public closeAll(): void {
    this.menuPanel.style.display = 'none';
    this.pokedexModal.style.display = 'none';
    this.trainerCardModal.style.display = 'none';
    this.contestLeaderboardModal.style.display = 'none';
    this.saveConfirmModal.style.display = 'none';
    this.settingsModal.style.display = 'none';
  }

  private ensureNeoKantoStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('neo-kanto-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'neo-kanto-ui-styles';
    style.textContent = `
      .neo-kanto-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-track {
        background: #080E1D;
        border-radius: 4px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-thumb {
        background: #22324F;
        border-radius: 4px;
      }
      .neo-kanto-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #2A75D3;
      }
      .neo-kanto-tactile-btn {
        transition: transform 0.08s ease, box-shadow 0.08s ease, filter 0.12s ease;
      }
      .neo-kanto-tactile-btn:hover {
        filter: brightness(1.12);
      }
      .neo-kanto-tactile-btn:active {
        transform: translateY(2px) !important;
        box-shadow: 0 1px 0 0 #070B14 !important;
      }
      @keyframes neoKantoPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.45; transform: scale(0.9); }
      }
      .neo-kanto-pulse-dot {
        animation: neoKantoPulse 1.8s ease-in-out infinite;
      }
      @media (max-width: 768px) {
        #pokedex-modal {
          width: 95vw !important;
          height: 92dvh !important;
          max-height: 92dvh !important;
          padding: 12px !important;
        }
        #pokedex-modal-workstation {
          flex-direction: column !important;
          overflow-y: auto !important;
        }
        #dex-roster-column {
          max-width: 100% !important;
          flex: none !important;
          max-height: 200px !important;
        }
        #dex-telemetry-column {
          max-width: 100% !important;
          flex: none !important;
        }
        #trainer-card-modal {
          width: 95vw !important;
          max-height: 92dvh !important;
          padding: 14px !important;
        }
        #trainer-card-bento {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
      }
    `;
    document.head?.appendChild(style);
  }

  public handleKeyDown(e: KeyboardEvent): boolean {
    if (!this.isOpen()) return false;

    if (this.pokedexModal.style.display === 'flex') {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (isInput && e.code !== 'Escape') {
        return false;
      }
      if (e.code === 'Escape' || e.code === 'KeyZ') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.pokedexModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
        return true;
      }
      return true;
    }

    if (this.trainerCardModal.style.display === 'flex') {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.trainerCardModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
        return true;
      }
      return true;
    }

    if (this.contestLeaderboardModal.style.display === 'flex') {
      if (e.code === 'Escape' || e.code === 'KeyZ') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.contestLeaderboardModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
        return true;
      }
      return true;
    }

    if (this.saveConfirmModal.style.display === 'flex') {
      if (e.code === 'Escape') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.saveConfirmModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
        return true;
      }
      return true;
    }

    if (this.settingsModal.style.display === 'flex') {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
        e.preventDefault();
        BattleAudio.playMenuSound('CANCEL');
        this.settingsModal.style.display = 'none';
        this.menuPanel.style.display = 'flex';
        return true;
      }
      return true;
    }

    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      BattleAudio.playMenuSound('CURSOR');
      this.cursorIndex = (this.cursorIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.renderMenuItems();
      return true;
    }
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      BattleAudio.playMenuSound('CURSOR');
      this.cursorIndex = (this.cursorIndex + 1) % this.menuItems.length;
      this.renderMenuItems();
      return true;
    }
    if (this.triggerShortcut(e.code, true)) {
      e.preventDefault();
      return true;
    }
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
      e.preventDefault();
      const chosen = this.menuItems[this.cursorIndex];
      if (chosen) chosen.action();
      return true;
    }
    if (e.code === 'Escape') {
      e.preventDefault();
      BattleAudio.playMenuSound('CANCEL');
      this.closeAll();
      return true;
    }

    return true;
  }

  public triggerShortcut(code: string, allowSaveAndDigits: boolean = false): boolean {
    const shortcutByCode: Record<string, string> = {
      KeyP: 'start-opt-pokedex',
      KeyK: 'start-opt-pokemon',
      KeyB: 'start-opt-bag',
      KeyG: 'start-opt-pokegear',
      KeyM: 'start-opt-missions',
      KeyC: 'start-opt-contests',
      KeyT: 'start-opt-trainer',
      KeyO: 'start-opt-settings',
    };
    if (allowSaveAndDigits) {
      shortcutByCode.KeyS = 'start-opt-save';
      if (code.startsWith('Digit')) {
        const digit = parseInt(code.replace('Digit', ''), 10);
        if (digit >= 1 && digit <= this.menuItems.length) {
          this.cursorIndex = digit - 1;
          this.menuItems[this.cursorIndex].action();
          return true;
        }
      }
    }
    const targetId = shortcutByCode[code];
    if (targetId) {
      const targetIdx = this.menuItems.findIndex((item) => item.id === targetId);
      if (targetIdx >= 0) {
        this.cursorIndex = targetIdx;
        this.menuItems[targetIdx].action();
        return true;
      }
    }
    return false;
  }

  private createUI(): void {
    // 1. Classic Right-Hand Vertical Start Menu Panel
    const panel = document.createElement('div');
    panel.id = 'start-menu-panel';
    panel.style.cssText = `
      position: absolute;
      top: 64px;
      right: 18px;
      width: 220px;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 29, 0.99) 100%);
      border: 3px solid #f8fafc;
      outline: 3px solid #1e293b;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8), inset 0 0 0 2px #38bdf8;
      border-radius: 10px;
      padding: 12px;
      display: none;
      flex-direction: column;
      gap: 6px;
      z-index: 60;
      pointer-events: auto;
      color: #f8fafc;
    `;
    this.container.appendChild(panel);
    this.menuPanel = panel;

    // 1b. Johto Pokédex Modal (Neo-Kanto Protocol Workstation)
    const dexModal = document.createElement('div');
    dexModal.id = 'pokedex-modal';
    dexModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(1080px, 96vw);
      height: min(720px, 90vh);
      max-height: 90vh;
      background: #0D1322;
      border: 2px solid #22324F;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      gap: 12px;
      z-index: 65;
      pointer-events: auto;
      color: #dde2f7;
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    `;
    this.container.appendChild(dexModal);
    this.pokedexModal = dexModal;

    // 2. Trainer Card Modal (Neo-Kanto Holographic ID Passport)
    const trainerModal = document.createElement('div');
    trainerModal.id = 'trainer-card-modal';
    trainerModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(840px, 94vw);
      max-height: 90vh;
      overflow-y: auto;
      background: #0D1322;
      border: 2px solid #22324F;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      gap: 16px;
      z-index: 65;
      pointer-events: auto;
      color: #dde2f7;
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    `;
    this.container.appendChild(trainerModal);
    this.trainerCardModal = trainerModal;

    // 2b. Bug-Catching Contest Leaderboard & Johto Stadium Arena Modal
    const contestModal = document.createElement('div');
    contestModal.id = 'bug-contest-leaderboard-modal';
    contestModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(920px, 95vw);
      max-height: 90vh;
      overflow-y: auto;
      background: #0D1322;
      border: 2px solid #22324F;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 6px 0 0 #070B14, 0 16px 48px rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      gap: 14px;
      z-index: 65;
      pointer-events: auto;
      color: #dde2f7;
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    `;
    this.container.appendChild(contestModal);
    this.contestLeaderboardModal = contestModal;

    // 3. Save Confirmation Modal
    const saveModal = document.createElement('div');
    saveModal.id = 'save-confirm-modal';
    saveModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-width: 92vw;
      background: rgba(15, 23, 42, 0.98);
      border: 3px solid #f8fafc;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85), inset 0 0 0 2px #38bdf8;
      border-radius: 12px;
      padding: 20px;
      display: none;
      flex-direction: column;
      gap: 14px;
      z-index: 65;
      pointer-events: auto;
      color: #f8fafc;
    `;
    this.container.appendChild(saveModal);
    this.saveConfirmModal = saveModal;

    // 4. Game Settings Modal
    const setModal = document.createElement('div');
    setModal.id = 'settings-modal';
    setModal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 440px;
      max-width: 94vw;
      background: rgba(15, 23, 42, 0.98);
      backdrop-filter: blur(16px);
      border: 3px solid #38bdf8;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.88), inset 0 0 0 2px rgba(56, 189, 248, 0.3);
      border-radius: 14px;
      padding: 22px;
      display: none;
      flex-direction: column;
      gap: 16px;
      z-index: 65;
      pointer-events: auto;
      color: #f8fafc;
    `;
    this.container.appendChild(setModal);
    this.settingsModal = setModal;
  }

  private renderMenuItems(): void {
    this.menuPanel.innerHTML = '';

    const header = document.createElement('div');
    header.style.cssText = `
      font-size: 11px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.8px;
      padding: 2px 6px 6px 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.14);
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
    `;
    header.innerHTML = `<span>START MENU</span><span class="keyboard-hint" style="color: #94a3b8;">ESC</span>`;
    this.menuPanel.appendChild(header);

    this.menuItems.forEach((item, idx) => {
      if (item.id === 'start-opt-trainer') {
        item.label = this.stateProvider.getTrainerName() || 'TRAINER';
      }
      const isSelected = idx === this.cursorIndex;
      const btn = document.createElement('button');
      btn.id = item.id;
      btn.style.cssText = `
        background: ${isSelected ? '#1e3a8a' : 'transparent'};
        color: ${isSelected ? '#ffffff' : '#e2e8f0'};
        border: 1px solid ${isSelected ? '#38bdf8' : 'transparent'};
        border-radius: 6px;
        padding: 9px 10px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        text-align: left;
      `;
      btn.innerHTML = `
        <span style="display: flex; align-items: center; gap: 8px;">
          <span style="color: ${isSelected ? '#facc15' : 'transparent'}; font-size: 12px;">▶</span>
          <span>${item.icon}</span>
          <span>${item.label}</span>
        </span>
        <span class="keyboard-hint" style="font-size: 10px; font-weight: 800; color: #94a3b8; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(148, 163, 184, 0.28); padding: 1px 5px; border-radius: 4px;">[${item.shortcut}]</span>
      `;

      btn.addEventListener('mouseenter', () => {
        if (this.cursorIndex !== idx) {
          this.cursorIndex = idx;
          this.renderMenuItems();
        }
      });

      btn.addEventListener('click', () => {
        this.cursorIndex = idx;
        item.action();
      });

      this.menuPanel.appendChild(btn);
    });
  }

  private formatPlayTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

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
    const playTime = this.formatPlayTime(this.stateProvider.getPlayTimeSeconds());

    this.saveConfirmModal.innerHTML = `
      <div style="font-size: 13px; font-weight: 800; color: #38bdf8; letter-spacing: 0.6px;">💾 SAVE PROGRESS</div>
      <div style="background: #1e293b; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 5px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">PLAYER:</span><strong>${name}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">LOCATION:</span><strong>${mapName}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">BADGES:</span><strong>${badgesCount}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8;">TIME:</span><strong>${playTime}</strong></div>
      </div>
      <div id="save-confirm-status" style="font-size: 15px; font-weight: 700; color: #f8fafc;">
        Would you like to save the game?
      </div>
      <div id="save-confirm-buttons" style="display: flex; gap: 10px;">
        <button id="confirm-save-yes-btn" style="
          flex: 1;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        ">YES, SAVE</button>
        <button id="confirm-save-no-btn" style="
          flex: 1;
          background: #475569;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
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
      const closeDelay = 850 / this.speedMultiplier;
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

  public openSettings(): void {
    BattleAudio.playMenuSound('CONFIRM');
    this.menuPanel.style.display = 'none';
    this.settingsModal.style.display = 'flex';
    this.renderSettingsContent();
  }

  private renderSettingsContent(): void {
    const isMuted = this.stateProvider.isMuted ? this.stateProvider.isMuted() : false;
    const currentSpeed = this.stateProvider.getSpeedMultiplier
      ? this.stateProvider.getSpeedMultiplier()
      : this.speedMultiplier;
    const isGamepad = this.stateProvider.isGamepadActive ? this.stateProvider.isGamepadActive() : false;
    const controlStyle: TouchControlStyle = this.stateProvider.getTouchControlStyle
      ? this.stateProvider.getTouchControlStyle()
      : 'DPAD';
    const isJoystick = controlStyle === 'JOYSTICK';
    const expShareMode: ExpShareMode = this.stateProvider.getExpShareMode
      ? this.stateProvider.getExpShareMode()
      : 'CAPPED';
    const encounterRateMode: EncounterRateMode = this.stateProvider.getEncounterRateMode
      ? this.stateProvider.getEncounterRateMode()
      : 'NORMAL';
    const isAutoHm: boolean = this.stateProvider.getAutoHm
      ? this.stateProvider.getAutoHm()
      : true;
    const isCrtScanlines: boolean = this.stateProvider.getCrtScanlines
      ? this.stateProvider.getCrtScanlines()
      : false;
    const gbcPalette: GbcPaletteMode = this.stateProvider.getGbcPalette
      ? this.stateProvider.getGbcPalette()
      : 'VIBRANT';
    const currentBadges = this.stateProvider.getBadges ? this.stateProvider.getBadges().length : 0;
    const currentLevelCap = PokemonFactory.getLevelCapForBadges(currentBadges);

    const getExpShareButtonLabel = (mode: ExpShareMode) => {
      if (mode === 'OFF') return 'EXP: OFF (Single Battler)';
      if (mode === 'ALL') return 'EXP: ALL (Full Team 50%)';
      return `EXP: 🧢 CAPPED (Lv. ${currentLevelCap})`;
    };

    const getExpShareButtonBg = (mode: ExpShareMode) => {
      if (mode === 'OFF') return '#475569';
      if (mode === 'ALL') return '#059669';
      return '#7c3aed';
    };

    const getExpShareButtonBorder = (mode: ExpShareMode) => {
      if (mode === 'OFF') return '#94a3b8';
      if (mode === 'ALL') return '#34d399';
      return '#c084fc';
    };

    const getEncounterRateLabel = (mode: EncounterRateMode) => {
      if (mode === 'RELAXED') return '🌿 RELAXED (4.0% Cap)';
      if (mode === 'CLASSIC') return '⚡ CLASSIC (10.0% Cap)';
      return '⚖️ NORMAL (6.25% Cap)';
    };

    const rowStyle = 'background:rgba(30,41,59,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;';
    const subLabelStyle = 'font-size:11px;color:#94a3b8;';
    const titleLabelStyle = 'font-size:13px;font-weight:800;color:#fff;';

    this.settingsModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(56, 189, 248, 0.35); padding-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">⚙️</span>
          <h2 style="margin: 0; font-size: 19px; font-weight: 900; color: #38bdf8; letter-spacing: 0.5px;">SETTINGS</h2>
        </div>
        <button id="close-settings-x-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 4px;">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Sound Toggle -->
        <div style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">AUDIO & SOUND</div>
            <div style="${subLabelStyle}">Background music & battle SFX</div>
          </div>
          <button id="settings-sound-btn" style="
            background: ${isMuted ? '#7f1d1d' : '#0284c7'};
            color: #ffffff;
            border: 1px solid ${isMuted ? '#ef4444' : '#38bdf8'};
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON'}</button>
        </div>

        <!-- Speed Multiplier Cycle -->
        <div style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">GAME SPEED</div>
            <div style="${subLabelStyle}">Overworld traversal & dialogue</div>
          </div>
          <button id="settings-speed-btn" style="
            background: #2563eb;
            color: #ffffff;
            border: 1px solid #60a5fa;
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">⚡ SPEED: ${currentSpeed}x</button>
        </div>

        <!-- Touch Controls Toggle -->
        <div style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">TOUCH CONTROLS</div>
            <div style="${subLabelStyle}">On-screen virtual D-Pad & A/B</div>
          </div>
          <button id="settings-gamepad-btn" style="
            background: ${isGamepad ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1px solid ${isGamepad ? '#34d399' : '#64748b'};
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isGamepad ? '🎮 TOUCH: ON' : '🎮 TOUCH: OFF'}</button>
        </div>

        <!-- Touch Control Style Toggle (D-Pad vs Analog Joystick) -->
        <div style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">CONTROL STYLE</div>
            <div style="${subLabelStyle}">D-Pad buttons or analog joystick</div>
          </div>
          <button id="settings-control-style-btn" style="
            background: ${isJoystick ? '#7c3aed' : '#0284c7'};
            color: #ffffff;
            border: 1px solid ${isJoystick ? '#c084fc' : '#38bdf8'};
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isJoystick ? '🕹️ JOYSTICK (Analog)' : '🕹️ D-PAD (Buttons)'}</button>
        </div>

        <!-- CRT Scanlines Toggle -->
        <div style="${rowStyle}">
          <div>
            <div style="${titleLabelStyle}">CRT SCANLINE OVERLAY</div>
            <div style="${subLabelStyle}">Retro CRT horizontal scanlines & bezel vignette</div>
          </div>
          <button id="settings-crt-btn" style="
            background: ${isCrtScanlines ? '#059669' : '#334155'};
            color: #ffffff;
            border: 1px solid ${isCrtScanlines ? '#34d399' : '#64748b'};
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            min-width: 130px;
          ">${isCrtScanlines ? '📺 CRT: ON' : '📺 CRT: OFF'}</button>
        </div>

        <!-- GBC Hardware Color Palette Selector -->
        <div style="background:rgba(30,41,59,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div>
              <div style="${titleLabelStyle}">GBC COLOR PALETTE</div>
              <div style="${subLabelStyle}">Handheld LCD hardware color profile</div>
            </div>
            <button id="settings-palette-btn" style="
              background: #0284c7;
              color: #ffffff;
              border: 1px solid #38bdf8;
              border-radius: 6px;
              padding: 7px 12px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              min-width: 130px;
            ">${GBC_PALETTE_SPECS[gbcPalette]?.label || '🎨 VIBRANT GBC'}</button>
          </div>
          <div id="settings-palette-segmented-group" style="display:flex;gap:6px;width:100%;">
            <button id="settings-pal-vibrant-btn" style="
              flex: 1;
              background: ${gbcPalette === 'VIBRANT' ? '#0284c7' : '#0f172a'};
              color: ${gbcPalette === 'VIBRANT' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${gbcPalette === 'VIBRANT' ? '#38bdf8' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 4px;
              font-size: 10px;
              font-weight: 800;
              cursor: pointer;
            ">[ VIBRANT ]</button>
            <button id="settings-pal-pocket-btn" style="
              flex: 1;
              background: ${gbcPalette === 'POCKET' ? '#059669' : '#0f172a'};
              color: ${gbcPalette === 'POCKET' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${gbcPalette === 'POCKET' ? '#34d399' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 4px;
              font-size: 10px;
              font-weight: 800;
              cursor: pointer;
            ">[ POCKET ]</button>
            <button id="settings-pal-dmg-btn" style="
              flex: 1;
              background: ${gbcPalette === 'DMG' ? '#65a30d' : '#0f172a'};
              color: ${gbcPalette === 'DMG' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${gbcPalette === 'DMG' ? '#a3e635' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 4px;
              font-size: 10px;
              font-weight: 800;
              cursor: pointer;
            ">[ DMG-01 ]</button>
            <button id="settings-pal-night-btn" style="
              flex: 1;
              background: ${gbcPalette === 'NIGHT' ? '#4f46e5' : '#0f172a'};
              color: ${gbcPalette === 'NIGHT' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${gbcPalette === 'NIGHT' ? '#818cf8' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 4px;
              font-size: 10px;
              font-weight: 800;
              cursor: pointer;
            ">[ NIGHT ]</button>
          </div>
        </div>

        <!-- Unbound-Style Exp. Share Mode Toggle (OFF | ALL | CAPPED) -->
        <div style="background:rgba(30,41,59,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div>
              <div style="${titleLabelStyle}">EXP. SHARE MODE</div>
              <div style="${subLabelStyle}">Party EXP distribution & level caps</div>
            </div>
            <button id="settings-exp-share-btn" style="
              background: ${getExpShareButtonBg(expShareMode)};
              color: #ffffff;
              border: 1px solid ${getExpShareButtonBorder(expShareMode)};
              border-radius: 6px;
              padding: 7px 12px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              min-width: 130px;
            ">${getExpShareButtonLabel(expShareMode)}</button>
          </div>
          <div id="settings-exp-segmented-group" style="display:flex;gap:6px;width:100%;">
            <button id="settings-exp-off-btn" style="
              flex: 1;
              background: ${expShareMode === 'OFF' ? '#475569' : '#0f172a'};
              color: ${expShareMode === 'OFF' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${expShareMode === 'OFF' ? '#cbd5e1' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ OFF ]</button>
            <button id="settings-exp-all-btn" style="
              flex: 1;
              background: ${expShareMode === 'ALL' ? '#059669' : '#0f172a'};
              color: ${expShareMode === 'ALL' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${expShareMode === 'ALL' ? '#34d399' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ ALL ]</button>
            <button id="settings-exp-capped-btn" style="
              flex: 1;
              background: ${expShareMode === 'CAPPED' ? '#7c3aed' : '#0f172a'};
              color: ${expShareMode === 'CAPPED' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${expShareMode === 'CAPPED' ? '#c084fc' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ 🧢 CAPPED ]</button>
          </div>
        </div>

        <!-- Wild Encounter Rate Cap Toggle (RELAXED 4.0% | NORMAL 6.25% | CLASSIC 10.0%) -->
        <div style="background:rgba(30,41,59,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div>
              <div style="${titleLabelStyle}">WILD ENCOUNTER RATE</div>
              <div style="${subLabelStyle}">4-step grace buffer + step probability cap</div>
            </div>
            <button id="settings-encounter-rate-btn" style="
              background: #0284c7;
              color: #ffffff;
              border: 1px solid #38bdf8;
              border-radius: 6px;
              padding: 7px 12px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              min-width: 130px;
            ">${getEncounterRateLabel(encounterRateMode)}</button>
          </div>
          <div id="settings-encounter-segmented-group" style="display:flex;gap:6px;width:100%;">
            <button id="settings-enc-relaxed-btn" style="
              flex: 1;
              background: ${encounterRateMode === 'RELAXED' ? '#059669' : '#0f172a'};
              color: ${encounterRateMode === 'RELAXED' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${encounterRateMode === 'RELAXED' ? '#34d399' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ RELAXED 4% ]</button>
            <button id="settings-enc-normal-btn" style="
              flex: 1;
              background: ${encounterRateMode === 'NORMAL' ? '#0284c7' : '#0f172a'};
              color: ${encounterRateMode === 'NORMAL' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${encounterRateMode === 'NORMAL' ? '#38bdf8' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ NORMAL 6.25% ]</button>
            <button id="settings-enc-classic-btn" style="
              flex: 1;
              background: ${encounterRateMode === 'CLASSIC' ? '#d97706' : '#0f172a'};
              color: ${encounterRateMode === 'CLASSIC' ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${encounterRateMode === 'CLASSIC' ? '#fbbf24' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ CLASSIC 10% ]</button>
          </div>
        </div>

        <!-- Auto-HM Mode Toggle (UNBOUND STYLE) -->
        <div style="background:rgba(30,41,59,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
            <div>
              <div style="${titleLabelStyle}">AUTO-HM MODE (UNBOUND)</div>
              <div style="${subLabelStyle}">Use Surf, Cut & Strength without move slots or prompts</div>
            </div>
            <button id="settings-autohm-btn" style="
              background: ${isAutoHm ? '#059669' : '#334155'};
              color: #ffffff;
              border: 1px solid ${isAutoHm ? '#34d399' : '#64748b'};
              border-radius: 6px;
              padding: 7px 12px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
              min-width: 130px;
            ">${isAutoHm ? '🌊 AUTO-HM: ON' : '💬 AUTO-HM: OFF'}</button>
          </div>
          <div id="settings-autohm-segmented-group" style="display:flex;gap:6px;width:100%;">
            <button id="settings-autohm-on-btn" style="
              flex: 1;
              background: ${isAutoHm ? '#059669' : '#0f172a'};
              color: ${isAutoHm ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${isAutoHm ? '#34d399' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ ON: AUTO SURF & OBSTACLES ]</button>
            <button id="settings-autohm-off-btn" style="
              flex: 1;
              background: ${!isAutoHm ? '#334155' : '#0f172a'};
              color: ${!isAutoHm ? '#ffffff' : '#94a3b8'};
              border: 1px solid ${!isAutoHm ? '#94a3b8' : 'rgba(255,255,255,0.12)'};
              border-radius: 6px;
              padding: 6px 8px;
              font-size: 11px;
              font-weight: 800;
              cursor: pointer;
            ">[ OFF: CLASSIC PROMPTS ]</button>
          </div>
        </div>
      </div>

      <button id="close-settings-btn" style="
        background: #334155;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 10px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        margin-top: 4px;
      ">← BACK TO MENU</button>
    `;

    const soundBtn = this.settingsModal.querySelector('#settings-sound-btn') as HTMLButtonElement;
    const speedBtn = this.settingsModal.querySelector('#settings-speed-btn') as HTMLButtonElement;
    const gamepadBtn = this.settingsModal.querySelector('#settings-gamepad-btn') as HTMLButtonElement;
    const controlStyleBtn = this.settingsModal.querySelector('#settings-control-style-btn') as HTMLButtonElement;
    const crtBtn = this.settingsModal.querySelector('#settings-crt-btn') as HTMLButtonElement;
    const paletteBtn = this.settingsModal.querySelector('#settings-palette-btn') as HTMLButtonElement;
    const palVibrantBtn = this.settingsModal.querySelector('#settings-pal-vibrant-btn') as HTMLButtonElement;
    const palPocketBtn = this.settingsModal.querySelector('#settings-pal-pocket-btn') as HTMLButtonElement;
    const palDmgBtn = this.settingsModal.querySelector('#settings-pal-dmg-btn') as HTMLButtonElement;
    const palNightBtn = this.settingsModal.querySelector('#settings-pal-night-btn') as HTMLButtonElement;
    const expShareBtn = this.settingsModal.querySelector('#settings-exp-share-btn') as HTMLButtonElement;
    const expOffBtn = this.settingsModal.querySelector('#settings-exp-off-btn') as HTMLButtonElement;
    const expAllBtn = this.settingsModal.querySelector('#settings-exp-all-btn') as HTMLButtonElement;
    const expCappedBtn = this.settingsModal.querySelector('#settings-exp-capped-btn') as HTMLButtonElement;
    const encRateBtn = this.settingsModal.querySelector('#settings-encounter-rate-btn') as HTMLButtonElement;
    const encRelaxedBtn = this.settingsModal.querySelector('#settings-enc-relaxed-btn') as HTMLButtonElement;
    const encNormalBtn = this.settingsModal.querySelector('#settings-enc-normal-btn') as HTMLButtonElement;
    const encClassicBtn = this.settingsModal.querySelector('#settings-enc-classic-btn') as HTMLButtonElement;
    const autoHmBtn = this.settingsModal.querySelector('#settings-autohm-btn') as HTMLButtonElement;
    const autoHmOnBtn = this.settingsModal.querySelector('#settings-autohm-on-btn') as HTMLButtonElement;
    const autoHmOffBtn = this.settingsModal.querySelector('#settings-autohm-off-btn') as HTMLButtonElement;
    const closeBtn = this.settingsModal.querySelector('#close-settings-btn') as HTMLButtonElement;
    const closeXBtn = this.settingsModal.querySelector('#close-settings-x-btn') as HTMLButtonElement;

    let activeCrt = isCrtScanlines;
    if (crtBtn) {
      crtBtn.addEventListener('click', () => {
        activeCrt = !activeCrt;
        BattleAudio.playMenuSound('CONFIRM');
        crtBtn.innerText = activeCrt ? '📺 CRT: ON' : '📺 CRT: OFF';
        crtBtn.style.background = activeCrt ? '#059669' : '#334155';
        crtBtn.style.borderColor = activeCrt ? '#34d399' : '#64748b';
        this.callbacks.onToggleCrtScanlines?.(activeCrt);
      });
    }

    let activePalette: GbcPaletteMode = gbcPalette;
    const syncPaletteButtons = (mode: GbcPaletteMode) => {
      activePalette = mode;
      if (paletteBtn) {
        paletteBtn.innerText = GBC_PALETTE_SPECS[mode]?.label || '🎨 VIBRANT GBC';
      }
      if (palVibrantBtn) {
        palVibrantBtn.style.background = mode === 'VIBRANT' ? '#0284c7' : '#0f172a';
        palVibrantBtn.style.color = mode === 'VIBRANT' ? '#ffffff' : '#94a3b8';
        palVibrantBtn.style.borderColor = mode === 'VIBRANT' ? '#38bdf8' : 'rgba(255,255,255,0.12)';
      }
      if (palPocketBtn) {
        palPocketBtn.style.background = mode === 'POCKET' ? '#059669' : '#0f172a';
        palPocketBtn.style.color = mode === 'POCKET' ? '#ffffff' : '#94a3b8';
        palPocketBtn.style.borderColor = mode === 'POCKET' ? '#34d399' : 'rgba(255,255,255,0.12)';
      }
      if (palDmgBtn) {
        palDmgBtn.style.background = mode === 'DMG' ? '#65a30d' : '#0f172a';
        palDmgBtn.style.color = mode === 'DMG' ? '#ffffff' : '#94a3b8';
        palDmgBtn.style.borderColor = mode === 'DMG' ? '#a3e635' : 'rgba(255,255,255,0.12)';
      }
      if (palNightBtn) {
        palNightBtn.style.background = mode === 'NIGHT' ? '#4f46e5' : '#0f172a';
        palNightBtn.style.color = mode === 'NIGHT' ? '#ffffff' : '#94a3b8';
        palNightBtn.style.borderColor = mode === 'NIGHT' ? '#818cf8' : 'rgba(255,255,255,0.12)';
      }
    };

    const applyPalette = (nextMode: GbcPaletteMode) => {
      BattleAudio.playMenuSound('CONFIRM');
      this.callbacks.onSetGbcPalette?.(nextMode);
      syncPaletteButtons(nextMode);
    };

    paletteBtn?.addEventListener('click', () => {
      const order: GbcPaletteMode[] = ['VIBRANT', 'POCKET', 'DMG', 'NIGHT'];
      const next = order[(order.indexOf(activePalette) + 1) % order.length];
      applyPalette(next);
    });
    palVibrantBtn?.addEventListener('click', () => applyPalette('VIBRANT'));
    palPocketBtn?.addEventListener('click', () => applyPalette('POCKET'));
    palDmgBtn?.addEventListener('click', () => applyPalette('DMG'));
    palNightBtn?.addEventListener('click', () => applyPalette('NIGHT'));

    let activeExpMode: ExpShareMode = expShareMode;
    const syncExpShareButtons = (mode: ExpShareMode) => {
      activeExpMode = mode;
      expShareBtn.innerText = getExpShareButtonLabel(mode);
      expShareBtn.style.background = getExpShareButtonBg(mode);
      expShareBtn.style.borderColor = getExpShareButtonBorder(mode);

      expOffBtn.style.background = mode === 'OFF' ? '#475569' : '#0f172a';
      expOffBtn.style.color = mode === 'OFF' ? '#ffffff' : '#94a3b8';
      expOffBtn.style.borderColor = mode === 'OFF' ? '#cbd5e1' : 'rgba(255,255,255,0.12)';

      expAllBtn.style.background = mode === 'ALL' ? '#059669' : '#0f172a';
      expAllBtn.style.color = mode === 'ALL' ? '#ffffff' : '#94a3b8';
      expAllBtn.style.borderColor = mode === 'ALL' ? '#34d399' : 'rgba(255,255,255,0.12)';

      expCappedBtn.style.background = mode === 'CAPPED' ? '#7c3aed' : '#0f172a';
      expCappedBtn.style.color = mode === 'CAPPED' ? '#ffffff' : '#94a3b8';
      expCappedBtn.style.borderColor = mode === 'CAPPED' ? '#c084fc' : 'rgba(255,255,255,0.12)';
    };

    const applyExpMode = (nextMode: ExpShareMode) => {
      BattleAudio.playMenuSound('CONFIRM');
      if (this.callbacks.onSetExpShareMode) {
        this.callbacks.onSetExpShareMode(nextMode);
      }
      syncExpShareButtons(nextMode);
    };

    expShareBtn.addEventListener('click', () => {
      if (this.callbacks.onCycleExpShareMode) {
        const cycled = this.callbacks.onCycleExpShareMode();
        BattleAudio.playMenuSound('CONFIRM');
        syncExpShareButtons(cycled);
      } else {
        const order: ExpShareMode[] = ['OFF', 'ALL', 'CAPPED'];
        const nextMode = order[(order.indexOf(activeExpMode) + 1) % order.length];
        applyExpMode(nextMode);
      }
    });

    expOffBtn.addEventListener('click', () => applyExpMode('OFF'));
    expAllBtn.addEventListener('click', () => applyExpMode('ALL'));
    expCappedBtn.addEventListener('click', () => applyExpMode('CAPPED'));

    let activeEncMode: EncounterRateMode = encounterRateMode;
    const syncEncounterButtons = (mode: EncounterRateMode) => {
      activeEncMode = mode;
      encRateBtn.innerText = getEncounterRateLabel(mode);
      encRelaxedBtn.style.background = mode === 'RELAXED' ? '#059669' : '#0f172a';
      encRelaxedBtn.style.color = mode === 'RELAXED' ? '#ffffff' : '#94a3b8';
      encRelaxedBtn.style.borderColor = mode === 'RELAXED' ? '#34d399' : 'rgba(255,255,255,0.12)';

      encNormalBtn.style.background = mode === 'NORMAL' ? '#0284c7' : '#0f172a';
      encNormalBtn.style.color = mode === 'NORMAL' ? '#ffffff' : '#94a3b8';
      encNormalBtn.style.borderColor = mode === 'NORMAL' ? '#38bdf8' : 'rgba(255,255,255,0.12)';

      encClassicBtn.style.background = mode === 'CLASSIC' ? '#d97706' : '#0f172a';
      encClassicBtn.style.color = mode === 'CLASSIC' ? '#ffffff' : '#94a3b8';
      encClassicBtn.style.borderColor = mode === 'CLASSIC' ? '#fbbf24' : 'rgba(255,255,255,0.12)';
    };

    const applyEncMode = (nextMode: EncounterRateMode) => {
      BattleAudio.playMenuSound('CONFIRM');
      if (this.callbacks.onSetEncounterRateMode) {
        this.callbacks.onSetEncounterRateMode(nextMode);
      }
      syncEncounterButtons(nextMode);
    };

    encRateBtn.addEventListener('click', () => {
      const order: EncounterRateMode[] = ['RELAXED', 'NORMAL', 'CLASSIC'];
      const nextMode = order[(order.indexOf(activeEncMode) + 1) % order.length];
      applyEncMode(nextMode);
    });
    encRelaxedBtn.addEventListener('click', () => applyEncMode('RELAXED'));
    encNormalBtn.addEventListener('click', () => applyEncMode('NORMAL'));
    encClassicBtn.addEventListener('click', () => applyEncMode('CLASSIC'));

    let activeAutoHm = isAutoHm;
    const syncAutoHmButtons = (enabled: boolean) => {
      activeAutoHm = enabled;
      autoHmBtn.innerText = enabled ? '🌊 AUTO-HM: ON' : '💬 AUTO-HM: OFF';
      autoHmBtn.style.background = enabled ? '#059669' : '#334155';
      autoHmBtn.style.borderColor = enabled ? '#34d399' : '#64748b';

      autoHmOnBtn.style.background = enabled ? '#059669' : '#0f172a';
      autoHmOnBtn.style.color = enabled ? '#ffffff' : '#94a3b8';
      autoHmOnBtn.style.borderColor = enabled ? '#34d399' : 'rgba(255,255,255,0.12)';

      autoHmOffBtn.style.background = !enabled ? '#334155' : '#0f172a';
      autoHmOffBtn.style.color = !enabled ? '#ffffff' : '#94a3b8';
      autoHmOffBtn.style.borderColor = !enabled ? '#94a3b8' : 'rgba(255,255,255,0.12)';
    };

    const applyAutoHm = (enabled: boolean) => {
      BattleAudio.playMenuSound('CONFIRM');
      syncAutoHmButtons(enabled);
      if (this.callbacks.onToggleAutoHm) {
        this.callbacks.onToggleAutoHm(enabled);
      }
    };

    autoHmBtn.addEventListener('click', () => applyAutoHm(!activeAutoHm));
    autoHmOnBtn.addEventListener('click', () => applyAutoHm(true));
    autoHmOffBtn.addEventListener('click', () => applyAutoHm(false));

    soundBtn.addEventListener('click', () => {
      if (this.callbacks.onToggleMute) {
        const muted = this.callbacks.onToggleMute();
        if (!muted) BattleAudio.playMenuSound('CONFIRM');
        else BattleAudio.playMenuSound('CANCEL');
        soundBtn.innerText = muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
        soundBtn.style.background = muted ? '#7f1d1d' : '#0284c7';
        soundBtn.style.borderColor = muted ? '#ef4444' : '#38bdf8';
      }
    });

    speedBtn.addEventListener('click', () => {
      if (this.callbacks.onCycleSpeed) {
        const nextSpeed = this.callbacks.onCycleSpeed();
        BattleAudio.playMenuSound('CONFIRM');
        speedBtn.innerText = `⚡ SPEED: ${nextSpeed}x`;
      }
    });

    gamepadBtn.addEventListener('click', () => {
      if (this.callbacks.onToggleGamepad) {
        const active = this.callbacks.onToggleGamepad();
        BattleAudio.playMenuSound('CONFIRM');
        gamepadBtn.innerText = active ? '🎮 TOUCH: ON' : '🎮 TOUCH: OFF';
        gamepadBtn.style.background = active ? '#059669' : '#334155';
        gamepadBtn.style.borderColor = active ? '#34d399' : '#64748b';
      }
    });

    controlStyleBtn.addEventListener('click', () => {
      if (this.callbacks.onToggleTouchControlStyle) {
        const nextStyle = this.callbacks.onToggleTouchControlStyle();
        BattleAudio.playMenuSound('CONFIRM');
        const nextIsJoy = nextStyle === 'JOYSTICK';
        controlStyleBtn.innerText = nextIsJoy ? '🕹️ JOYSTICK (Analog)' : '🕹️ D-PAD (Buttons)';
        controlStyleBtn.style.background = nextIsJoy ? '#7c3aed' : '#0284c7';
        controlStyleBtn.style.borderColor = nextIsJoy ? '#c084fc' : '#38bdf8';
      }
    });

    const closeHandler = () => {
      BattleAudio.playMenuSound('CANCEL');
      this.settingsModal.style.display = 'none';
      this.menuPanel.style.display = 'flex';
    };

    closeBtn.addEventListener('click', closeHandler);
    closeXBtn.addEventListener('click', closeHandler);
  }
}
