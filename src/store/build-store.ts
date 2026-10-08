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
import type { DecodedSet } from '../setcode/types';
import { budget } from '../solver/budget';
import { solve, type SolveOutcome } from '../solver/solve';
import { locksForClass } from './class-locks';
import { defaultInputs, type Inputs } from './inputs';

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
  /** A solve is running; Calculate is ignored until it ends. */
  busy: boolean;

  setLanguage: (language: Language) => void;
  setClass: (classId: ClassId) => void;
  /** Adds a Target at level 1 after the others; no-op if the Attribute is already targeted. */
  addTarget: (attribute: AttributeId) => void;
  /** Level 0 or less removes the Target; the level is capped at the Budget. */
  setTargetLevel: (attribute: AttributeId, level: number) => void;
  removeTarget: (attribute: AttributeId) => void;
  setTopUp: (topUp: TopUp) => void;
  setLock: <K extends SingleLock>(lock: K, value: Locks[K]) => void;
  /** null clears the override, so the Slot follows the Set quality Lock. */
  setSlotQuality: (slot: Slot, quality: QualityId | null) => void;
  /** Solves the current inputs in the Worker and shows the outcome. */
  calculate: () => Promise<void>;
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
        const { targets, classId, locks } = get().inputs;
        if (level <= 0) return get().removeTarget(attribute);
        // As the old page: never above the Budget; Top-up is not counted here.
        const capped = Math.min(level, budget(catalogue, classId, locks));
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
        const asked = get().inputs;
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
        set({ result, resultInputs: asked, busy: false });
      },
    };
  });
}
