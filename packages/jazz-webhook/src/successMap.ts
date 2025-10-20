import { CojsonInternalTypes, SessionID } from "cojson";
import { co, z } from "jazz-tools";

export const SuccessMap = co.record(
  z.string(), // stringified transaction ID
  z.boolean(),
);

export function markSuccessful(
  successMap: co.loaded<typeof SuccessMap, { $each: true }>,
  txID: CojsonInternalTypes.TransactionID,
) {
  let success = successMap[`${txID.sessionID}:${txID.txIndex}`];
  if (!success) {
    successMap.$jazz.set(`${txID.sessionID}:${txID.txIndex}`, true);
  }
}

export function* getTransactionsToRetry(
  successMap: co.loaded<typeof SuccessMap, { $each: true }>,
  knownState: CojsonInternalTypes.CoValueKnownState,
) {
  // TODO: optimisation: we can likely avoid even constructing a CoMap view
  // and just get/set raw transactions from the CoValueCore of SuccessMap
  for (const [sessionID, knownTxCount] of Object.entries(knownState.sessions)) {
    for (let txIndex = 0; txIndex < knownTxCount; txIndex++) {
      if (!successMap[`${sessionID}:${txIndex}`]) {
        yield {
          sessionID: sessionID as SessionID,
          txIndex: txIndex,
        } satisfies CojsonInternalTypes.TransactionID;
      }
    }
  }
}

export function isTxSuccessful(
  successMap: co.loaded<typeof SuccessMap, { $each: true }>,
  txID: CojsonInternalTypes.TransactionID,
) {
  return successMap[`${txID.sessionID}:${txID.txIndex}`] ?? false;
}
