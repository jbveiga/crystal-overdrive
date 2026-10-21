import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Legal Sanitization & Fan-Made Licensing (TICKET-LEGAL-PRIVATIZATION-AND-SANITIZATION-01)', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('README.md exists and contains zero occurrences of trademark terms', () => {
    const readmePath = path.join(rootDir, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const readmeContent = fs.readFileSync(readmePath, 'utf-8');

    // Case-insensitive regex for trademarked terms: "pokemon", "pokémon", "johto"
    const trademarkRegex = /pok[eé]mon|johto/i;
    const match = readmeContent.match(trademarkRegex);

    expect(match).toBeNull();
  });

  it('package.json exists and contains zero occurrences of trademark terms', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkgContent = fs.readFileSync(pkgPath, 'utf-8');

    // Case-insensitive regex for trademarked terms: "pokemon", "pokémon", "johto"
    const trademarkRegex = /pok[eé]mon|johto/i;
    const match = pkgContent.match(trademarkRegex);

    expect(match).toBeNull();

    // Verify package description is clean
    const pkgJson = JSON.parse(pkgContent);
    expect(pkgJson.description).toBeDefined();
    expect(trademarkRegex.test(pkgJson.description)).toBe(false);
  });

  it('LICENSE file exists at repository root with fan-made educational tribute terms', () => {
    const licensePath = path.join(rootDir, 'LICENSE');
    expect(fs.existsSync(licensePath)).toBe(true);

    const licenseContent = fs.readFileSync(licensePath, 'utf-8');

    // Must be strictly non-commercial and fan-made tribute
    expect(licenseContent).toMatch(/NON-COMMERCIAL/i);
    expect(licenseContent).toMatch(/FAN-MADE/i);
    expect(licenseContent).toMatch(/EDUCATIONAL TRIBUTE/i);

    // Must incorporate CC BY-NC 4.0 principles
    expect(licenseContent).toMatch(/CC BY-NC 4\.0/);

    // Must explicitly disclaim third-party intellectual property
    expect(licenseContent).toMatch(/Nintendo Co\., Ltd\./);
    expect(licenseContent).toMatch(/GAME FREAK/);
    expect(licenseContent).toMatch(/Creatures Inc\./);

    // Must not use trademark terms in license terms
    const trademarkRegex = /pok[eé]mon|johto/i;
    expect(licenseContent.match(trademarkRegex)).toBeNull();
  });

  it('CREDITS.md preserves attribution while maintaining non-commercial fan tribute disclaimers', () => {
    const creditsPath = path.join(rootDir, 'CREDITS.md');
    expect(fs.existsSync(creditsPath)).toBe(true);

    const creditsContent = fs.readFileSync(creditsPath, 'utf-8');

    // Core attributions preserved
    expect(creditsContent).toMatch(/pret\/pokecrystal/);
    expect(creditsContent).toMatch(/@pkmn\/dex/);
    expect(creditsContent).toMatch(/CrystalDust/);
    expect(creditsContent).toMatch(/PokeAPI/);
    expect(creditsContent).toMatch(/GAME FREAK inc\./);

    // Non-commercial fan tribute statement and license reference
    expect(creditsContent).toMatch(/non-commercial/i);
    expect(creditsContent).toMatch(/fan tribute/i);
    expect(creditsContent).toMatch(/LICENSE/);
  });

  it('index.html contains zero occurrences of trademark terms in title and meta', () => {
    const indexPath = path.join(rootDir, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    // Case-insensitive regex for trademarked terms: "pokemon", "pokémon", "johto"
    const trademarkRegex = /pok[eé]mon|johto/i;
    const match = indexContent.match(trademarkRegex);

    expect(match).toBeNull();
  });
});
