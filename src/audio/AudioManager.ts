import { Howl, Howler } from 'howler';
import { BattleAudio } from './BattleAudio';
import { ChiptuneSynthesizer } from './ChiptuneSynthesizer';

export type BgmTrackId =
  | 'bgm_new_bark_town'
  | 'bgm_elms_lab'
  | 'bgm_route_29'
  | 'bgm_cherrygrove_city'
  | 'bgm_violet_city'
  | 'bgm_sprout_tower'
  | 'bgm_gym'
  | 'bgm_goldenrod_city'
  | 'bgm_national_park'
  | 'bgm_ecruteak_city'
  | 'bgm_game_corner'
  | 'bgm_wild_battle'
  | 'bgm_trainer_battle'
  | 'bgm_gym_leader_battle'
  | 'bgm_evolution';

export type BattleBgmType = 'wild' | 'trainer' | 'gym_leader';

const MUTE_STORAGE_KEY = 'crystal_overdrive_muted';

export const MAP_BGM_TABLE: Record<string, BgmTrackId> = {
  // New Bark Town & Houses
  new_bark_town: 'bgm_new_bark_town',
  players_house_1f: 'bgm_new_bark_town',
  players_house_2f: 'bgm_new_bark_town',
  players_neighbors_house: 'bgm_new_bark_town',
  elms_house: 'bgm_new_bark_town',

  // Prof. Elm's Lab & Prof. Oak's Lab
  elms_lab: 'bgm_elms_lab',
  oaks_lab: 'bgm_elms_lab',

  // Early & Mid Johto Routes & Route Houses
  route_29: 'bgm_route_29',
  route_30: 'bgm_route_29',
  route_31: 'bgm_route_29',
  route_32: 'bgm_route_29',
  route_32_poke_center: 'bgm_cherrygrove_city',
  route_32_ruins_of_alph_gate: 'bgm_violet_city',
  route_33: 'bgm_route_29',
  route_34: 'bgm_route_29',
  route_35: 'bgm_route_29',
  route_35_national_park_gate: 'bgm_national_park',
  national_park: 'bgm_national_park',
  route_36_national_park_gate: 'bgm_national_park',
  route_36: 'bgm_route_29',
  route_36_ruins_of_alph_gate: 'bgm_route_29',
  route_37: 'bgm_route_29',
  route_38: 'bgm_route_29',
  route_38_ecruteak_gate: 'bgm_ecruteak_city',
  route_39: 'bgm_route_29',
  route_39_barn: 'bgm_violet_city',
  route_39_farmhouse: 'bgm_violet_city',
  route_40: 'bgm_route_29',
  route_41: 'bgm_route_29',
  route_42: 'bgm_route_29',
  route_42_ecruteak_gate: 'bgm_ecruteak_city',
  route_43: 'bgm_route_29',
  route_43_mahogany_gate: 'bgm_cherrygrove_city',
  route_43_gate: 'bgm_sprout_tower',
  route_44: 'bgm_route_29',
  route_45: 'bgm_route_29',
  route_46: 'bgm_route_29',
  day_care: 'bgm_route_29',
  mr_pokemons_house: 'bgm_route_29',
  route_30_berry_house: 'bgm_route_29',

  // Cherrygrove City & Indoors
  cherrygrove_city: 'bgm_cherrygrove_city',
  cherrygrove_mart: 'bgm_cherrygrove_city',
  cherrygrove_poke_center: 'bgm_cherrygrove_city',
  guide_gents_house: 'bgm_cherrygrove_city',
  cherrygrove_gym_speech_house: 'bgm_cherrygrove_city',
  cherrygrove_evolution_speech_house: 'bgm_cherrygrove_city',

  // Azalea Town & Indoors
  azalea_town: 'bgm_cherrygrove_city',
  azalea_poke_center: 'bgm_cherrygrove_city',
  azalea_mart: 'bgm_cherrygrove_city',
  kurts_house: 'bgm_cherrygrove_city',
  charcoal_kiln: 'bgm_cherrygrove_city',
  azalea_gym: 'bgm_gym',

  // Ruins of Alph, Union Cave, Slowpoke Well, Ilex Forest & Johto Dungeons
  ruins_of_alph_outside: 'bgm_sprout_tower',
  ruins_of_alph_research_center: 'bgm_elms_lab',
  ruins_of_alph_kabuto_chamber: 'bgm_sprout_tower',
  ruins_of_alph_inner_chamber: 'bgm_sprout_tower',
  union_cave_1f: 'bgm_sprout_tower',
  union_cave_b1f: 'bgm_sprout_tower',
  union_cave_b2f: 'bgm_sprout_tower',
  slowpoke_well_b1f: 'bgm_sprout_tower',
  slowpoke_well_b2f: 'bgm_sprout_tower',
  ilex_forest: 'bgm_sprout_tower',
  route_34_ilex_forest_gate: 'bgm_sprout_tower',

  // Goldenrod City Metropolis & Interiors
  goldenrod_city: 'bgm_goldenrod_city',
  goldenrod_bike_shop: 'bgm_goldenrod_city',
  goldenrod_bill_house: 'bgm_goldenrod_city',
  goldenrod_magnet_train_station: 'bgm_goldenrod_city',
  goldenrod_flower_shop: 'bgm_goldenrod_city',
  goldenrod_name_rater: 'bgm_goldenrod_city',
  goldenrod_dept_store_1f: 'bgm_goldenrod_city',
  goldenrod_dept_store_2f: 'bgm_goldenrod_city',
  goldenrod_dept_store_3f: 'bgm_goldenrod_city',
  goldenrod_dept_store_4f: 'bgm_goldenrod_city',
  goldenrod_dept_store_5f: 'bgm_goldenrod_city',
  goldenrod_dept_store_6f: 'bgm_goldenrod_city',
  goldenrod_dept_store_roof: 'bgm_goldenrod_city',
  goldenrod_poke_center: 'bgm_goldenrod_city',
  goldenrod_underground: 'bgm_goldenrod_city',
  radio_tower_1f: 'bgm_goldenrod_city',
  radio_tower_2f: 'bgm_goldenrod_city',
  radio_tower_3f: 'bgm_goldenrod_city',
  radio_tower_4f: 'bgm_goldenrod_city',
  radio_tower_5f: 'bgm_goldenrod_city',
  goldenrod_game_corner: 'bgm_game_corner',
  goldenrod_gym: 'bgm_gym',

  // Violet City & Indoors
  violet_city: 'bgm_violet_city',
  violet_mart: 'bgm_violet_city',
  violet_poke_center: 'bgm_violet_city',
  earls_pokemon_academy: 'bgm_violet_city',
  violet_nickname_speech_house: 'bgm_violet_city',
  violet_kyles_house: 'bgm_violet_city',
  route_31_violet_gate: 'bgm_violet_city',

  // Sprout Tower
  sprout_tower_1f: 'bgm_sprout_tower',
  sprout_tower_2f: 'bgm_sprout_tower',
  sprout_tower_3f: 'bgm_sprout_tower',

  // Violet Gym
  violet_gym: 'bgm_gym',

  // Ecruteak City & Historic Towers
  ecruteak_city: 'bgm_ecruteak_city',
  ecruteak_poke_center: 'bgm_ecruteak_city',
  ecruteak_mart: 'bgm_ecruteak_city',
  ecruteak_gym: 'bgm_gym',
  dance_theater: 'bgm_ecruteak_city',
  ecruteak_itemfinder_house: 'bgm_ecruteak_city',
  burned_tower_1f: 'bgm_sprout_tower',
  burned_tower_b1f: 'bgm_sprout_tower',
  tin_tower_1f: 'bgm_sprout_tower',

  // Olivine City, Lighthouse & Port
  olivine_city: 'bgm_violet_city',
  olivine_poke_center: 'bgm_violet_city',
  olivine_mart: 'bgm_violet_city',
  olivine_gym: 'bgm_gym',
  olivine_cafe: 'bgm_violet_city',
  olivine_tims_house: 'bgm_violet_city',
  olivine_good_rod_house: 'bgm_violet_city',
  olivine_lighthouse_1f: 'bgm_sprout_tower',
  olivine_lighthouse_2f: 'bgm_sprout_tower',
  olivine_lighthouse_3f: 'bgm_sprout_tower',
  olivine_lighthouse_4f: 'bgm_sprout_tower',
  olivine_lighthouse_5f: 'bgm_sprout_tower',
  olivine_lighthouse_6f: 'bgm_sprout_tower',
  olivine_port_passage: 'bgm_violet_city',
  olivine_port: 'bgm_violet_city',

  // Cianwood City & Whirl Islands
  cianwood_city: 'bgm_ecruteak_city',
  cianwood_poke_center: 'bgm_ecruteak_city',
  cianwood_gym: 'bgm_gym',
  cianwood_pharmacy: 'bgm_ecruteak_city',
  cianwood_photo_studio: 'bgm_ecruteak_city',
  cianwood_lugia_speech_house: 'bgm_ecruteak_city',
  whirl_island_ne: 'bgm_sprout_tower',
  whirl_island_se: 'bgm_sprout_tower',
  whirl_island_sw: 'bgm_sprout_tower',
  whirl_island_nw: 'bgm_sprout_tower',
  whirl_island_b1f: 'bgm_sprout_tower',
  whirl_island_b2f: 'bgm_sprout_tower',
  whirl_island_lugia_chamber: 'bgm_sprout_tower',

  // Mt. Mortar, Mahogany Town, Lake of Rage & Rocket Hideout
  mount_mortar_1f_outside: 'bgm_sprout_tower',
  mount_mortar_1f_inside: 'bgm_sprout_tower',
  mount_mortar_2f_inside: 'bgm_sprout_tower',
  mount_mortar_b1f: 'bgm_sprout_tower',
  mahogany_town: 'bgm_cherrygrove_city',
  mahogany_mart: 'bgm_cherrygrove_city',
  mahogany_gym: 'bgm_gym',
  mahogany_poke_center: 'bgm_cherrygrove_city',
  mahogany_red_gyarados_speech_house: 'bgm_cherrygrove_city',
  team_rocket_base_b1f: 'bgm_sprout_tower',
  team_rocket_base_b2f: 'bgm_sprout_tower',
  team_rocket_base_b3f: 'bgm_sprout_tower',
  lake_of_rage: 'bgm_route_29',
  lake_of_rage_hidden_power_house: 'bgm_cherrygrove_city',
  lake_of_rage_magikarp_house: 'bgm_cherrygrove_city',

  // Ice Path, Blackthorn City & Dragon's Den
  ice_path_1f: 'bgm_sprout_tower',
  ice_path_b1f: 'bgm_sprout_tower',
  ice_path_b2f_mahogany_side: 'bgm_sprout_tower',
  ice_path_b2f_blackthorn_side: 'bgm_sprout_tower',
  ice_path_b3f: 'bgm_sprout_tower',
  blackthorn_city: 'bgm_cherrygrove_city',
  blackthorn_gym_1f: 'bgm_gym',
  blackthorn_gym_2f: 'bgm_gym',
  blackthorn_dragon_speech_house: 'bgm_cherrygrove_city',
  blackthorn_emys_house: 'bgm_cherrygrove_city',
  blackthorn_mart: 'bgm_cherrygrove_city',
  blackthorn_poke_center: 'bgm_cherrygrove_city',
  move_deleters_house: 'bgm_cherrygrove_city',
  dragons_den_1f: 'bgm_sprout_tower',
  dragons_den_b1f: 'bgm_sprout_tower',
  dragon_shrine: 'bgm_ecruteak_city',

  // Johto Endgame: Route 26/27, Victory Road, Indigo Plateau & Mt. Silver
  route_27: 'bgm_route_29',
  route_27_sandstorm_house: 'bgm_new_bark_town',
  route_26: 'bgm_route_29',
  route_26_heal_house: 'bgm_new_bark_town',
  tohjo_falls: 'bgm_sprout_tower',
  victory_road_gate: 'bgm_gym',
  victory_road: 'bgm_sprout_tower',
  route_22: 'bgm_route_29',
  route_23: 'bgm_gym',
  indigo_plateau_poke_center: 'bgm_gym',
  wills_room: 'bgm_gym',
  kogas_room: 'bgm_gym',
  brunos_room: 'bgm_gym',
  karens_room: 'bgm_gym',
  lances_room: 'bgm_gym',
  hall_of_fame: 'bgm_evolution',
  route_28: 'bgm_route_29',
  route_28_steel_wing_house: 'bgm_cherrygrove_city',
  silver_cave_outside: 'bgm_route_29',
  silver_cave_poke_center: 'bgm_cherrygrove_city',
  silver_cave_room_1: 'bgm_sprout_tower',
  silver_cave_room_2: 'bgm_sprout_tower',
  silver_cave_room_3: 'bgm_sprout_tower',
  silver_cave_item_rooms: 'bgm_sprout_tower',

  // Western & Central Kanto
  pallet_town: 'bgm_new_bark_town',
  reds_house_1f: 'bgm_new_bark_town',
  reds_house_2f: 'bgm_new_bark_town',
  blues_house: 'bgm_new_bark_town',
  route_1: 'bgm_route_29',
  viridian_city: 'bgm_violet_city',
  viridian_gym: 'bgm_gym',
  viridian_poke_center: 'bgm_violet_city',
  viridian_mart: 'bgm_violet_city',
  viridian_nickname_house: 'bgm_violet_city',
  trainer_house_1f: 'bgm_gym',
  trainer_house_b1f: 'bgm_gym',
  route_2: 'bgm_route_29',
  route_2_gate: 'bgm_violet_city',
  route_2_nugget_house: 'bgm_violet_city',
  pewter_city: 'bgm_violet_city',
  pewter_gym: 'bgm_gym',
  pewter_poke_center: 'bgm_violet_city',
  pewter_mart: 'bgm_violet_city',
  pewter_nidoran_house: 'bgm_violet_city',
  pewter_snooze_house: 'bgm_violet_city',
  route_3: 'bgm_route_29',
  mount_moon: 'bgm_sprout_tower',
  mount_moon_square: 'bgm_national_park',
  mount_moon_gift_shop: 'bgm_cherrygrove_city',
  route_4: 'bgm_route_29',
  cerulean_city: 'bgm_goldenrod_city',
  cerulean_gym: 'bgm_gym',
  cerulean_poke_center: 'bgm_goldenrod_city',
  cerulean_mart: 'bgm_goldenrod_city',
  cerulean_police_station: 'bgm_goldenrod_city',
  cerulean_trade_house: 'bgm_goldenrod_city',
  cerulean_badge_house: 'bgm_goldenrod_city',
  route_24: 'bgm_route_29',
  route_25: 'bgm_route_29',
  bills_house: 'bgm_elms_lab',

  // Central & Eastern Kanto
  route_5: 'bgm_route_29',
  route_5_underground_entrance: 'bgm_violet_city',
  route_5_saffron_gate: 'bgm_violet_city',
  route_5_cleanse_tag_house: 'bgm_violet_city',
  underground_path: 'bgm_sprout_tower',
  route_6: 'bgm_route_29',
  route_6_underground_entrance: 'bgm_violet_city',
  route_6_saffron_gate: 'bgm_violet_city',
  vermilion_city: 'bgm_cherrygrove_city',
  vermilion_gym: 'bgm_gym',
  vermilion_poke_center: 'bgm_cherrygrove_city',
  vermilion_mart: 'bgm_cherrygrove_city',
  vermilion_fishing_house: 'bgm_cherrygrove_city',
  vermilion_magnet_train_house: 'bgm_cherrygrove_city',
  vermilion_digletts_house: 'bgm_cherrygrove_city',
  vermilion_port_passage: 'bgm_cherrygrove_city',
  vermilion_port: 'bgm_cherrygrove_city',
  fast_ship_1f: 'bgm_goldenrod_city',
  fast_ship_cabins_nnw_nne_ne: 'bgm_goldenrod_city',
  fast_ship_cabins_sw_ssw_nw: 'bgm_goldenrod_city',
  fast_ship_cabins_se_sse_captains_cabin: 'bgm_goldenrod_city',
  fast_ship_b1f: 'bgm_goldenrod_city',
  route_11: 'bgm_route_29',
  digletts_cave: 'bgm_sprout_tower',
  route_9: 'bgm_route_29',
  route_10_north: 'bgm_route_29',
  route_10_south: 'bgm_route_29',
  route_10_poke_center: 'bgm_violet_city',
  rock_tunnel_1f: 'bgm_sprout_tower',
  rock_tunnel_b1f: 'bgm_sprout_tower',
  lavender_town: 'bgm_ecruteak_city',
  lavender_poke_center: 'bgm_ecruteak_city',
  lavender_mart: 'bgm_ecruteak_city',
  lavender_speech_house: 'bgm_ecruteak_city',
  lavender_name_rater: 'bgm_ecruteak_city',
  soul_house: 'bgm_sprout_tower',
  route_8: 'bgm_route_29',
  route_8_saffron_gate: 'bgm_violet_city',
  route_7: 'bgm_route_29',
  route_7_saffron_gate: 'bgm_violet_city',
  celadon_city: 'bgm_goldenrod_city',
  celadon_gym: 'bgm_gym',
  celadon_poke_center: 'bgm_goldenrod_city',
  celadon_dept_store_1f: 'bgm_goldenrod_city',
  celadon_dept_store_2f: 'bgm_goldenrod_city',
  celadon_dept_store_3f: 'bgm_goldenrod_city',
  celadon_dept_store_4f: 'bgm_goldenrod_city',
  celadon_dept_store_5f: 'bgm_goldenrod_city',
  celadon_dept_store_6f: 'bgm_goldenrod_city',
  celadon_dept_store_elevator: 'bgm_goldenrod_city',
  celadon_mansion_1f: 'bgm_goldenrod_city',
  celadon_mansion_2f: 'bgm_goldenrod_city',
  celadon_mansion_3f: 'bgm_goldenrod_city',
  celadon_mansion_roof: 'bgm_goldenrod_city',
  celadon_mansion_roof_house: 'bgm_goldenrod_city',
  celadon_game_corner: 'bgm_game_corner',
  celadon_game_corner_prize_room: 'bgm_game_corner',
  celadon_cafe: 'bgm_goldenrod_city',

  // Southern Kanto, Saffron & Sea Routes
  saffron_city: 'bgm_goldenrod_city',
  saffron_gym: 'bgm_gym',
  fighting_dojo: 'bgm_gym',
  silph_co_1f: 'bgm_goldenrod_city',
  mr_psychics_house: 'bgm_goldenrod_city',
  saffron_magnet_train_station: 'bgm_goldenrod_city',
  saffron_poke_center: 'bgm_goldenrod_city',
  saffron_mart: 'bgm_goldenrod_city',
  copycats_house_1f: 'bgm_goldenrod_city',
  copycats_house_2f: 'bgm_goldenrod_city',
  route_16: 'bgm_route_29',
  route_16_gate: 'bgm_violet_city',
  route_16_fuchsia_speech_house: 'bgm_violet_city',
  route_17: 'bgm_route_29',
  route_17_route_18_gate: 'bgm_violet_city',
  route_18: 'bgm_route_29',
  fuchsia_city: 'bgm_ecruteak_city',
  fuchsia_gym: 'bgm_gym',
  fuchsia_poke_center: 'bgm_ecruteak_city',
  fuchsia_mart: 'bgm_ecruteak_city',
  safari_zone_main_office: 'bgm_ecruteak_city',
  safari_zone_wardens_home: 'bgm_ecruteak_city',
  route_19_fuchsia_gate: 'bgm_ecruteak_city',
  route_15_fuchsia_gate: 'bgm_ecruteak_city',
  route_12: 'bgm_route_29',
  route_12_super_rod_house: 'bgm_cherrygrove_city',
  route_13: 'bgm_route_29',
  route_14: 'bgm_route_29',
  route_15: 'bgm_route_29',
  route_19: 'bgm_route_29',
  route_20: 'bgm_route_29',
  seafoam_gym: 'bgm_gym',
  cinnabar_island: 'bgm_cherrygrove_city',
  cinnabar_poke_center: 'bgm_cherrygrove_city',
  route_21: 'bgm_route_29',
};

