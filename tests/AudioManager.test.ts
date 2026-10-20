import { describe, it, expect, beforeEach } from 'vitest';
import { AudioManager } from '../src/audio/AudioManager';
import { BattleAudio } from '../src/audio/BattleAudio';

describe('AudioManager (Ticket 3.8)', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
    audioManager.setMuted(false);
  });

  it('resolves canonical Johto BGM tracks by map ID', () => {
    // New Bark Town & Houses
    expect(audioManager.getTrackForMap('new_bark_town')).toBe('bgm_new_bark_town');
    expect(audioManager.getTrackForMap('players_house_1f')).toBe('bgm_new_bark_town');
    expect(audioManager.getTrackForMap('players_neighbors_house')).toBe('bgm_new_bark_town');
    expect(audioManager.getTrackForMap('elms_house')).toBe('bgm_new_bark_town');

    // Prof. Elm's Lab
    expect(audioManager.getTrackForMap('elms_lab')).toBe('bgm_elms_lab');

    // Early Johto Routes & Route Houses
    expect(audioManager.getTrackForMap('route_29')).toBe('bgm_route_29');
    expect(audioManager.getTrackForMap('route_30')).toBe('bgm_route_29');
    expect(audioManager.getTrackForMap('route_31')).toBe('bgm_route_29');
    expect(audioManager.getTrackForMap('mr_pokemons_house')).toBe('bgm_route_29');
    expect(audioManager.getTrackForMap('route_30_berry_house')).toBe('bgm_route_29');

    // Cherrygrove City & Indoors
    expect(audioManager.getTrackForMap('cherrygrove_city')).toBe('bgm_cherrygrove_city');
    expect(audioManager.getTrackForMap('cherrygrove_mart')).toBe('bgm_cherrygrove_city');
    expect(audioManager.getTrackForMap('cherrygrove_poke_center')).toBe('bgm_cherrygrove_city');
    expect(audioManager.getTrackForMap('guide_gents_house')).toBe('bgm_cherrygrove_city');
    expect(audioManager.getTrackForMap('cherrygrove_gym_speech_house')).toBe('bgm_cherrygrove_city');
    expect(audioManager.getTrackForMap('cherrygrove_evolution_speech_house')).toBe('bgm_cherrygrove_city');

    // Violet City, Sprout Tower & Violet Gym
    expect(audioManager.getTrackForMap('violet_city')).toBe('bgm_violet_city');
    expect(audioManager.getTrackForMap('sprout_tower_1f')).toBe('bgm_sprout_tower');
    expect(audioManager.getTrackForMap('violet_gym')).toBe('bgm_gym');

    // Battle BGM
    expect(audioManager.getTrackForBattle('wild')).toBe('bgm_wild_battle');
    expect(audioManager.getTrackForBattle('trainer')).toBe('bgm_trainer_battle');
    expect(audioManager.getTrackForBattle('gym_leader')).toBe('bgm_gym_leader_battle');
  });

  it('computes effective gain staging volumes (Master 0.80, BGM 0.38, SFX 0.65, UI 0.45)', () => {
    expect(AudioManager.MASTER_GAIN).toBe(0.8);
    expect(AudioManager.BGM_GAIN).toBe(0.38);
    expect(AudioManager.SFX_GAIN).toBe(0.65);
    expect(AudioManager.UI_GAIN).toBe(0.45);

    expect(audioManager.getEffectiveBgmVolume()).toBeCloseTo(0.304, 4);
    expect(audioManager.getEffectiveSfxVolume()).toBeCloseTo(0.52, 4);
    expect(audioManager.getEffectiveUiVolume()).toBeCloseTo(0.36, 4);
  });

  it('provides relative .webm (primary) and .mp3 (fallback) track sources', () => {
    expect(audioManager.getTrackSources('bgm_new_bark_town')).toEqual([
      './assets/audio/bgm/bgm_new_bark_town.webm',
      './assets/audio/bgm/bgm_new_bark_town.mp3',
    ]);
  });

  it('tracks map transitions, battle ducking, and post-battle overworld BGM restoration', () => {
    audioManager.playMapBgm('new_bark_town');
    expect(audioManager.getCurrentTrackId()).toBe('bgm_new_bark_town');
    expect(audioManager.isInBattleBgm()).toBe(false);

    // Entering Player's House keeps bgm_new_bark_town active
    audioManager.playMapBgm('players_house_1f');
    expect(audioManager.getCurrentTrackId()).toBe('bgm_new_bark_town');

    // Walking onto Route 29 crossfades to bgm_route_29
    audioManager.playMapBgm('route_29');
    expect(audioManager.getCurrentTrackId()).toBe('bgm_route_29');
    expect(audioManager.getLastOverworldTrackId()).toBe('bgm_route_29');

    // Triggering a wild battle ducks overworld BGM and switches to bgm_wild_battle
    audioManager.playBattleBgm('wild');
    expect(audioManager.getCurrentTrackId()).toBe('bgm_wild_battle');
    expect(audioManager.isInBattleBgm()).toBe(true);
    expect(audioManager.getLastOverworldTrackId()).toBe('bgm_route_29');

    // Ending battle restores Route 29 BGM
    audioManager.restoreOverworldBgm();
    expect(audioManager.getCurrentTrackId()).toBe('bgm_route_29');
    expect(audioManager.isInBattleBgm()).toBe(false);
  });

  it('synchronizes mute state with BattleAudio and zeroes effective volumes when muted', () => {
    expect(audioManager.isMuted()).toBe(false);
    expect(BattleAudio.muted).toBe(false);

    const nextMuted = audioManager.toggleMute();
    expect(nextMuted).toBe(true);
    expect(audioManager.isMuted()).toBe(true);
    expect(BattleAudio.muted).toBe(true);
    expect(audioManager.getEffectiveBgmVolume()).toBe(0);
    expect(audioManager.getEffectiveSfxVolume()).toBe(0);
    expect(audioManager.getEffectiveUiVolume()).toBe(0);

    audioManager.setMuted(false);
    expect(audioManager.isMuted()).toBe(false);
    expect(BattleAudio.muted).toBe(false);
    expect(audioManager.getEffectiveBgmVolume()).toBeCloseTo(0.304, 4);
  });
});
