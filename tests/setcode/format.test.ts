import { describe, expect, test } from 'vitest';
import { bytesToCode, codeToBytes } from '../../src/setcode/base62';
import { decodeSetCode } from '../../src/setcode/decode';
import { encodeSet } from '../../src/setcode/encode';
import { SetCodeError, type SetCodeProblem } from '../../src/setcode/error';
import { catalogue, codeOf, gemById, itemById } from './catalogue';

const layout = catalogue.setCode;
const emptySet = (classId: number) => codeOf(encodeSet(layout, classId, []));

/** Reads `width` bits starting at `from`, low bit first. */
function bits(bytes: number[], from: number, width: number): number {
  let value = 0;
  for (let i = 0; i < width; i++) {
    const pos = from + i;
    value += (((bytes[pos >> 3] ?? 0) >> (pos & 7)) & 1) * 2 ** i;
  }
  return value;
}

function problemOf(run: () => unknown): SetCodeProblem | undefined {
  try {
    run();
  } catch (error) {
    if (error instanceof SetCodeError) return error.problem;
    throw error;
  }
  return undefined;
}

describe('Set code format', () => {
  test('the header is 30 bits: Class × 4 above the 24-bit constant', () => {
    const bytes = codeToBytes(emptySet(13));
    expect(bits(bytes, 0, 30)).toBe(13 * 4 * 2 ** 24 + layout.headerBase);
  });

  test('the Class is read back from the header', () => {
    for (const { id } of catalogue.classes) {
      expect(decodeSetCode(catalogue, emptySet(id)).classId).toBe(id);
    }
  });

  test('a leading 0x01 byte comes before the bit stream', () => {
    expect(bytesToCode([])).toBe('1');
    expect(codeToBytes(bytesToCode([0, 0, 7]))).toEqual([0, 0, 7]);
  });

  test('Slots are written in code order 0–6, 10, 11', () => {
    expect(layout.order).toEqual([0, 1, 2, 3, 4, 5, 6, 10, 11]);
    const decoded = decodeSetCode(catalogue, emptySet(10));
    expect(decoded.entries.map((e) => e.slot)).toEqual([
      'helmet', 'chest', 'bracers', 'pants', 'boots', 'amulet', 'ring', 'weapon', 'weapon2',
    ]); // prettier-ignore
  });

  test('an empty Slot writes only its 10-bit zero index, no Gem fields', () => {
    const bytes = codeToBytes(emptySet(10));
    expect(bytes.length).toBe(Math.ceil((30 + 9 * 10) / 8));
    expect(bits(bytes, 30, 90)).toBe(0);
  });

  test('a Slot writes its Item index, then one Gem index per Socket', () => {
    const ring = itemById(1730401);
    const gems = ring.modSlots.map((m) => (m.kind === 'socket' ? gemById(223108) : null));
    const sockets = gems.filter(Boolean).length;
    const bytes = codeToBytes(codeOf(encodeSet(layout, 10, [{ slot: 'ring', item: ring, gems }])));
    const ringAt = 30 + 6 * 10;
    expect(bits(bytes, ringAt, 10)).toBe(ring.codeIndex);
    for (let s = 0; s < sockets; s++) {
      expect(bits(bytes, ringAt + 10 * (s + 1), 10)).toBe(gemById(223108).codeIndex);
    }
  });

  test('the Second weapon uses the weapon list’s indexes', () => {
    const weapon = itemById(3030202);
    const code = codeOf(encodeSet(layout, 10, [{ slot: 'weapon2', item: weapon, gems: [null] }]));
    const weapon2 = decodeSetCode(catalogue, code).entries.at(-1);
    expect(weapon2).toMatchObject({ slot: 'weapon2', item: { id: 3030202 } });
  });

  test('encoding reports Items and Gems without a code index instead of writing a code', () => {
    const helmet = itemById(1130108);
    const noIndex = { ...helmet, codeIndex: 0 };
    const socketAt = helmet.modSlots.findIndex((m) => m.kind === 'socket');
    expect(socketAt).toBeGreaterThanOrEqual(0);
    const gems = helmet.modSlots.map((_, i) => (i === socketAt ? { codeIndex: 0 } : null));
    expect(encodeSet(layout, 10, [{ slot: 'helmet', item: noIndex, gems }])).toEqual({
      missing: [
        { slot: 'helmet', what: 'item' },
        { slot: 'helmet', what: 'gem' },
      ],
    });
  });

  test('an unknown Gem index decodes as unknown and re-encodes unchanged', () => {
    const ring = itemById(1730401);
    const gems = ring.modSlots.map((m) => (m.kind === 'socket' ? { codeIndex: 999 } : null));
    const code = codeOf(encodeSet(layout, 10, [{ slot: 'ring', item: ring, gems }]));
    const decoded = decodeSetCode(catalogue, code);
    const ringGems = decoded.entries.find((e) => e.slot === 'ring')?.gems.filter(Boolean);
    expect(ringGems?.[0]).toEqual({ unknown: true, codeIndex: 999 });
    expect(codeOf(encodeSet(layout, 10, decoded.entries))).toBe(code);
  });
});

describe('Set code errors', () => {
  test('a character outside base62 is rejected', () => {
    expect(problemOf(() => decodeSetCode(catalogue, 'abc-def'))).toBe('notBase62');
  });

  test('a code without the leading 0x01 byte is rejected', () => {
    expect(problemOf(() => decodeSetCode(catalogue, 'zzzzzzzzzz'))).toBe('badMarker');
  });

  test('a code that ends early is rejected', () => {
    expect(problemOf(() => decodeSetCode(catalogue, bytesToCode([1, 2])))).toBe('tooShort');
  });

  test('a header without the constant is rejected', () => {
    const bytes = codeToBytes(emptySet(10));
    bytes[0] = (bytes[0] ?? 0) ^ 1;
    expect(problemOf(() => decodeSetCode(catalogue, bytesToCode(bytes)))).toBe('badHeader');
  });

  test('a header naming a Class that doesn’t exist is rejected', () => {
    expect(problemOf(() => decodeSetCode(catalogue, emptySet(9)))).toBe('unknownClass');
  });

  test('an Item index not in the Class’s list is rejected', () => {
    const fake = { codeIndex: 1023, modSlots: [] };
    const code = codeOf(encodeSet(layout, 10, [{ slot: 'helmet', item: fake, gems: [] }]));
    expect(problemOf(() => decodeSetCode(catalogue, code))).toBe('unknownItem');
  });

  test('a code slot with no Slot in the layout is rejected', () => {
    const unmodelled = { ...catalogue, setCode: { ...layout, order: [...layout.order, 12] } };
    const code = codeOf(encodeSet(unmodelled.setCode, 10, []));
    expect(problemOf(() => decodeSetCode(unmodelled, code))).toBe('unmodelledSlot');
  });
});
