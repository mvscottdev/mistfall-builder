import type { Catalogue, SetPiece } from '../domain/types';
import type { SolveOutcome, SolveRequest } from './solve-set';

export type { SolveOutcome, SolveRequest } from './solve-set';

/** UI thread → Worker. The catalogue is sent only when it changed since the last request. */
export interface WorkerRequest {
  id: number;
  request: SolveRequest;
  /** Pieces of earlier Sets the answer must differ from (an Alternative). */
  avoid: SetPiece[][];
  catalogue?: Catalogue;
}

/** Worker → UI thread. */
export type WorkerReply = { id: number; outcome: SolveOutcome } | { id: number; error: string };

interface Pending {
  resolve: (outcome: SolveOutcome) => void;
  reject: (error: Error) => void;
}

let worker: Worker | null = null;
let catalogueInWorker: Catalogue | null = null;
let lastId = 0;
const pending = new Map<number, Pending>();

function failAll(message: string) {
  for (const request of pending.values()) request.reject(new Error(message));
  pending.clear();
  worker?.terminate();
  worker = null;
  catalogueInWorker = null;
}

function startWorker(): Worker {
  const started = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  started.onmessage = (event: MessageEvent<WorkerReply>) => {
    const reply = event.data;
    const request = pending.get(reply.id);
    if (!request) return;
    pending.delete(reply.id);
    if ('error' in reply) request.reject(new Error(reply.error));
    else request.resolve(reply.outcome);
  };
  started.onerror = (event) => failAll(event.message || 'the solver stopped unexpectedly');
  return started;
}

/**
 * Finds the cheapest Set in a Web Worker, so the page stays responsive while
 * HiGHS works; with `avoid`, the cheapest Set that differs from those earlier
 * ones. Rejects with the solver's message if HiGHS fails; there is no fallback.
 */
export function solve(
  catalogue: Catalogue,
  request: SolveRequest,
  avoid: SetPiece[][] = [],
): Promise<SolveOutcome> {
  worker ??= startWorker();
  const message: WorkerRequest = { id: ++lastId, request, avoid };
  if (catalogue !== catalogueInWorker) message.catalogue = catalogue;
  catalogueInWorker = catalogue;
  const target = worker;
  return new Promise((resolve, reject) => {
    pending.set(message.id, { resolve, reject });
    target.postMessage(message);
  });
}
