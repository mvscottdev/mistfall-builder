import { describe, expect, test } from 'vitest';
import goldenRaw from '../fixtures/golden.json?raw';
import type { SetSlot } from '../../src/domain/types';
import { decodeSetCode } from '../../src/setcode/decode';
import { encodeSet } from '../../src/setcode/encode';
import { catalogue, codeOf, gemById, itemById } from './catalogue';

interface GoldenScenario {
  label: string;
  input: { classId: number };
  output: {
    path: { slot: SetSlot; itemId: number; gems: (number | null)[] }[];
    code: string;
    missing: null;
  } | null;
  decode: { classId: number; entries: { slot: SetSlot; itemId: number | null }[] } | null;
}

const solved = Object.values(
  (JSON.parse(goldenRaw) as { scenarios: Record<string, GoldenScenario> }).scenarios,
).filter((s) => s.output !== null);

describe('golden Set codes from the old page', () => {
  test('there are golden codes to check', () => {
    expect(solved.length).toBe(36);
  });

  test.each(solved.map((s) => [s.label, s] as const))(
    '%s: the solved path encodes to the golden code',
    (_, scenario) => {
      const path = scenario.output?.path ?? [];
      const entries = path.map((step) => ({
        slot: step.slot,
        item: itemById(step.itemId),
        gems: step.gems.map((id) => (id === null ? null : gemById(id))),
      }));
      const result = encodeSet(catalogue.setCode, scenario.input.classId, entries);
      expect(codeOf(result)).toBe(scenario.output?.code);
    },
  );

  test.each(solved.map((s) => [s.label, s] as const))(
    '%s: the golden code decodes to the golden Class and Items',
    (_, scenario) => {
      const decoded = decodeSetCode(catalogue, scenario.output?.code ?? '');
      expect(decoded.classId).toBe(scenario.decode?.classId);
      expect(decoded.entries.map((e) => ({ slot: e.slot, itemId: e.item?.id ?? null }))).toEqual(
        scenario.decode?.entries.map((e) => ({ slot: e.slot, itemId: e.itemId })),
      );
    },
  );

  test.each(solved.map((s) => [s.label, s] as const))(
    '%s: the decoded golden code has the path’s Gems',
    (_, scenario) => {
      const decoded = decodeSetCode(catalogue, scenario.output?.code ?? '');
      const gemsBySlot = new Map(decoded.entries.map((e) => [e.slot, e.gems]));
      for (const step of scenario.output?.path ?? []) {
        const gems = gemsBySlot.get(step.slot)?.map((g) => (g && 'id' in g ? g.id : null));
        expect(gems).toEqual(step.gems);
      }
    },
  );
});
