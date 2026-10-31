import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { isEcruteakGymSafeTile, ECRUTEAK_GYM_RESPAWN, ECRUTEAK_GYM_SAFE_SET } from '../src/world/ecruteakGymMaze';
import { createNpcsByMap } from '../src/world/npcData';
import { RoamingManager } from '../src/world/RoamingManager';

describe('Phase 9: Ecruteak City, Burned Tower & Gym Leader Morty Suite', () => {
  describe('1. Ecruteak Gym Invisible Floor Pitfall Maze', () => {
    it('accurately identifies safe landing and platform tiles', () => {
      // Entrance landing zone
      expect(isEcruteakGymSafeTile(4, 16)).toBe(true);
      expect(isEcruteakGymSafeTile(5, 16)).toBe(true);
      expect(isEcruteakGymSafeTile(4, 15)).toBe(true);
      expect(isEcruteakGymSafeTile(5, 15)).toBe(true);

      // Leader Morty platform (y < 4 is always solid)
      expect(isEcruteakGymSafeTile(4, 3)).toBe(true);
      expect(isEcruteakGymSafeTile(5, 3)).toBe(true);

      // Outside pit area (y > 15 is always solid)
      expect(isEcruteakGymSafeTile(4, 17)).toBe(true);
    });

    it('accurately verifies path tiles connecting trainers to Morty', () => {
      // Near Medium Grace (3, 12)
      expect(isEcruteakGymSafeTile(3, 12)).toBe(true);
      expect(isEcruteakGymSafeTile(4, 13)).toBe(true);

      // Near Sage Ping (7, 9)
      expect(isEcruteakGymSafeTile(7, 9)).toBe(true);
      expect(isEcruteakGymSafeTile(6, 12)).toBe(true);

      // Near Medium Martha (2, 7)
      expect(isEcruteakGymSafeTile(2, 7)).toBe(true);
      expect(isEcruteakGymSafeTile(3, 9)).toBe(true);

      // Near Sage Jeffrey (6, 5)
      expect(isEcruteakGymSafeTile(6, 5)).toBe(true);
      expect(isEcruteakGymSafeTile(5, 7)).toBe(true);

      // Morty altar approach
      expect(isEcruteakGymSafeTile(4, 4)).toBe(true);
    });

    it('correctly flags dangerous void tiles that trigger pitfall drops', () => {
      // Off-path void tiles across the gym hall
      expect(isEcruteakGymSafeTile(1, 14)).toBe(false);
      expect(isEcruteakGymSafeTile(6, 14)).toBe(false);
      expect(isEcruteakGymSafeTile(1, 10)).toBe(false);
      expect(isEcruteakGymSafeTile(8, 10)).toBe(false);
      expect(isEcruteakGymSafeTile(2, 5)).toBe(false);
      expect(isEcruteakGymSafeTile(7, 4)).toBe(false);
    });

    it('defines correct respawn coordinates for falling off the path', () => {
      expect(ECRUTEAK_GYM_RESPAWN.x).toBe(4);
      expect(ECRUTEAK_GYM_RESPAWN.y).toBe(16);
      expect(ECRUTEAK_GYM_RESPAWN.direction).toBe('UP');
    });
  });

  describe('2. Ecruteak & Burned Tower NPC Registry', () => {
    const npcs = createNpcsByMap();

    it('contains all 4 gym trainers, guide, and Leader Morty in ecruteak_gym', () => {
      const gymNpcs = npcs.ecruteak_gym;
      expect(gymNpcs).toBeDefined();

      const morty = gymNpcs.find((n) => n.id === 'morty');
      expect(morty).toBeDefined();
      expect(morty?.action).toBe('MORTY_EVENT');
      expect(morty?.trainerTeam?.length).toBe(4);
      expect(morty?.trainerTeam?.some((p) => p.speciesId === 'gengar')).toBe(true);

      const martha = gymNpcs.find((n) => n.id === 'medium_martha');
      expect(martha).toBeDefined();
      expect(martha?.action).toBe('TRAINER_BATTLE');

      const ping = gymNpcs.find((n) => n.id === 'sage_ping');
      expect(ping).toBeDefined();
      expect(ping?.action).toBe('TRAINER_BATTLE');

      const grace = gymNpcs.find((n) => n.id === 'medium_grace');
      expect(grace).toBeDefined();
      expect(grace?.action).toBe('TRAINER_BATTLE');

      const jeffrey = gymNpcs.find((n) => n.id === 'sage_jeffrey');
      expect(jeffrey).toBeDefined();
      expect(jeffrey?.action).toBe('TRAINER_BATTLE');

      const guide = gymNpcs.find((n) => n.id === 'ecruteak_gym_guide');
      expect(guide).toBeDefined();
    });

    it('contains Rival Silver, Eusine, and Morty in burned_tower_1f', () => {
      const bt1fNpcs = npcs.burned_tower_1f;
      expect(bt1fNpcs).toBeDefined();

      const silver = bt1fNpcs.find((n) => n.id === 'silver_burned');
      expect(silver).toBeDefined();
      expect(silver?.action).toBe('RIVAL_BURNED_TOWER_BATTLE');

      const eusine = bt1fNpcs.find((n) => n.id === 'eusine');
      expect(eusine).toBeDefined();

      const mortyBurned = bt1fNpcs.find((n) => n.id === 'morty_burned');
      expect(mortyBurned).toBeDefined();
    });

    it('contains Legendary Beasts pedestal entity in burned_tower_b1f', () => {
      const btb1fNpcs = npcs.burned_tower_b1f;
      expect(btb1fNpcs).toBeDefined();

      const beasts = btb1fNpcs.find((n) => n.id === 'beasts');
      expect(beasts).toBeDefined();
      expect(beasts?.action).toBe('BEASTS_AWAKENING');
    });
  });

  describe('3. Legendary Beasts Roaming Mechanics', () => {
    it('properly transitions beasts from dormant to awakened roaming status', () => {
      const roaming = new RoamingManager();
      expect(roaming.areBeastsAwakened()).toBe(false);

      roaming.awakenBeasts();
      expect(roaming.areBeastsAwakened()).toBe(true);

      const raikou = roaming.getRoamer('raikou');
      const entei = roaming.getRoamer('entei');
      const suicune = roaming.getRoamer('suicune');

      expect(raikou?.isAwakened).toBe(true);
      expect(entei?.isAwakened).toBe(true);
      expect(raikou?.pokemon.level).toBe(40);
      expect(entei?.pokemon.level).toBe(40);
      expect(suicune).toBeUndefined();

      expect(raikou?.currentMapId).not.toBe('burned_tower');
      expect(entei?.currentMapId).not.toBe('burned_tower');
    });
  });

  describe('4. Route 37 Completion & Psychic Greg Trainer Verification', () => {
    const npcs = createNpcsByMap();

    it('populates Route 37 with all 4 canonical trainers including Psychic Greg', () => {
      const r37Npcs = npcs.route_37;
      expect(r37Npcs).toBeDefined();

      const greg = r37Npcs.find((n) => n.id === 'psychic_greg');
      expect(greg).toBeDefined();
      expect(greg?.trainerName).toBe('Psychic Greg');
      expect(greg?.spriteType).toBe('youngster');
      expect(greg?.x).toBe(6);
      expect(greg?.y).toBe(12);
      expect(greg?.action).toBe('TRAINER_BATTLE');
      expect(greg?.trainerTeam).toHaveLength(1);
      expect(greg?.trainerTeam?.[0].speciesId).toBe('drowzee');
      expect(greg?.trainerTeam?.[0].level).toBe(17);

      // Verify canonical twins and day sibling on Route 37 exist
      expect(r37Npcs.some((n) => n.id === 'twins_ann_anne')).toBe(true);
      expect(r37Npcs.some((n) => n.id === 'sunny_of_sunday')).toBe(true);
    });

    it('asserts Psychic Greg stands on a strictly walkable tile on Route 37', () => {
      const r37Data = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../public/assets/data/maps/route_37.json'), 'utf8')
      );
      const gregIndex = 12 * r37Data.width + 6;
      expect(r37Data.collisionGrid[gregIndex]).toBe(0);
    });
  });

  describe('5. Dance Theater Surf Gentleman & Kimono Girls Verification', () => {
    const npcs = createNpcsByMap();

    it('populates Dance Theater with all 5 Kimono Girls and the Surf Gentleman', () => {
      const theaterNpcs = npcs.dance_theater;
      expect(theaterNpcs).toBeDefined();

      const kimonoIds = [
        'kimono_naoko',
        'kimono_sayo',
        'kimono_zuki',
        'kimono_kuni',
        'kimono_miki',
      ];
      for (const id of kimonoIds) {
        const girl = theaterNpcs.find((n) => n.id === id);
        expect(girl).toBeDefined();
        expect(girl?.action).toBe('TRAINER_BATTLE');
      }

      const surfGentleman = theaterNpcs.find((n) => n.id === 'surf_gentleman');
      expect(surfGentleman).toBeDefined();
      expect(surfGentleman?.x).toBe(9);
      expect(surfGentleman?.y).toBe(10);
    });

    it('asserts Surf Gentleman stands on a strictly walkable tile', () => {
      const theaterData = JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, '../public/assets/data/maps/dance_theater.json'),
          'utf8'
        )
      );
      const index = 10 * theaterData.width + 9;
      expect(theaterData.collisionGrid[index]).toBe(0);
    });
  });

  describe('6. Burned Tower B1F Ground Items & Walkability', () => {
    it('contains TM Endure and Ultra Ball on strictly walkable tiles', () => {
      const itemsData = JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, '../public/assets/data/overworld_items.json'),
          'utf8'
        )
      );
      const btMap = itemsData.byMap?.burned_tower_b1f;
      expect(btMap).toBeDefined();

      const endureBall = btMap.itemBalls.find((b: any) => b.id === 'burned_tower_b1f_16_4_tm_endure');
      expect(endureBall).toBeDefined();
      expect(endureBall.itemId).toBe('tm_endure');
      expect(endureBall.x).toBe(16);
      expect(endureBall.y).toBe(4);

      const ultraBall = btMap.itemBalls.find((b: any) => b.id === 'burned_tower_b1f_15_12_ultra_ball');
      expect(ultraBall).toBeDefined();
      expect(ultraBall.itemId).toBe('ultra_ball');
      expect(ultraBall.x).toBe(15);
      expect(ultraBall.y).toBe(12);

      const btb1fData = JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, '../public/assets/data/maps/burned_tower_b1f.json'),
          'utf8'
        )
      );
      // Verify walkability of both item ball tiles
      expect(btb1fData.collisionGrid[4 * btb1fData.width + 16]).toBe(0);
      expect(btb1fData.collisionGrid[12 * btb1fData.width + 15]).toBe(0);
    });
  });

  describe('7. Ecruteak Itemfinder House Dialogue Verification', () => {
    const npcs = createNpcsByMap();

    it('contains item_man referencing the upgraded Dowsing Machine radar', () => {
      const houseNpcs = npcs.ecruteak_itemfinder_house;
      expect(houseNpcs).toBeDefined();

      const itemMan = houseNpcs.find((n) => n.id === 'item_man');
      expect(itemMan).toBeDefined();
      expect(itemMan?.pages).toBeDefined();
      const dialogueText = itemMan!.pages!.join(' ');
      expect(dialogueText).toContain('Dowsing Machine');
      expect(dialogueText).toContain('radar');
    });
  });
});
