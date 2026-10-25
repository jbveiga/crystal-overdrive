import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { OverworldItemManager } from '../src/world/OverworldItemManager';
import { SaveManager, type SaveData } from '../src/core/SaveManager';
import { INFINITE_TMS } from '../src/ui/BagAndMartUI';
import { PokemonFactory } from '../src/battle/PokemonFactory';

describe('TICKET-NARRATIVE-ELMS-TABLE-POKEBALLS-01', () => {
  describe('Elm\'s Lab table Poké Balls (3 -> 2 -> 1)', () => {
    it.each([
      ['cyndaquil', ['totodile_ball', 'chikorita_ball'], ['chikorita_ball']],
      ['totodile', ['cyndaquil_ball', 'chikorita_ball'], ['cyndaquil_ball']],
      ['chikorita', ['cyndaquil_ball', 'totodile_ball'], ['totodile_ball']],
    ])('renders 3, then 2, then 1 ball when the player picks %s', (starter, afterChoice, afterTheft) => {
      const flags = new Set<string>();
      expect(OverworldItemManager.getStarterBallsForLab(flags)).toHaveLength(3);

      flags.add('starter_chosen');
      flags.add(`starter_${starter}`);
      expect(OverworldItemManager.getStarterBallsForLab(flags, starter).map((b) => b.id)).toEqual(afterChoice);

      flags.add('ELM_CALLED_ABOUT_THEFT');
      expect(OverworldItemManager.getStarterBallsForLab(flags, starter).map((b) => b.id)).toEqual(afterTheft);
    });
  });

  describe('Table inspection dialogue wiring (main.ts)', () => {
    const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');

    it('uses context-aware dialogues instead of the generic empty-ball text', () => {
      expect(mainSrc).not.toContain("It's an empty POKé BALL.");
      expect(mainSrc).toContain("It's an empty spot. You already chose ${tableName}!");
      expect(mainSrc).toContain('The POKé BALL was stolen from the table!');
      expect(mainSrc).toContain("PROF. ELM: You already chose your partner!");
    });
  });

  describe('HM05 Flash deduplication', () => {
    it('awards only HM05 on Elder Li victory and has no TM70 Bag entry', () => {
      const mainSrc = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
      expect(mainSrc).toContain("inventory.tms.push('HM05')");
      expect(mainSrc).not.toContain("'TM70'");
      expect(INFINITE_TMS.HM05.moveId).toBe('flash');
      expect(INFINITE_TMS.TM70).toBeUndefined();
    });

    const makeSave = (tms: string[], flags: string[]): SaveData =>
      ({
        version: 1,
        timestamp: Date.now(),
        player: {
          name: 'GOLD',
          gender: 'BOY',
          mapId: 'new_bark_town',
          x: 4,
          y: 4,
          direction: 'DOWN',
          speedMultiplier: 1,
          badges: [],
          money: 0,
        },
        party: [PokemonFactory.create('cyndaquil', 5)],
        box: [],
        inventory: { balls: {}, tms },
        roamers: [],
        defeatedTrainers: [],
        storyFlags: flags,
      }) as unknown as SaveData;

    it('prunes TM70 from loaded saves while keeping HM05', async () => {
      const sm = new SaveManager();
      await sm.saveGame(makeSave(['TM54', 'HM05', 'TM70'], ['sprout_tower_cleared']));
      const loaded = await sm.loadGame();
      expect(loaded?.inventory.tms).toEqual(['TM54', 'HM05']);
    });

    it('converts a lone legacy TM70 into HM05 when Sprout Tower was cleared', async () => {
      const sm = new SaveManager();
      await sm.saveGame(makeSave(['TM70'], ['sprout_tower_cleared']));
      const loaded = await sm.loadGame();
      expect(loaded?.inventory.tms).toEqual(['HM05']);
    });
  });
});
