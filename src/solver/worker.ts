// Runs the solver off the UI thread. HiGHS solves synchronously, so a long
// solve blocks only this Worker, never the page.
import highsLoader from 'highs';
import wasmUrl from 'highs/runtime?url';
import type { Catalogue } from '../domain/types';
import type { Highs } from './mip';
import type { WorkerReply, WorkerRequest } from './solve';
import { solveSet } from './solve-set';

const scope = self as unknown as DedicatedWorkerGlobalScope;
let highs: Promise<Highs> | null = null;
let catalogue: Catalogue | null = null;

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, request, avoid } = event.data;
  if (event.data.catalogue) catalogue = event.data.catalogue;
  let reply: WorkerReply;
  try {
    if (!catalogue) throw new Error('the solver got no catalogue');
    highs ??= highsLoader({ locateFile: () => wasmUrl });
    reply = { id, outcome: solveSet(catalogue, await highs, request, avoid) };
  } catch (error) {
    // After an error the HiGHS instance may be unusable; load a fresh one next time.
    highs = null;
    reply = { id, error: error instanceof Error ? error.message : String(error) };
  }
  scope.postMessage(reply);
};
