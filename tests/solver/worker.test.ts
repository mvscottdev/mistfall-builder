import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Catalogue } from '../../src/domain/types';
import type { SolveRequest, WorkerReply, WorkerRequest } from '../../src/solver/solve';
import { noLocks } from './page-catalogue';

const mocks = vi.hoisted(() => ({ highsLoader: vi.fn(), solveSet: vi.fn() }));
vi.mock('highs', () => ({ default: mocks.highsLoader }));
vi.mock('../../src/solver/solve-set', () => ({ solveSet: mocks.solveSet }));

/** Stands in for the Worker's global scope. */
interface FakeScope {
  onmessage: ((event: { data: WorkerRequest }) => Promise<void>) | null;
  postMessage: ReturnType<typeof vi.fn<(reply: WorkerReply) => void>>;
}

const request: SolveRequest = {
  classId: 10,
  targets: [],
  locks: noLocks,
  topUp: { total: 8, perAttribute: 2 },
};
const catalogue = { items: [] } as unknown as Catalogue;
const highs = { solve: vi.fn() };

async function startWorker(): Promise<(data: WorkerRequest) => Promise<void>> {
  const scope: FakeScope = { onmessage: null, postMessage: vi.fn() };
  vi.stubGlobal('self', scope);
  vi.resetModules();
  await import('../../src/solver/worker');
  return (data) => scope.onmessage?.({ data }) ?? Promise.resolve();
}

const replies = () => (self as unknown as FakeScope).postMessage.mock.calls.map(([r]) => r);

beforeEach(() => {
  mocks.highsLoader.mockReset().mockResolvedValue(highs);
  mocks.solveSet.mockReset().mockReturnValue({ kind: 'infeasible' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the solver Worker', () => {
  test('answers a request with the outcome, solved with the catalogue it was sent', async () => {
    const send = await startWorker();
    await send({ id: 7, request, catalogue });
    expect(mocks.solveSet).toHaveBeenCalledWith(catalogue, highs, request);
    expect(replies()).toEqual([{ id: 7, outcome: { kind: 'infeasible' } }]);
  });

  test('keeps the catalogue for later requests and loads HiGHS once', async () => {
    const send = await startWorker();
    await send({ id: 1, request, catalogue });
    await send({ id: 2, request });
    expect(mocks.solveSet).toHaveBeenLastCalledWith(catalogue, highs, request);
    expect(mocks.highsLoader).toHaveBeenCalledTimes(1);
  });

  test('a request before any catalogue gets an error reply', async () => {
    const send = await startWorker();
    await send({ id: 1, request });
    expect(replies()).toEqual([{ id: 1, error: 'the solver got no catalogue' }]);
    expect(mocks.solveSet).not.toHaveBeenCalled();
  });

  test('a solver error is replied with its message, and HiGHS is reloaded for the next request', async () => {
    const send = await startWorker();
    mocks.solveSet.mockImplementationOnce(() => {
      throw new Error('HiGHS crashed');
    });
    await send({ id: 1, request, catalogue });
    await send({ id: 2, request });
    expect(replies()).toEqual([
      { id: 1, error: 'HiGHS crashed' },
      { id: 2, outcome: { kind: 'infeasible' } },
    ]);
    expect(mocks.highsLoader).toHaveBeenCalledTimes(2);
  });
});
