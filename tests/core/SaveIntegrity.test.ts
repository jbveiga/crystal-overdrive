import { describe, it, expect, beforeEach } from 'vitest';
import {
  canonicalize,
  computeHmacSignature,
  verifyHmacSignature,
  signSaveData,
  verifySaveEnvelope,
  SIGNED_SAVE_FORMAT,
} from '../../src/core/SaveIntegrity';
import { SaveManager, type SaveData } from '../../src/core/SaveManager';

describe('SaveIntegrity anti-tampering mechanism', () => {
  beforeEach(() => {
    // Clear storage keys if needed
  });

  it('serializes objects canonically regardless of key insertion order', () => {
    const objA = { z: 1, a: 2, m: { nestedB: true, nestedA: 'hello' } };
    const objB = { a: 2, m: { nestedA: 'hello', nestedB: true }, z: 1 };
    expect(canonicalize(objA)).toBe(canonicalize(objB));
  });

  it('computes identical HMAC signatures for equivalent objects with different key order', async () => {
    const data1 = { player: { name: 'GOLD', money: 3000 }, party: [] };
    const data2 = { party: [], player: { money: 3000, name: 'GOLD' } };
    const sig1 = await computeHmacSignature(data1);
    const sig2 = await computeHmacSignature(data2);
    expect(sig1).toBe(sig2);
    expect(sig1.length).toBe(64); // 256-bit hex
  });

  it('signs save data and produces a valid SignedSaveEnvelope', async () => {
    const fresh = SaveManager.createFreshSaveData('GOLD', 'BOY');
    const envelope = await signSaveData(fresh);

    expect(envelope.format).toBe(SIGNED_SAVE_FORMAT);
    expect(envelope.version).toBe(1);
    expect(typeof envelope.timestamp).toBe('number');
    expect(typeof envelope.signature).toBe('string');
    expect(envelope.signature.length).toBe(64);
    expect(envelope.data.player.name).toBe('GOLD');

    const result = await verifySaveEnvelope(JSON.stringify(envelope));
    expect(result.valid).toBe(true);
    expect(result.data?.player.name).toBe('GOLD');
  });

  it('strictly rejects save JSON if any data property is tampered with', async () => {
    const fresh = SaveManager.createFreshSaveData('GOLD', 'BOY');
    fresh.player.money = 3000;
    const envelope = await signSaveData(fresh);

    // Tamper with the money amount inside the envelope
    const serialized = JSON.stringify(envelope);
    const tamperedJson = serialized.replace('"money":3000', '"money":999999');

    const result = await verifySaveEnvelope(tamperedJson);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TAMPERED_OR_INVALID_SIGNATURE');
  });

  it('strictly rejects save JSON if player position or badge is tampered with', async () => {
    const fresh = SaveManager.createFreshSaveData('GOLD', 'BOY');
    fresh.player.badges = ['zephyr'];
    const envelope = await signSaveData(fresh);

    // Alter badge list
    const tampered = JSON.parse(JSON.stringify(envelope));
    tampered.data.player.badges.push('hive');

    const result = await verifySaveEnvelope(JSON.stringify(tampered));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TAMPERED_OR_INVALID_SIGNATURE');
  });

  it('strictly rejects save JSON if signature is invalid or altered', async () => {
    const fresh = SaveManager.createFreshSaveData('GOLD', 'BOY');
    const envelope = await signSaveData(fresh);

    const tampered = JSON.parse(JSON.stringify(envelope));
    tampered.signature = '0'.repeat(64);

    const result = await verifySaveEnvelope(JSON.stringify(tampered));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TAMPERED_OR_INVALID_SIGNATURE');
  });

  it('strictly rejects legacy unsigned save files lacking an HMAC signature', async () => {
    const fresh = SaveManager.createFreshSaveData('GOLD', 'BOY');
    const rawUnsignedJson = JSON.stringify(fresh);

    const result = await verifySaveEnvelope(rawUnsignedJson);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('MISSING_SIGNATURE');
  });

  it('integrates seamlessly with SaveManager exportSaveJson and importSaveJson', async () => {
    const saveManager = new SaveManager();
    const fresh = SaveManager.createFreshSaveData('KRIS', 'GIRL');
    fresh.player.mapId = 'goldenrod_city';
    fresh.player.money = 12500;
    await saveManager.saveGame(fresh);

    // Export produces signed JSON
    const exportedJson = await saveManager.exportSaveJson();
    expect(exportedJson).toContain('CRYSTAL_OVERDRIVE_SIGNED_SAVE');
    expect(exportedJson).toContain('"goldenrod_city"');

    // Wipe active save
    await saveManager.deleteSave();
    expect(await saveManager.hasSave()).toBe(false);

    // Import signed JSON succeeds
    const importedOk = await saveManager.importSaveJson(exportedJson);
    expect(importedOk).toBe(true);

    const restored = await saveManager.loadGame();
    expect(restored?.player.name).toBe('KRIS');
    expect(restored?.player.mapId).toBe('goldenrod_city');
    expect(restored?.player.money).toBe(12500);

    // Altered export fails import
    const tamperedExport = exportedJson.replace('12500', '999999');
    const tamperedImport = await saveManager.importSaveJson(tamperedExport);
    expect(tamperedImport).toBe(false);
  });

  it('detects tampering within base64 portable codes (CRYSTAL_SAVE_V1:)', async () => {
    const saveManager = new SaveManager();
    const fresh = SaveManager.createFreshSaveData('SILVER', 'BOY');
    await saveManager.saveGame(fresh);

    const exportedJson = await saveManager.exportSaveJson();
    const portableCode = 'CRYSTAL_SAVE_V1:' + btoa(unescape(encodeURIComponent(exportedJson)));

    // Valid code imports
    await saveManager.deleteSave();
    expect(await saveManager.importSaveJson(portableCode)).toBe(true);

    // Tampered code fails
    const tamperedJson = exportedJson.replace('"SILVER"', '"HACKED"');
    const tamperedPortableCode = 'CRYSTAL_SAVE_V1:' + btoa(unescape(encodeURIComponent(tamperedJson)));
    expect(await saveManager.importSaveJson(tamperedPortableCode)).toBe(false);
  });
});
