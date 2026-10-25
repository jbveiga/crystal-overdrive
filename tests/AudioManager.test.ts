import { describe, it, expect, beforeEach } from 'vitest';
import { AudioManager } from '../src/audio/AudioManager';
import { BattleAudio } from '../src/audio/BattleAudio';
import { ChiptuneSynthesizer } from '../src/audio/ChiptuneSynthesizer';

describe('AudioManager & Chiptune Audio Engine', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
    audioManager.setMuted(false);
    BattleAudio.stopLowHpAlarm();
    BattleAudio.setLowHpBeepEnabled(true);
  });

  it('resolves canonical Johto and Kanto BGM tracks by map ID', () => {
    // New Bark Town & Houses
    expect(audioManager.getTrackForMap('new_bark_town')).toBe('bgm_new_bark_town');
    expect(audioManager.getTrackForMap('players_house_1f')).toBe('bgm_new_bark_town');
    expect(audioManager.getTrackForMap('players_house_2f')).toBe('bgm_new_bark_town');
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

    // Extended Johto & Kanto coverage
    expect(audioManager.getTrackForMap('goldenrod_city')).toBe('bgm_goldenrod_city');
    expect(audioManager.getTrackForMap('ecruteak_city')).toBe('bgm_ecruteak_city');
    expect(audioManager.getTrackForMap('tin_tower_1f')).toBe('bgm_sprout_tower');
    expect(audioManager.getTrackForMap('national_park')).toBe('bgm_national_park');
    expect(audioManager.getTrackForMap('team_rocket_base_b1f')).toBe('bgm_sprout_tower');
    expect(audioManager.getTrackForMap('dragons_den_b1f')).toBe('bgm_sprout_tower');
    expect(audioManager.getTrackForMap('indigo_plateau_poke_center')).toBe('bgm_gym');
    expect(audioManager.getTrackForMap('pallet_town')).toBe('bgm_new_bark_town');
    expect(audioManager.getTrackForMap('saffron_city')).toBe('bgm_goldenrod_city');
    expect(audioManager.getTrackForMap('celadon_gym')).toBe('bgm_gym');
    expect(audioManager.getTrackForMap('lavender_town')).toBe('bgm_ecruteak_city');
    expect(audioManager.getTrackForMap('silver_cave_room_3')).toBe('bgm_sprout_tower');

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

    // Ending battle stops any low-HP alarm and restores Route 29 BGM
    BattleAudio.startLowHpAlarm();
    expect(BattleAudio.isLowHpAlarmActive()).toBe(true);
    audioManager.restoreOverworldBgm();
    expect(BattleAudio.isLowHpAlarmActive()).toBe(false);
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

  it('toggles 8-Bit Chiptune Synthesizer mode and manages 4-channel APU playback', () => {
    expect(audioManager.isChiptuneMode()).toBe(false);
    const enabled = audioManager.toggleChiptuneMode();
    expect(enabled).toBe(true);
    expect(audioManager.isChiptuneMode()).toBe(true);

    audioManager.playMapBgm('goldenrod_city');
    expect(audioManager.getChiptuneSynthesizer().isPlaying()).toBe(true);
    expect(audioManager.getChiptuneSynthesizer().getCurrentTrackId()).toBe('bgm_goldenrod_city');

    const disabled = audioManager.toggleChiptuneMode();
    expect(disabled).toBe(false);
    expect(audioManager.getChiptuneSynthesizer().isPlaying()).toBe(false);
  });

  it('verifies ChiptuneSynthesizer 4-channel patterns (Pulse 1, Pulse 2, Wave, Noise)', () => {
    const synth = new ChiptuneSynthesizer();
    const pattern = synth.getPatternForTrack('bgm_gym_leader_battle');
    expect(pattern.bpm).toBeGreaterThan(120);
    expect(pattern.steps.length).toBeGreaterThan(0);
    expect(pattern.steps.some((s) => Boolean(s.pulse1))).toBe(true);
    expect(pattern.steps.some((s) => Boolean(s.pulse2))).toBe(true);
    expect(pattern.steps.some((s) => Boolean(s.wave))).toBe(true);
    expect(pattern.steps.some((s) => Boolean(s.noise))).toBe(true);

    synth.playTrack('bgm_wild_battle');
    expect(synth.isPlaying()).toBe(true);
    expect(synth.getCurrentTrackId()).toBe('bgm_wild_battle');

    synth.stopTrack();
    expect(synth.isPlaying()).toBe(false);
    expect(synth.getCurrentTrackId()).toBeNull();
  });

  it('manages the Gen 2 Low-HP Warning Alarm (<= 20% HP) and respects lowHpBeepEnabled', () => {
    expect(BattleAudio.isLowHpAlarmActive()).toBe(false);

    // Above 20% HP -> alarm stays off
    BattleAudio.updateLowHpState(25, 100);
    expect(BattleAudio.isLowHpAlarmActive()).toBe(false);

    // At 20% HP -> alarm activates
    BattleAudio.updateLowHpState(20, 100);
    expect(BattleAudio.isLowHpAlarmActive()).toBe(true);

    // Healing above 20% HP -> alarm stops
    BattleAudio.updateLowHpState(50, 100);
    expect(BattleAudio.isLowHpAlarmActive()).toBe(false);

    // Fainted (0 HP) -> alarm stops
    BattleAudio.updateLowHpState(10, 100);
    expect(BattleAudio.isLowHpAlarmActive()).toBe(true);
    BattleAudio.updateLowHpState(0, 100);
    expect(BattleAudio.isLowHpAlarmActive()).toBe(false);

    // Disabling lowHpBeepEnabled stops active alarm and prevents restart
    BattleAudio.updateLowHpState(15, 100);
    expect(BattleAudio.isLowHpAlarmActive()).toBe(true);
    BattleAudio.setLowHpBeepEnabled(false);
    expect(BattleAudio.isLowHpAlarmActive()).toBe(false);
    BattleAudio.updateLowHpState(10, 100);
    expect(BattleAudio.isLowHpAlarmActive()).toBe(false);
  });

  it('plays authentic retro overworld, status, and weather sound effects without throwing', () => {
    expect(() => {
      BattleAudio.playOverworldSound('BUMP');
      BattleAudio.playOverworldSound('HOP');
      BattleAudio.playOverworldSound('RUSTLE');
      BattleAudio.playOverworldSound('HEAL_JINGLE');
      BattleAudio.playOverworldSound('FANFARE');
      BattleAudio.playOverworldSound('EXCLAMATION');
      BattleAudio.playOverworldSound('DOOR');
      BattleAudio.playOverworldSound('KEY_ITEM');
      BattleAudio.playOverworldSound('PHONE_RING');
      BattleAudio.playStatusSound('PSN');
      BattleAudio.playStatusSound('BRN');
      BattleAudio.playStatusSound('PAR');
      BattleAudio.playStatusSound('SLP');
      BattleAudio.playStatusSound('FRZ');
      BattleAudio.playWeatherSound('RAIN');
      BattleAudio.playWeatherSound('SUN');
      BattleAudio.playWeatherSound('SANDSTORM');
    }).not.toThrow();
  });
});

