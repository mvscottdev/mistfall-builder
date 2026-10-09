import { createStore } from 'zustand/vanilla';
import type {
  AttributeId,
  Catalogue,
  ClassId,
  Locks,
  QualityId,
  Slot,
  TopUp,
} from '../domain/types';
import { initialLanguage, saveLanguage, type Language } from '../i18n/language';
import { decodeSetCode } from '../setcode/decode';
import { SetCodeError, type SetCodeProblem } from '../setcode/error';
import type { DecodedSet } from '../setcode/types';
import { budget, targetLevelCap } from '../solver/budget';
import { solve, type SolveOutcome } from '../solver/solve';
import { findAlternatives, type SolvedResult } from './alternatives';
import { locksForClass } from './class-locks';
import { defaultInputs, type Inputs } from './inputs';
import { loadedInputs } from './load-as-target';

/** What the doll shows: a solver outcome, a Set read from a Set code, or a solver failure. */
export type Result =
  SolveOutcome | { kind: 'decoded'; set: DecodedSet } | { kind: 'failed'; message: string };

/** The Locks set by one value; per-Slot quality has its own action. */
type SingleLock = Exclude<keyof Locks, 'slotQuality'>;

export interface BuildState {
  /** The Snapshot. Components read it only through selectors. */
  catalogue: Catalogue;
  language: Language;
  inputs: Inputs;
  result: Result | null;
  /** The inputs `result` was solved for; null when nothing was solved for it. */
  resultInputs: Inputs | null;
  /**
   * Alternatives found so far for `resultInputs`, cheapest Set first; empty
   * unless a solved Set is shown. `result` is one of them.
   */
  alternatives: SolvedResult[];
  /** The solver found no Alternative after the last one in `alternatives`. */
  noMoreAlternatives: boolean;
  /** A solve is running; Calculate and Alternative picks are ignored until it ends. */
  busy: boolean;

  setLanguage: (language: Language) => void;
  setClass: (classId: ClassId) => void;
  /** Adds a Target at level 1 after the others; no-op if the Attribute is already targeted. */
  addTarget: (attribute: AttributeId) => void;
  /** Level 0 or less removes the Target; the level is capped at the Budget plus the wine per bonus. */
  setTargetLevel: (attribute: AttributeId, level: number) => void;
  removeTarget: (attribute: AttributeId) => void;
  setTopUp: (topUp: TopUp) => void;
  setLock: <K extends SingleLock>(lock: K, value: Locks[K]) => void;
  /** null clears the override, so the Slot follows the Set quality Lock. */
  setSlotQuality: (slot: Slot, quality: QualityId | null) => void;
  /** Solves the current inputs in the Worker and shows the outcome. */
  calculate: () => Promise<void>;
  /**
   * Shows the Alternative at `index` (0 = the cheapest Set), solving it and
   * any before it that aren't found yet; past the last one, the shown Set stays.
   */
  showAlternative: (index: number) => Promise<void>;
  /**
   * Reads a Set code and shows its Set as it is, switching to its Class (ADR-0010).
   * Returns why the code can't be read, or null.
   */
  importSetCode: (code: string) => SetCodeProblem | null;
  /** Turns the shown decoded Set into inputs, so Calculate gives it back (ADR-0010). */
  loadAsTarget: () => void;
}

export type BuildStore = ReturnType<typeof createBuildStore>;

export function createBuildStore(catalogue: Catalogue) {
  return createStore<BuildState>()((set, get) => {
    const setInputs = (change: Partial<Inputs>) =>
      set((state) => ({ inputs: { ...state.inputs, ...change } }));
    const setLocks = (change: Partial<Locks>) =>
      setInputs({ locks: { ...get().inputs.locks, ...change } });

    return {
      catalogue,
      language: initialLanguage(),
      inputs: defaultInputs(catalogue),
      result: null,
      resultInputs: null,
      alternatives: [],
      noMoreAlternatives: false,
      busy: false,

      setLanguage: (language) => {
        saveLanguage(language);
        set({ language });
      },

      setClass: (classId) =>
        setInputs({ classId, locks: locksForClass(catalogue, classId, get().inputs.locks) }),

      addTarget: (attribute) => {
        const { targets } = get().inputs;
        if (targets.some((t) => t.attribute === attribute)) return;
        setInputs({ targets: [...targets, { attribute, level: 1 }] });
      },

      setTargetLevel: (attribute, level) => {
        const { targets, classId, locks, topUp } = get().inputs;
        if (level <= 0) return get().removeTarget(attribute);
        const capped = Math.min(level, targetLevelCap(budget(catalogue, classId, locks), topUp));
        setInputs({
          targets: targets.map((t) =>
            t.attribute === attribute ? { attribute, level: capped } : t,
          ),
        });
      },

      removeTarget: (attribute) =>
        setInputs({ targets: get().inputs.targets.filter((t) => t.attribute !== attribute) }),

      setTopUp: (topUp) => setInputs({ topUp }),

      setLock: (lock, value) => setLocks({ [lock]: value }),

      setSlotQuality: (slot, quality) => {
        const others = Object.fromEntries(
          Object.entries(get().inputs.locks.slotQuality).filter(([key]) => key !== slot),
        );
        setLocks({ slotQuality: quality === null ? others : { ...others, [slot]: quality } });
      },

      calculate: async () => {
        if (get().busy) return;
        const { inputs: asked, result: shown } = get();
        set({ busy: true });
        let result: Result;
        try {
          result = await solve(catalogue, asked);
        } catch (error) {
          result = {
            kind: 'failed',
            message: error instanceof Error ? error.message : String(error),
          };
        }
        // A Set code shown meanwhile stays: this outcome is for inputs it replaced.
        if (get().result !== shown) return set({ busy: false });
        set({
          result,
          resultInputs: asked,
          alternatives: result.kind === 'solved' ? [result] : [],
          noMoreAlternatives: false,
          busy: false,
        });
      },

      showAlternative: async (index) => {
        const { busy, resultInputs: asked, alternatives, noMoreAlternatives } = get();
        if (busy || !asked || !alternatives.length) return;
        if (index >= alternatives.length && noMoreAlternatives) return;
        set({ busy: true });
        let next: Awaited<ReturnType<typeof findAlternatives>>;
        try {
          next = await findAlternatives(catalogue, asked, alternatives, index);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (get().resultInputs === asked) set({ result: { kind: 'failed', message } });
          return set({ busy: false, alternatives: [] });
        }
        // A Set code shown meanwhile stays: these Alternatives are for inputs it replaced.
        if (get().resultInputs !== asked) return set({ busy: false });
        set({
          result: next.found[index] ?? get().result,
          alternatives: next.found,
          noMoreAlternatives: next.noMore,
          busy: false,
        });
      },

      importSetCode: (code) => {
        let decoded: DecodedSet;
        try {
          decoded = decodeSetCode(catalogue, code.trim());
        } catch (error) {
          if (error instanceof SetCodeError) return error.problem;
          throw error;
        }
        get().setClass(decoded.classId);
        set({ result: { kind: 'decoded', set: decoded }, resultInputs: null, alternatives: [] });
        return null;
      },

      loadAsTarget: () => {
        const { result, inputs } = get();
        if (result?.kind !== 'decoded') return;
        set({ inputs: loadedInputs(result.set, inputs) });
      },
    };
  });
}
