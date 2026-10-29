/**
 * Ecruteak Gym Invisible Floor Maze (Pokemon Crystal)
 *
 * In the authentic Gen 2 Ecruteak Gym, the floor between y: 4 and y: 14
 * is an invisible bridge suspended over a shadowy void. Stepping onto
 * any tile that is not part of the winding safe path drops the trainer
 * back to the entrance landing at (4, 16).
 */

export interface EcruteakGymMazeDefinition {
  entranceLanding: { x: number; y: number }[];
  safePath: Set<string>;
  respawnTile: { x: number; y: number; direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' };
}

// Generate coordinate key 'x,y'
export function toCoordKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Authentic safe path connecting:
 * - Entrance landing: (4, 16), (5, 16), (4, 15), (5, 15)
 * - Lower segment towards Medium Grace at (3, 12) & Sage Ping at (7, 9)
 * - Mid segment towards Medium Martha at (2, 7)
 * - Upper segment towards Sage Jeffrey at (6, 5) & Leader Morty at (4, 3) / (5, 3)
 */
const ECRUTEAK_GYM_SAFE_COORDS: [number, number][] = [
  // Landing zone (y: 15-16)
  [4, 16], [5, 16],
  [4, 15], [5, 15],

  // Path from landing up and left to Medium Grace (3, 12)
  [4, 14],
  [4, 13], [3, 13],
  [3, 12], [2, 12], // Medium Grace encounter area

  // Branch across to Sage Ping (7, 9)
  [4, 12], [5, 12], [6, 12], [7, 12],
  [7, 11],
  [7, 10],
  [7, 9], [6, 9],   // Sage Ping encounter area

  // Branch towards Medium Martha (2, 7)
  [5, 9], [4, 9], [3, 9], [2, 9],
  [2, 8],
  [2, 7], [3, 7],   // Medium Martha encounter area

  // Branch towards Sage Jeffrey (6, 5) and Morty's platform
  [4, 7], [5, 7], [6, 7],
  [6, 6],
  [7, 5], [6, 5], [5, 5],   // Sage Jeffrey area
  [4, 5],

  // Approach to Leader Morty's altar (y: 3-4)
  [4, 4], [5, 4],
  [4, 3], [5, 3],   // Leader Morty platform
];

export const ECRUTEAK_GYM_SAFE_SET = new Set<string>(
  ECRUTEAK_GYM_SAFE_COORDS.map(([x, y]) => toCoordKey(x, y))
);

/**
 * Determines whether a given tile in Ecruteak Gym is safe to stand on.
 * Returns true if inside the entrance landing, trainer platforms, Morty platform,
 * or on the authentic invisible walkway.
 */
export function isEcruteakGymSafeTile(x: number, y: number): boolean {
  // Outside the pitfall zone (above platform y: 3 or below pitfall y: 15) is always solid
  if (y < 4 || y > 15) {
    return true;
  }

  // Walls or non-floor borders are handled by map collision
  if (x < 1 || x > 8) {
    return false;
  }

  return ECRUTEAK_GYM_SAFE_SET.has(toCoordKey(x, y));
}

/**
 * Default respawn tile when a player falls through the invisible floor
 */
export const ECRUTEAK_GYM_RESPAWN = {
  x: 4,
  y: 16,
  direction: 'UP' as const,
};
