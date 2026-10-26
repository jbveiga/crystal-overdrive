import { Howl, Howler } from 'howler';
import { BattleAudio } from './BattleAudio';
import { ChiptuneSynthesizer } from './ChiptuneSynthesizer';
import { BgmTrackId, BattleBgmType, MAP_BGM_TABLE, BATTLE_BGM_TABLE } from './mapBgmTable';

export type { BgmTrackId, BattleBgmType };
export { MAP_BGM_TABLE, BATTLE_BGM_TABLE };

const MUTE_STORAGE_KEY = 'crystal_overdrive_muted';

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

