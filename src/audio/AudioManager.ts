import { Howl, Howler } from 'howler';
import { BattleAudio } from './BattleAudio';

export type BgmTrackId =
  | 'bgm_new_bark_town'
  | 'bgm_elms_lab'
  | 'bgm_route_29'
  | 'bgm_cherrygrove_city'
  | 'bgm_violet_city'
  | 'bgm_sprout_tower'
  | 'bgm_gym'
  | 'bgm_wild_battle'
  | 'bgm_trainer_battle'
  | 'bgm_gym_leader_battle';

export type BattleBgmType = 'wild' | 'trainer' | 'gym_leader';

const MUTE_STORAGE_KEY = 'crystal_overdrive_muted';

const MAP_BGM_TABLE: Record<string, BgmTrackId> = {
  // New Bark Town & Houses
  new_bark_town: 'bgm_new_bark_town',
  players_house_1f: 'bgm_new_bark_town',
  players_neighbors_house: 'bgm_new_bark_town',
  elms_house: 'bgm_new_bark_town',

  // Prof. Elm's Lab
  elms_lab: 'bgm_elms_lab',

  // Early Johto Routes & Route Houses
  route_29: 'bgm_route_29',
  route_30: 'bgm_route_29',
  route_31: 'bgm_route_29',
  mr_pokemons_house: 'bgm_route_29',
  route_30_berry_house: 'bgm_route_29',

  // Cherrygrove City & Indoors
  cherrygrove_city: 'bgm_cherrygrove_city',
  cherrygrove_mart: 'bgm_cherrygrove_city',
  cherrygrove_poke_center: 'bgm_cherrygrove_city',
  guide_gents_house: 'bgm_cherrygrove_city',
  cherrygrove_gym_speech_house: 'bgm_cherrygrove_city',
  cherrygrove_evolution_speech_house: 'bgm_cherrygrove_city',

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
};

const BATTLE_BGM_TABLE: Record<BattleBgmType, BgmTrackId> = {
  wild: 'bgm_wild_battle',
  trainer: 'bgm_trainer_battle',
  gym_leader: 'bgm_gym_leader_battle',
};

/**
 * Seamless Overworld & Battle Background Music Manager (Ticket 3.8).
 * Handles WebM/MP3 dual-format loop streaming, 800ms map crossfades,
 * 100ms battle ducking, 600ms post-battle restoration, and persistent mute state.
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
   * Resolves the canonical BGM track ID for any Johto map ID.
   */
  public getTrackForMap(mapId: string): BgmTrackId {
    return MAP_BGM_TABLE[mapId] ?? 'bgm_new_bark_town';
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

    if (activeBattleTrack && activeBattleTrack !== this.lastOverworldTrackId) {
      const battleHowl = this.howls.get(activeBattleTrack);
      if (battleHowl) {
        battleHowl.stop();
      }
    }

    const restoreTrack = this.lastOverworldTrackId ?? 'bgm_new_bark_town';
    this.currentTrackId = restoreTrack;

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
   * Sets global mute state, syncs `BattleAudio.muted`, and persists preference.
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
    BattleAudio.muted = muted;
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
}
