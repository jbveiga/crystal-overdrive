import type { Direction, SpeedMultiplier, TileCoord, RoamerState } from '../types/game';

export interface GameEvents {
  'player:speedChanged': { playerSpeed: SpeedMultiplier };
  'battle:speedChanged': { battleSpeed: SpeedMultiplier };
  'player:stepStart': { from: TileCoord; to: TileCoord; direction: Direction };
  'player:tileEntered': { coord: TileCoord; tileType: number };
  'player:warp': { targetMapId: string; targetX: number; targetY: number };
  'wild:encounter': { speciesId: string; level: number };
  'roamer:auraAlert': { speciesId: string; mapId: string };
  'roamer:updated': { roamers: RoamerState[] };
}

type EventCallback<T> = (data: T) => void;

export class EventBus {
  private listeners: {
    [K in keyof GameEvents]?: Array<EventCallback<GameEvents[K]>>;
  } = {};

  on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback as EventCallback<GameEvents[keyof GameEvents]>);

    return () => this.off(event, callback);
  }

  off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    const list = this.listeners[event];
    if (!list) return;
    const index = list.indexOf(callback as EventCallback<GameEvents[keyof GameEvents]>);
    if (index !== -1) {
      list.splice(index, 1);
    }
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const list = this.listeners[event];
    if (!list || list.length === 0) return;
    for (let i = 0; i < list.length; i++) {
      list[i](data);
    }
  }

  clear(): void {
    this.listeners = {};
  }
}

export const eventBus = new EventBus();
