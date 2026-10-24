import { describe, it, expect } from 'vitest';
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
      expect(suicune?.isAwakened).toBe(true);

      expect(raikou?.currentMapId).not.toBe('burned_tower');
      expect(entei?.currentMapId).not.toBe('burned_tower');
      expect(suicune?.currentMapId).not.toBe('burned_tower');
    });
  });
});
