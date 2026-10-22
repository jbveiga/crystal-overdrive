/**
 * KurtCraftingManager.ts
 * Pure TypeScript domain logic for Kurt's Apricorn Ball Crafting Service (TICKET-FEATURE-KURTS-APRICORN-BALLS-01).
 * Zero DOM or PixiJS dependencies.
 */
import type { PokeballId } from '../types/game';

export interface KurtCraftingOrder {
  apricornId: string;
  ballId: PokeballId;
  quantity: number;
  orderTimestamp: number;
  isReady: boolean;
}

export interface ApricornBallMapping {
  apricornId: string;
  apricornName: string;
  ballId: PokeballId;
  ballName: string;
  color: string;
  description: string;
}

export const APRICORN_BALL_MAPPINGS: Record<string, ApricornBallMapping> = {
  red_apricorn: {
    apricornId: 'red_apricorn',
    apricornName: 'RED APRICORN',
    ballId: 'level-ball',
    ballName: 'LEVEL BALL',
    color: '#EE4238',
    description: 'Higher catch rate against wild Pokémon with lower level than player Pokémon (up to 8x).',
  },
  blu_apricorn: {
    apricornId: 'blu_apricorn',
    apricornName: 'BLU APRICORN',
    ballId: 'lure-ball',
    ballName: 'LURE BALL',
    color: '#2A75D3',
    description: '3.0x catch rate when fishing with an Old, Good, or Super Rod.',
  },
  ylw_apricorn: {
    apricornId: 'ylw_apricorn',
    apricornName: 'YLW APRICORN',
    ballId: 'moon-ball',
    ballName: 'MOON BALL',
    color: '#FFD028',
    description: '4.0x catch rate on Pokémon that evolve using a Moon Stone (Nidoran, Clefairy, Jigglypuff).',
  },
  grn_apricorn: {
    apricornId: 'grn_apricorn',
    apricornName: 'GRN APRICORN',
    ballId: 'friend-ball',
    ballName: 'FRIEND BALL',
    color: '#48C774',
    description: 'Caught Pokémon immediately has base friendship set to 200.',
  },
  wht_apricorn: {
    apricornId: 'wht_apricorn',
    apricornName: 'WHT APRICORN',
    ballId: 'fast-ball',
    ballName: 'FAST BALL',
    color: '#F6F8F3',
    description: '4.0x catch rate on Pokémon with base Speed >= 100 or fleeing roaming beasts.',
  },
  blk_apricorn: {
    apricornId: 'blk_apricorn',
    apricornName: 'BLK APRICORN',
    ballId: 'heavy-ball',
    ballName: 'HEAVY BALL',
    color: '#1A2640',
    description: 'Flat catch rate modifier based on weight (+20 for >200kg, +30 for >300kg, -20 for <100kg).',
  },
  pnk_apricorn: {
    apricornId: 'pnk_apricorn',
    apricornName: 'PNK APRICORN',
    ballId: 'love-ball',
    ballName: 'LOVE BALL',
    color: '#FF70A6',
    description: '8.0x catch rate against wild Pokémon of the same species and opposite gender.',
  },
};

export class KurtCraftingManager {
  public activeOrder?: KurtCraftingOrder;

  constructor(initialOrder?: KurtCraftingOrder) {
    this.activeOrder = initialOrder;
  }

  public getMapping(apricornId: string): ApricornBallMapping | undefined {
    const norm = apricornId.toLowerCase().replace(/-/g, '_');
    return APRICORN_BALL_MAPPINGS[norm];
  }

  public canAcceptOrder(): boolean {
    return !this.activeOrder || this.activeOrder.isReady;
  }

  public placeOrder(apricornId: string, quantity: number, timestamp = Date.now()): KurtCraftingOrder {
    if (!this.canAcceptOrder()) {
      throw new Error('Kurt is already crafting an order in progress.');
    }
    const mapping = this.getMapping(apricornId);
    if (!mapping) {
      throw new Error(`Unknown Apricorn item ID: ${apricornId}`);
    }
    if (quantity <= 0) {
      throw new Error(`Invalid crafting quantity: ${quantity}`);
    }

    this.activeOrder = {
      apricornId: mapping.apricornId,
      ballId: mapping.ballId,
      quantity,
      orderTimestamp: timestamp,
      isReady: false,
    };

    return { ...this.activeOrder };
  }

  public markReady(): void {
    if (this.activeOrder) {
      this.activeOrder.isReady = true;
    }
  }

  public checkReady(currentTimestamp = Date.now(), thresholdMs = 0): boolean {
    if (!this.activeOrder) return false;
    if (this.activeOrder.isReady) return true;

    if (thresholdMs > 0 && currentTimestamp - this.activeOrder.orderTimestamp >= thresholdMs) {
      this.activeOrder.isReady = true;
      return true;
    }
    return false;
  }

  public collectOrder(): { ballId: PokeballId; quantity: number } | null {
    if (!this.activeOrder || !this.activeOrder.isReady) {
      return null;
    }
    const result = {
      ballId: this.activeOrder.ballId,
      quantity: this.activeOrder.quantity,
    };
    this.activeOrder = undefined;
    return result;
  }
}
