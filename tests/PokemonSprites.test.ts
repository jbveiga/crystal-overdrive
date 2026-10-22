import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Dex } from '@pkmn/dex';

describe('Complete 251 Pokémon Sprites & Icons Integrity', () => {
  const pokemonDir = path.resolve(__dirname, '../public/assets/sprites/pokemon');
  const iconsDir = path.join(pokemonDir, 'icons');

  it('verifies all 251 Generation 2 species have valid front battle sprites', () => {
    for (let num = 1; num <= 251; num++) {
      const species = Dex.species.all().find((s) => s.num === num && !s.forme);
      expect(species).toBeDefined();

      const frontFile = path.join(pokemonDir, `${species!.id}_front.png`);
      expect(fs.existsSync(frontFile)).toBe(true);
      expect(fs.statSync(frontFile).size).toBeGreaterThan(0);
    }
  });

  it('verifies all 251 Generation 2 species have valid back battle sprites', () => {
    for (let num = 1; num <= 251; num++) {
      const species = Dex.species.all().find((s) => s.num === num && !s.forme);
      expect(species).toBeDefined();

      const backFile = path.join(pokemonDir, `${species!.id}_back.png`);
      expect(fs.existsSync(backFile)).toBe(true);
      expect(fs.statSync(backFile).size).toBeGreaterThan(0);
    }
  });

  it('verifies all 251 Generation 2 species have valid party/box menu mini-icons', () => {
    for (let num = 1; num <= 251; num++) {
      const species = Dex.species.all().find((s) => s.num === num && !s.forme);
      expect(species).toBeDefined();

      const iconFile = path.join(iconsDir, `${species!.id}.png`);
      expect(fs.existsSync(iconFile)).toBe(true);
      expect(fs.statSync(iconFile).size).toBeGreaterThan(0);
    }
  });

  it('verifies special character aliases exist (Mr. Mime, Ho-Oh, Nidoran)', () => {
    const specialAliases = ['mr_mime', 'ho_oh', 'nidoran_f', 'nidoran_m'];
    for (const alias of specialAliases) {
      expect(fs.existsSync(path.join(pokemonDir, `${alias}_front.png`))).toBe(true);
      expect(fs.existsSync(path.join(pokemonDir, `${alias}_back.png`))).toBe(true);
      expect(fs.existsSync(path.join(iconsDir, `${alias}.png`))).toBe(true);
    }
  });

  it('verifies Egg battle sprites and party icon exist and are valid', () => {
    const eggFront = path.join(pokemonDir, 'egg_front.png');
    const eggBack = path.join(pokemonDir, 'egg_back.png');
    const eggIcon = path.join(iconsDir, 'egg.png');

    expect(fs.existsSync(eggFront)).toBe(true);
    expect(fs.statSync(eggFront).size).toBeGreaterThan(0);
    expect(fs.existsSync(eggBack)).toBe(true);
    expect(fs.statSync(eggBack).size).toBeGreaterThan(0);
    expect(fs.existsSync(eggIcon)).toBe(true);
    expect(fs.statSync(eggIcon).size).toBeGreaterThan(0);
  });

  it('verifies Route 34 and Day-Care NPC character sheets exist and match 144x32 specs', () => {
    const charsDir = path.resolve(__dirname, '../public/assets/sprites/characters');
    const expectedSheets = [
      'gramps.png',
      'granny.png',
      'officer.png',
      'camper.png',
      'picnicker.png',
      'youngster.png',
      'pokefan_m.png',
      'pokefan_f.png',
      'cooltrainer_f.png',
    ];

    for (const sheet of expectedSheets) {
      const filePath = path.join(charsDir, sheet);
      expect(fs.existsSync(filePath), `Missing sheet: ${sheet}`).toBe(true);
      const buf = fs.readFileSync(filePath);
      expect(buf.readUInt32BE(16), `${sheet} width`).toBe(144);
      expect(buf.readUInt32BE(20), `${sheet} height`).toBe(32);
    }
  });

  it('verifies Goldenrod City NPC character sheets exist and match 144x32 specs', () => {
    const charsDir = path.resolve(__dirname, '../public/assets/sprites/characters');
    const goldenrodSheets = [
      'whitney.png',
      'clerk.png',
      'bike_shop_owner.png',
      'receptionist.png',
      'gentleman.png',
      'lass.png',
      'beauty.png',
      'rocket_grunt_m.png',
      'rocket_grunt_f.png',
    ];

    for (const sheet of goldenrodSheets) {
      const filePath = path.join(charsDir, sheet);
      expect(fs.existsSync(filePath), `Missing sheet: ${sheet}`).toBe(true);
      const buf = fs.readFileSync(filePath);
      expect(buf.readUInt32BE(16), `${sheet} width`).toBe(144);
      expect(buf.readUInt32BE(20), `${sheet} height`).toBe(32);
      expect(buf.length).toBeGreaterThan(0);
    }
  });

  it('verifies Goldenrod key items, equipment icons, and Johto badges exist on disk', () => {
    const itemsDir = path.resolve(__dirname, '../public/assets/sprites/items');
    const badgesDir = path.resolve(__dirname, '../public/assets/sprites/badges');

    const expectedItems = [
      'bicycle.png',
      'squirtbottle.png',
      'coin_case.png',
      'radio_card.png',
      'blue_card.png',
      'card_key.png',
      'basement_key.png',
    ];

    for (const it of expectedItems) {
      const p = path.join(itemsDir, it);
      expect(fs.existsSync(p), `Missing item icon: ${it}`).toBe(true);
      expect(fs.statSync(p).size).toBeGreaterThan(0);
    }

    const expectedBadges = [
      'badge_zephyr.png',
      'badge_hive.png',
      'badge_plain.png',
      'badge_fog.png',
      'badge_storm.png',
      'badge_mineral.png',
      'badge_glacier.png',
      'badge_rising.png',
    ];

    for (const b of expectedBadges) {
      const p = path.join(badgesDir, b);
      expect(fs.existsSync(p), `Missing badge: ${b}`).toBe(true);
      const buf = fs.readFileSync(p);
      expect(buf.readUInt32BE(16), `${b} width`).toBe(16);
      expect(buf.readUInt32BE(20), `${b} height`).toBe(16);
    }
  });

  it('verifies Goldenrod City BGM tracks exist in both MP3 and WebM formats', () => {
    const bgmDir = path.resolve(__dirname, '../public/assets/audio/bgm');
    const expectedTracks = [
      'bgm_goldenrod_city.mp3',
      'bgm_goldenrod_city.webm',
      'bgm_game_corner.mp3',
      'bgm_game_corner.webm',
      'bgm_gym.mp3',
      'bgm_gym.webm',
    ];

    for (const track of expectedTracks) {
      const p = path.join(bgmDir, track);
      expect(fs.existsSync(p), `Missing BGM track: ${track}`).toBe(true);
      expect(fs.statSync(p).size).toBeGreaterThan(0);
    }
  });

  it('verifies Route 35 and National Park NPC character sheets exist and match 144x32 specs', () => {
    const charsDir = path.resolve(__dirname, '../public/assets/sprites/characters');
    const expectedSheets = [
      'firebreather.png',
      'psychic.png',
      'psychic_m.png',
      'schoolboy.png',
      'school_kid_m.png',
      'super_nerd.png',
      'juggler.png',
      'officer.png',
      'bird_keeper.png',
    ];

    for (const sheet of expectedSheets) {
      const filePath = path.join(charsDir, sheet);
      expect(fs.existsSync(filePath), `Missing sheet: ${sheet}`).toBe(true);
      const buf = fs.readFileSync(filePath);
      expect(buf.readUInt32BE(16), `${sheet} width`).toBe(144);
      expect(buf.readUInt32BE(20), `${sheet} height`).toBe(32);
      expect(buf.length).toBeGreaterThan(0);
    }
  });

  it('verifies Route 35 and National Park key items, TM, and Park Ball exist on disk', () => {
    const itemsDir = path.resolve(__dirname, '../public/assets/sprites/items');
    const expectedItems = [
      'tm_fighting.png',
      'tm-fighting.png',
      'tm08.png',
      'quick_claw.png',
      'quick-claw.png',
      'sun_stone.png',
      'sun-stone.png',
      'park_ball.png',
      'park-ball.png',
      'parkball.png',
    ];

    for (const it of expectedItems) {
      const p = path.join(itemsDir, it);
      expect(fs.existsSync(p), `Missing item icon: ${it}`).toBe(true);
      expect(fs.statSync(p).size).toBeGreaterThan(0);
    }
  });

  it('verifies National Park BGM and Sudowoodo cry audio exist on disk', () => {
    const bgmDir = path.resolve(__dirname, '../public/assets/audio/bgm');
    const criesDir = path.resolve(__dirname, '../public/assets/audio/cries');

    expect(fs.existsSync(path.join(bgmDir, 'bgm_national_park.mp3'))).toBe(true);
    expect(fs.existsSync(path.join(bgmDir, 'bgm_national_park.webm'))).toBe(true);
    expect(fs.statSync(path.join(bgmDir, 'bgm_national_park.mp3')).size).toBeGreaterThan(0);

    expect(fs.existsSync(path.join(criesDir, '185.mp3'))).toBe(true);
    expect(fs.existsSync(path.join(criesDir, 'sudowoodo.mp3'))).toBe(true);
    expect(fs.statSync(path.join(criesDir, '185.mp3')).size).toBeGreaterThan(0);
  });

  it('verifies SPRINT-14 evolution items, Link Stone/Cable, and stones exist on disk', () => {
    const itemsDir = path.resolve(__dirname, '../public/assets/sprites/items');
    const expectedItems = [
      'linking-cord.png',
      'link_stone.png',
      'link-cable.png',
      'fire-stone.png',
      'water-stone.png',
      'thunder-stone.png',
      'leaf-stone.png',
      'moon-stone.png',
      'everstone.png',
      'metal-coat.png',
      'dragon-scale.png',
      'kings-rock.png',
      'upgrade.png',
    ];

    for (const it of expectedItems) {
      const p = path.join(itemsDir, it);
      expect(fs.existsSync(p), `Missing evolution item: ${it}`).toBe(true);
      expect(fs.statSync(p).size).toBeGreaterThan(0);
    }
  });

  it('verifies SPRINT-14 evolution audio BGM and celebration fanfares exist on disk', () => {
    const bgmDir = path.resolve(__dirname, '../public/assets/audio/bgm');
    const sfxDir = path.resolve(__dirname, '../public/assets/audio/sfx');

    expect(fs.existsSync(path.join(bgmDir, 'bgm_evolution.mp3'))).toBe(true);
    expect(fs.existsSync(path.join(bgmDir, 'bgm_evolution.webm'))).toBe(true);
    expect(fs.statSync(path.join(bgmDir, 'bgm_evolution.mp3')).size).toBeGreaterThan(0);

    expect(fs.existsSync(path.join(sfxDir, 'sfx_evolution_complete.mp3'))).toBe(true);
    expect(fs.existsSync(path.join(sfxDir, 'sfx_evolution_complete.webm'))).toBe(true);
    expect(fs.statSync(path.join(sfxDir, 'sfx_evolution_complete.mp3')).size).toBeGreaterThan(0);

    expect(fs.existsSync(path.join(sfxDir, 'sfx_evolution_pulse.mp3'))).toBe(true);
    expect(fs.existsSync(path.join(sfxDir, 'sfx_evolution_pulse.webm'))).toBe(true);
    expect(fs.statSync(path.join(sfxDir, 'sfx_evolution_pulse.mp3')).size).toBeGreaterThan(0);
  });

  it('verifies Route 36 Sudowoodo overworld sprites are present and valid', () => {
    const charsDir = path.resolve(__dirname, '../public/assets/sprites/characters');
    const spritesDir = path.resolve(__dirname, '../public/assets/sprites');

    // 144x32 9-frame character walk sheet
    const charSudowoodo = path.join(charsDir, 'sudowoodo.png');
    expect(fs.existsSync(charSudowoodo)).toBe(true);
    const buf144 = fs.readFileSync(charSudowoodo);
    expect(buf144.readUInt32BE(16)).toBe(144);
    expect(buf144.readUInt32BE(20)).toBe(32);

    // 16x32 GBC sprite
    const gbcSudowoodo = path.join(spritesDir, 'sudowoodo.png');
    expect(fs.existsSync(gbcSudowoodo)).toBe(true);
    const bufGbc = fs.readFileSync(gbcSudowoodo);
    expect(bufGbc.readUInt32BE(16)).toBe(16);
    expect(bufGbc.readUInt32BE(20)).toBe(32);
  });
});