const BATTLE_BGM_TABLE: Record<BattleBgmType, BgmTrackId> = {
  wild: 'bgm_wild_battle',
  trainer: 'bgm_trainer_battle',
  gym_leader: 'bgm_gym_leader_battle',
};

/**
 * Seamless Overworld & Battle Background Music Manager (Ticket 3.8).
 * Handles WebM/MP3 dual-format loop streaming, 800ms map crossfades,
 * 100ms battle ducking, 600ms post-battle restoration, 4-channel Game Boy APU
 * chiptune synthesis mode, and persistent mute state.
 */
export class AudioManager {
  public static readonly MASTER_GAIN = 0.80;
  public static readonly BGM_GAIN = 0.38;
  public static readonly SFX_GAIN = 0.65;
  public static readonly UI_GAIN = 0.45;

  private masterGain: number = AudioManager.MASTER_GAIN;
  private bgmGain: number = AudioManager.BGM_GAIN;
  private sfxGain: number = AudioManager.SFX_GAIN;
  private uiGain: number = AudioManager.UI_GAIN;

  private muted: boolean = false;
  private chiptuneMode: boolean = false;
  private chiptuneSynth: ChiptuneSynthesizer = new ChiptuneSynthesizer();
  private currentTrackId: BgmTrackId | null = null;
  private lastOverworldTrackId: BgmTrackId | null = null;
  private inBattle: boolean = false;

