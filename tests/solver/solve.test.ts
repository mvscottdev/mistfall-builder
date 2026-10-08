import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Catalogue } from '../../src/domain/types';
import type {
  SolveOutcome,
  SolveRequest,
  WorkerReply,
  WorkerRequest,
} from '../../src/solver/solve';
import { noLocks } from './page-catalogue';

/** Stands in for the browser Worker: records what the page sends, lets the test reply. */
class FakeWorker {
  static started: FakeWorker[] = [];
  sent: WorkerRequest[] = [];
  onmessage: ((event: { data: WorkerReply }) => void) | null = null;
  onerror: ((event: { message: string }) => void) | null = null;
  constructor(
    readonly url: URL,
    readonly options: WorkerOptions,
  ) {
    FakeWorker.started.push(this);
  }
  postMessage(message: WorkerRequest) {
    this.sent.push(message);
  }
  /** Answers the n-th message this Worker got. */
  answer(n: number, reply: { outcome: SolveOutcome } | { error: string }) {
    const message = this.sent[n];
    if (!message) throw new Error(`no message ${n}`);
    this.onmessage?.({ data: { id: message.id, ...reply } });
  }
  terminate() {}
}

const request: SolveRequest = {
  classId: 10,
  targets: [{ attribute: 0, level: 4 }],
  locks: noLocks,
  topUp: { total: 8, perAttribute: 2 },
};
const catalogue = { items: [] } as unknown as Catalogue;

function workerNumber(n: number): FakeWorker {
  const worker = FakeWorker.started[n];
  if (!worker) throw new Error(`Worker ${n} was not started`);
  return worker;
}

async function freshSolve() {
  vi.resetModules();
  return (await import('../../src/solver/solve')).solve;
}

beforeEach(() => {
  FakeWorker.started = [];
  vi.stubGlobal('Worker', FakeWorker);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('solve() on the UI thread', () => {
  test('solving runs in a module Web Worker, not on the UI thread', async () => {
    const solve = await freshSolve();
    const pending = solve(catalogue, request);
    const worker = workerNumber(0);
    expect(worker.url.pathname).toMatch(/solver\/worker\.ts$/);
    expect(worker.options).toEqual({ type: 'module' });
    expect(worker.sent[0]?.request).toEqual(request);
    worker.answer(0, { outcome: { kind: 'infeasible' } });
    await expect(pending).resolves.toEqual({ kind: 'infeasible' });
  });

  test('one Worker serves every request and gets the catalogue only when it changes', async () => {
    const solve = await freshSolve();
    void solve(catalogue, request);
    void solve(catalogue, request);
    const other = { items: [] } as unknown as Catalogue;
    void solve(other, request);
    expect(FakeWorker.started).toHaveLength(1);
    expect(FakeWorker.started[0]?.sent.map((m) => m.catalogue)).toEqual([
      catalogue,
      undefined,
      other,
    ]);
  });

  test('each reply settles the request it answers', async () => {
    const solve = await freshSolve();
    const first = solve(catalogue, request);
    const second = solve(catalogue, request);
    const worker = workerNumber(0);
    worker.answer(1, { outcome: { kind: 'infeasible' } });
    worker.answer(0, { error: 'boom' });
    await expect(second).resolves.toEqual({ kind: 'infeasible' });
    await expect(first).rejects.toThrow('boom');
  });

  test('a solver error is shown as a rejected promise with its message', async () => {
    const solve = await freshSolve();
    const pending = solve(catalogue, request);
    workerNumber(0).answer(0, { error: 'HiGHS: Model error' });
    await expect(pending).rejects.toThrow('HiGHS: Model error');
  });

  test('a crashed Worker fails every pending request, and the next solve starts a new one', async () => {
    const solve = await freshSolve();
    const pending = solve(catalogue, request);
    FakeWorker.started[0]?.onerror?.({ message: 'out of memory' });
    await expect(pending).rejects.toThrow('out of memory');
    void solve(catalogue, request);
    expect(FakeWorker.started).toHaveLength(2);
    expect(FakeWorker.started[1]?.sent[0]?.catalogue).toBe(catalogue);
  });
});
