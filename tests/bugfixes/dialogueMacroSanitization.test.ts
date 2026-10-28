import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { MapData } from '../../src/types/game';
import { createAzaleaToIlexNpcs } from '../../src/world/npcs/azaleaToIlexNpcs';

describe('TICKET-BUGFIX-DIALOGUE-MACRO-SANITIZATION-01: Macro Sanitization & Route 35 Gate Polish', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const srcDir = path.join(rootDir, 'src');
  const mapPath = path.join(rootDir, 'public/assets/data/maps/route_35_national_park_gate.json');

  function getAllTsFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getAllTsFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it('asserts zero occurrences of raw pokecrystal #MON macro across all src/ files', () => {
    const tsFiles = getAllTsFiles(srcDir);
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('#MON')) {
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('#MON')) {
            violations.push({ file: path.relative(rootDir, file), line: idx + 1, text: l.trim() });
          }
        });
      }
    }

    expect(violations).toEqual([]);
  });

  it('asserts zero unparsed assembly macros (<PLAYER>, <RIVAL>, <SCROLL>, etc.) in npcs & interactions', () => {
    const targetDirs = [
      path.join(srcDir, 'world/npcs'),
      path.join(srcDir, 'world/interactions'),
    ];
    const tsFiles = targetDirs.flatMap((d) => getAllTsFiles(d));
    const macroRegex = /<(?:PLAYER|RIVAL|PLAY_G|SCROLL|PARA|LINE|CONT|DONE)>/;
    const violations: { file: string; line: number; match: string }[] = [];

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (macroRegex.test(content)) {
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          const match = l.match(macroRegex);
          if (match) {
            violations.push({ file: path.relative(rootDir, file), line: idx + 1, match: match[0] });
          }
        });
      }
    }

    expect(violations).toEqual([]);
  });

  it('asserts Park Officer dialogue contains "bug POKéMON" in GoldenrodAndRoute34Interactions.ts', () => {
    const filePath = path.join(srcDir, 'world/interactions/GoldenrodAndRoute34Interactions.ts');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('bug POKéMON you catch!');
    expect(content).not.toContain('bug #MON you catch!');
  });

  it('asserts Slowpoke Well mail dialogue renders "The trainer read the MAIL" without <PLAYER> macro', () => {
    const npcs = createAzaleaToIlexNpcs();
    const wellNpcs = npcs.slowpoke_well_b1f;
    expect(wellNpcs).toBeDefined();

    const slowpoke2 = wellNpcs.find((n) => n.id === 'well_slowpoke_2');
    expect(slowpoke2).toBeDefined();
    const mailPage = slowpoke2?.pages?.find((p) => p.includes('read the MAIL'));
    expect(mailPage).toBeDefined();
    expect(mailPage).toContain('The trainer read the MAIL:');
    expect(mailPage).not.toContain('<PLAYER>');
  });

  it('asserts route_35_national_park_gate at (2, 3) and (2, 5) uses clean floor in_gate_01_01_01_01', () => {
    const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const idx1 = 3 * mapData.width + 2;
    const idx2 = 5 * mapData.width + 2;

    expect(mapData.tileMap[idx1]).toBe('in_gate_01_01_01_01');
    expect(mapData.collisionGrid[idx1]).toBe(0);

    expect(mapData.tileMap[idx2]).toBe('in_gate_01_01_01_01');
    expect(mapData.collisionGrid[idx2]).toBe(0);
  });

  it('asserts route_35_national_park_gate central corridor x=3 and x=4 is 100% walkable', () => {
    const mapData: MapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    for (let y = 0; y < mapData.height; y++) {
      expect(mapData.collisionGrid[y * mapData.width + 3]).toBe(0);
      expect(mapData.collisionGrid[y * mapData.width + 4]).toBe(0);
    }
  });
});
