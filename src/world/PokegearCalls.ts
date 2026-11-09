/**
 * @fileoverview PokegearCalls: story-triggered incoming Pokégear phone calls (pure decision logic).
 * @module world/PokegearCalls
 * @role Decides which phone call (if any) rings after a map transition, with one-shot flags
 * @exports PokegearCall, BOX_FULL_FLAG, pickPokegearCall
 * @layer world
 * @sections L1-12: Header | L13-70: Call table | L71-90: Picker
 */

export interface PokegearCall {
  /** Flag recorded when the call has rung (prevents repeats). */
  flag: string;
  speaker: string;
  pages: string[];
}

export const BOX_FULL_FLAG = 'BILL_CALLED_BOX_FULL';
const BOX_CAPACITY = 20;
const ELM = '📻 PROF. ELM (POKéGEAR)';
const RING = '📻 *BEEP! BEEP! Your POKéGEAR is ringing!*';

export interface CallState {
  storyFlags: ReadonlySet<string>;
  /** Number of Pokémon in the active PC box, when known. */
  activeBoxCount?: number;
}

/**
 * Returns the next call that should ring, or null. Conditions are legacy-safe: a call is skipped
 * once the story has already moved past the point it announces.
 */
export function pickPokegearCall(state: CallState): PokegearCall | null {
  const f = state.storyFlags;

  if (f.has('falkner_defeated') && !f.has('togepi_egg_received') && !f.has('ELM_CALLED_EGG_AIDE')) {
    return {
      flag: 'ELM_CALLED_EGG_AIDE',
      speaker: ELM,
      pages: [
        RING,
        'PROF. ELM: Hello, GOLD? I heard you beat FALKNER in VIOLET CITY!',
        "My AIDE is waiting at the POKéMON CENTER in VIOLET CITY. He has something for you. Please go see him!",
      ],
    };
  }

  if (
    f.has('pryce_defeated') &&
    !f.has('fake_director_defeated') &&
    !f.has('radio_tower_liberated') &&
    !f.has('ELM_CALLED_RADIO_TOWER')
  ) {
    return {
      flag: 'ELM_CALLED_RADIO_TOWER',
      speaker: ELM,
      pages: [
        RING,
        'PROF. ELM: GOLD! Terrible news! TEAM ROCKET has seized the RADIO TOWER in GOLDENROD CITY!',
        'They are broadcasting a signal to summon their boss! Please hurry to GOLDENROD CITY!',
      ],
    };
  }

  // Bill rings whenever the active box reaches capacity (and again after it has been freed up and refilled)
  if (f.has('PHONE_BILL') && (state.activeBoxCount ?? 0) >= BOX_CAPACITY && !f.has(BOX_FULL_FLAG)) {
    return {
      flag: BOX_FULL_FLAG,
      speaker: '📻 BILL (POKéGEAR)',
      pages: [
        RING,
        "BILL: Hi, it's BILL! Your POKéMON BOX is full now!",
        "Don't worry, I'll switch your PC to the next BOX. Just keep on catching 'em!",
      ],
    };
  }
  return null;
}