  private howls: Map<BgmTrackId, Howl> = new Map();
  private memoryStorage: Map<string, string> = new Map();

  constructor() {
    const savedMute = this.readStorage(MUTE_STORAGE_KEY);
    if (savedMute === 'true') {
      this.setMuted(true);
    } else {
      this.setMuted(false);
    }
  }

  private isBrowserAudioAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.Audio !== 'undefined';
  }

  private readStorage(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Ignore storage access errors in restricted contexts
    }
    return this.memoryStorage.get(key) ?? null;
  }

  private writeStorage(key: string, value: string): void {
    this.memoryStorage.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage access errors in restricted contexts
    }
  }

  /**
   * Resolves the canonical BGM track ID for any Johto or Kanto map ID.
   */
  public getTrackForMap(mapId: string): BgmTrackId {
    if (MAP_BGM_TABLE[mapId]) {
      return MAP_BGM_TABLE[mapId];
    }
    const clean = (mapId || '').toLowerCase();
    if (clean.includes('gym')) return 'bgm_gym';
    if (clean.includes('game_corner')) return 'bgm_game_corner';
    if (clean.startsWith('route_')) return 'bgm_route_29';
    if (
      clean.includes('cave') ||
      clean.includes('tower') ||
      clean.includes('well') ||
      clean.includes('island') ||
      clean.includes('tunnel') ||
      clean.includes('mortar') ||
      clean.includes('ice_path') ||
      clean.includes('dragons_den') ||
      clean.includes('ruins')
    ) {
      return 'bgm_sprout_tower';
    }
    if (clean.startsWith('ecruteak') || clean.startsWith('lavender') || clean.startsWith('fuchsia')) {
      return 'bgm_ecruteak_city';
    }
    if (clean.startsWith('goldenrod') || clean.startsWith('celadon') || clean.startsWith('saffron') || clean.startsWith('cerulean')) {
      return 'bgm_goldenrod_city';
    }
    if (clean.startsWith('olivine') || clean.startsWith('violet') || clean.startsWith('viridian') || clean.startsWith('pewter')) {
      return 'bgm_violet_city';
    }
    if (clean.startsWith('cherrygrove') || clean.startsWith('azalea') || clean.startsWith('mahogany') || clean.startsWith('blackthorn') || clean.startsWith('vermilion') || clean.startsWith('cinnabar')) {
      return 'bgm_cherrygrove_city';
    }
    return 'bgm_new_bark_town';
  }

  /**
   * Resolves the canonical BGM track ID for a battle type.
   */
  public getTrackForBattle(type: BattleBgmType): BgmTrackId {
    return BATTLE_BGM_TABLE[type];
  }

  /**
   * Returns effective BGM volume (`masterGain * bgmGain`, or `0` when muted).
   */
  public getEffectiveBgmVolume(): number {
    if (this.muted) return 0;
    return Number((this.masterGain * this.bgmGain).toFixed(4));
  }

  /**
   * Returns effective SFX volume (`masterGain * sfxGain`, or `0` when muted).
   */
  public getEffectiveSfxVolume(): number {
    if (this.muted) return 0;
    return Number((this.masterGain * this.sfxGain).toFixed(4));
  }

  /**
   * Returns effective UI volume (`masterGain * uiGain`, or `0` when muted).
   */
  public getEffectiveUiVolume(): number {
    if (this.muted) return 0;
    return Number((this.masterGain * this.uiGain).toFixed(4));
  }

  public getCurrentTrackId(): BgmTrackId | null {
    return this.currentTrackId;
  }

  public getLastOverworldTrackId(): BgmTrackId | null {
    return this.lastOverworldTrackId;
  }

  public isInBattleBgm(): boolean {
    return this.inBattle;
  }

  public isChiptuneMode(): boolean {
    return this.chiptuneMode;
  }

  public getChiptuneSynthesizer(): ChiptuneSynthesizer {
    return this.chiptuneSynth;
  }

  /**
   * Switches between Studio Enhanced BGM (`false`) and 4-Channel Game Boy APU Chiptune synthesis (`true`).
   */
  public setChiptuneMode(enabled: boolean): void {
    if (this.chiptuneMode === enabled) return;
    this.chiptuneMode = enabled;

    if (enabled) {
      // Stop any active Howler streams and start the 4-channel APU synthesizer for the current track
      for (const howl of this.howls.values()) {
        howl.stop();
      }
      if (this.currentTrackId) {
        this.chiptuneSynth.playTrack(this.currentTrackId, this.getEffectiveBgmVolume());
      }
    } else {
      // Stop APU synth and resume Howler stream for the current track
      this.chiptuneSynth.stopTrack();
      if (this.currentTrackId) {
        const howl = this.getOrCreateHowl(this.currentTrackId);
        if (howl) {
          howl.volume(this.getEffectiveBgmVolume());
          if (!howl.playing()) {
            howl.play();
          }
        }
      }
    }
  }

  public toggleChiptuneMode(): boolean {
    this.setChiptuneMode(!this.chiptuneMode);
    return this.chiptuneMode;
  }

  /**
   * Returns the `.webm` primary and `.mp3` fallback asset paths for a BGM track.
   */
  public getTrackSources(trackId: BgmTrackId): [string, string] {
    return [
      `./assets/audio/bgm/${trackId}.webm`,
      `./assets/audio/bgm/${trackId}.mp3`,
    ];
  }

  private getOrCreateHowl(trackId: BgmTrackId): Howl | null {
    if (!this.isBrowserAudioAvailable()) {
      return null;
    }
    let howl = this.howls.get(trackId);
    if (!howl) {
      howl = new Howl({
        src: this.getTrackSources(trackId),
        loop: true,
        volume: this.getEffectiveBgmVolume(),
        html5: false,
      });
      this.howls.set(trackId, howl);
    }
    return howl;
  }

  /**
   * Crossfades to the canonical BGM track for `mapId`.
   * If the new map shares the same BGM track as the currently playing track, playback continues uninterrupted.
   */
  public playMapBgm(mapId: string, durationSec: number = 0.8): void {
    const targetTrack = this.getTrackForMap(mapId);
    this.lastOverworldTrackId = targetTrack;
    this.inBattle = false;
    this.crossfadeTo(targetTrack, durationSec);
  }

  /**
   * Smoothly crossfades from the active track to `trackId` over `durationSec` seconds (default 800ms).
   */
  public crossfadeTo(trackId: BgmTrackId, durationSec: number = 0.8): void {
    if (this.currentTrackId === trackId) {
      return;
    }

    const previousTrackId = this.currentTrackId;
    this.currentTrackId = trackId;
    const durationMs = Math.max(0, Math.round(durationSec * 1000));
    const targetVol = this.getEffectiveBgmVolume();

    if (this.chiptuneMode) {
      this.chiptuneSynth.playTrack(trackId, targetVol);
      return;
    }

    if (previousTrackId) {
      const prevHowl = this.howls.get(previousTrackId);
      if (prevHowl) {
        if (durationMs > 0 && prevHowl.playing()) {
          prevHowl.fade(prevHowl.volume(), 0, durationMs);
          setTimeout(() => {
            if (this.currentTrackId !== previousTrackId) {
              prevHowl.stop();
            }
          }, durationMs);
        } else {
          prevHowl.stop();
        }
      }
    }

    const nextHowl = this.getOrCreateHowl(trackId);
    if (nextHowl) {
      if (!nextHowl.playing()) {
        nextHowl.volume(durationMs > 0 ? 0 : targetVol);
        nextHowl.play();
      }
      if (durationMs > 0) {
        nextHowl.fade(nextHowl.volume(), targetVol, durationMs);
      } else {
        nextHowl.volume(targetVol);
      }
    }
  }

  /**
   * Ducks the overworld BGM over 100ms and starts the requested Battle BGM track.
   */
  public playBattleBgm(type: BattleBgmType = 'wild'): void {
    const battleTrack = this.getTrackForBattle(type);
    const prevTrackId = this.currentTrackId;
    if (prevTrackId && !this.inBattle) {
      this.lastOverworldTrackId = prevTrackId;
    }

    this.inBattle = true;
    this.currentTrackId = battleTrack;

    if (this.chiptuneMode) {
      this.chiptuneSynth.playTrack(battleTrack, this.getEffectiveBgmVolume());
      return;
    }

    if (prevTrackId && prevTrackId !== battleTrack) {
      const prevHowl = this.howls.get(prevTrackId);
      if (prevHowl) {
        if (prevHowl.playing()) {
          prevHowl.fade(prevHowl.volume(), 0, 100);
          setTimeout(() => {
            if (this.currentTrackId !== prevTrackId) {
              prevHowl.pause();
            }
          }, 100);
        } else {
          prevHowl.pause();
        }
      }
    }

    const battleHowl = this.getOrCreateHowl(battleTrack);
    if (battleHowl) {
      battleHowl.stop();
      battleHowl.volume(this.getEffectiveBgmVolume());
      battleHowl.play();
    }
  }

  /**
   * Stops the battle BGM and fades the current map's overworld BGM back in over 600ms.
   */
  public restoreOverworldBgm(durationSec: number = 0.6): void {
    const activeBattleTrack = this.currentTrackId;
    this.inBattle = false;
    BattleAudio.stopLowHpAlarm();

    const restoreTrack = this.lastOverworldTrackId ?? 'bgm_new_bark_town';
    this.currentTrackId = restoreTrack;

    if (this.chiptuneMode) {
      this.chiptuneSynth.playTrack(restoreTrack, this.getEffectiveBgmVolume());
      return;
    }

    if (activeBattleTrack && activeBattleTrack !== this.lastOverworldTrackId) {
      const battleHowl = this.howls.get(activeBattleTrack);
      if (battleHowl) {
        battleHowl.stop();
      }
    }

    const overworldHowl = this.getOrCreateHowl(restoreTrack);
    if (overworldHowl) {
      const targetVol = this.getEffectiveBgmVolume();
      const durationMs = Math.max(0, Math.round(durationSec * 1000));
      if (!overworldHowl.playing()) {
        overworldHowl.volume(0);
        overworldHowl.play();
      }
      overworldHowl.fade(overworldHowl.volume(), targetVol, durationMs);
    }
  }

  /**
   * Sets global mute state, syncs `BattleAudio.muted` & `ChiptuneSynthesizer`, and persists preference.
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
    BattleAudio.muted = muted;
    this.chiptuneSynth.setMuted(muted);
    this.writeStorage(MUTE_STORAGE_KEY, String(muted));

    if (this.isBrowserAudioAvailable()) {
      try {
        Howler.mute(muted);
      } catch {
        // Ignore in headless environments
      }
    }

    if (this.currentTrackId) {
      const activeHowl = this.howls.get(this.currentTrackId);
      if (activeHowl) {
        activeHowl.volume(this.getEffectiveBgmVolume());
      }
      this.chiptuneSynth.setVolume(this.getEffectiveBgmVolume());
    }
  }

  /**
   * Toggles mute state and returns the new `muted` boolean.
   */
  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Unlocks browser WebAudio / Howler AudioContext on first user interaction
   * and starts the Title Screen BGM loop (Ticket 4.2).
   */
  public async unlockAudio(): Promise<void> {
    if (this.isBrowserAudioAvailable()) {
      try {
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
          await Howler.ctx.resume();
        }
      } catch {
        // Ignore resume errors in headless or restricted contexts
      }
    }
    this.playTitleBgm();
  }

  /**
   * Starts the Title Screen BGM loop (`bgm_new_bark_town`).
   */
  public playTitleBgm(): void {
    this.lastOverworldTrackId = 'bgm_new_bark_town';
    this.inBattle = false;
    this.crossfadeTo('bgm_new_bark_town', 0.4);
  }

  /**
   * Updates BGM volume gain (0.0 - 1.0) and refreshes active track volume.
   */
  public setBgmVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.bgmGain = Number((AudioManager.BGM_GAIN * (clamped / 0.7)).toFixed(4));
    const effective = this.getEffectiveBgmVolume();
    this.chiptuneSynth.setVolume(effective);
    if (this.currentTrackId) {
      const activeHowl = this.howls.get(this.currentTrackId);
      if (activeHowl) {
        activeHowl.volume(effective);
      }
    }
  }

  /**
   * Updates SFX volume gain (0.0 - 1.0).
   */
  public setSfxVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.sfxGain = Number((AudioManager.SFX_GAIN * (clamped / 0.7)).toFixed(4));
  }

  /**
   * Crossfades into the canonical evolution theme (`bgm_evolution`).
   */
  public playEvolutionBgm(): void {
    this.crossfadeTo('bgm_evolution', 0.2);
  }

  /**
   * Plays a one-shot authentic SFX audio asset (e.g. `sfx_badge_get`, `sfx_evolution_pulse`, `sfx_evolution_complete`).
   */
  public playSfx(sfxId: 'sfx_badge_get' | 'sfx_evolution_pulse' | 'sfx_evolution_complete'): void {
    if (this.muted || !this.isBrowserAudioAvailable()) return;
    try {
      const sfx = new Howl({
        src: [`./assets/audio/sfx/${sfxId}.webm`, `./assets/audio/sfx/${sfxId}.mp3`],
        loop: false,
        volume: this.getEffectiveSfxVolume(),
        html5: false,
      });
      sfx.play();
    } catch {
      // Ignore in headless test contexts
    }
  }
}

