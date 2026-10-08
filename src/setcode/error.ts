/** Why a Set code could not be read; the UI turns the reason into a message. */
export type SetCodeProblem =
  | 'notBase62'
  | 'badMarker'
  | 'tooShort'
  | 'badHeader'
  | 'unknownClass'
  | 'unknownItem'
  | 'unmodelledSlot';

export class SetCodeError extends Error {
  override name = 'SetCodeError';

  constructor(
    readonly problem: SetCodeProblem,
    detail: string,
  ) {
    super(`${problem}: ${detail}`);
  }
}
