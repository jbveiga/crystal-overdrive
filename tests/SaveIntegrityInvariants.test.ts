import { describe, it, expect } from 'vitest';
import { PokemonFactory } from '../src/battle/PokemonFactory';
import { StorageManager } from '../src/world/StorageManager';

describe('Save integrity invariants (uid collisions must never delete Pokémon)', () => {
  it('PokemonFactory.create yields unique uids even when created in a tight loop', () => {
    const uids = new Set<string>();
    for (let i = 0; i < 5000; i++) uids.add(PokemonFactory.create('sentret', 3).uid);
    expect(uids.size).toBe(5000);
  });

  it('legacy saves: two DIFFERENT Pokémon sharing a uid are both kept and re-keyed', () => {
    const storage = StorageManager.createDefaultStorage();
    const a = PokemonFactory.create('sentret', 3);
    const b = PokemonFactory.create('hoothoot', 5);
    b.uid = a.uid; // legacy same-millisecond collision
    storage.boxes[0].pokemon[0] = JSON.parse(JSON.stringify(a));
    storage.boxes[0].pokemon[1] = JSON.parse(JSON.stringify(b));
    StorageManager.reconcilePartyAndStorageIntegrity([], storage);
    expect(storage.boxes[0].pokemon[0]).not.toBeNull();
    expect(storage.boxes[0].pokemon[1]).not.toBeNull();
    expect(storage.boxes[0].pokemon[0]!.uid).not.toBe(storage.boxes[0].pokemon[1]!.uid);
  });

  it('a true duplicate (identical copy in party and box) is still purged', () => {
    const storage = StorageManager.createDefaultStorage();
    const a = PokemonFactory.create('sentret', 3);
    storage.boxes[0].pokemon[0] = JSON.parse(JSON.stringify(a));
    const party = [a];
    StorageManager.reconcilePartyAndStorageIntegrity(party, storage);
    expect(storage.boxes[0].pokemon[0]).toBeNull();
    expect(party).toHaveLength(1);
  });
});
