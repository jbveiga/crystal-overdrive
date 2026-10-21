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
});
