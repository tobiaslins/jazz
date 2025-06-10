import {
  type CojsonInternalTypes,
  type JsonValue,
  type SessionID,
  type Stringified,
  cojsonInternals,
} from "cojson";
import type { RawCoID } from "cojson";
import type {
  StoredCoValueRow,
  StoredSessionRow,
  TransactionRow,
} from "./types.js";

export function collectNewTxs({
  newTxsInSession,
  contentMessage,
  sessionRow,
  firstNewTxIdx,
  signature,
}: {
  newTxsInSession: TransactionRow[];
  contentMessage: CojsonInternalTypes.NewContentMessage;
  sessionRow: StoredSessionRow;
  signature: CojsonInternalTypes.Signature;
  firstNewTxIdx: number;
}) {
  let sessionEntry = contentMessage.new[sessionRow.sessionID];

  if (!sessionEntry) {
    sessionEntry = {
      after: firstNewTxIdx,
      lastSignature: "WILL_BE_REPLACED" as CojsonInternalTypes.Signature,
      newTransactions: [],
    };
    contentMessage.new[sessionRow.sessionID] = sessionEntry;
  }

  for (const tx of newTxsInSession) {
    sessionEntry.newTransactions.push(tx.tx);
  }

  sessionEntry.lastSignature = signature;
}

export function getDependedOnCoValues(
  header: CojsonInternalTypes.CoValueHeader,
  contentMessage: CojsonInternalTypes.NewContentMessage,
) {
  const deps = new Set<RawCoID>();

  for (const sessionID of Object.keys(contentMessage.new) as SessionID[]) {
    const accountId = cojsonInternals.accountOrAgentIDfromSessionID(sessionID);

    if (
      cojsonInternals.isAccountID(accountId) &&
      accountId !== contentMessage.id
    ) {
      deps.add(accountId);
    }
  }

  if (header.ruleset.type === "group") {
    /**
     * Collect all the signing keys inside the transactions to list all the
     * dependencies required to correctly access the CoValue.
     */
    for (const sessionEntry of Object.values(contentMessage.new)) {
      for (const tx of sessionEntry.newTransactions) {
        if (tx.privacy !== "trusting") continue;

        const changes = safeParseChanges(tx.changes);
        for (const change of changes) {
          if (
            change &&
            typeof change === "object" &&
            "op" in change &&
            change.op === "set" &&
            "key" in change &&
            change.key
          ) {
            const key = cojsonInternals.getGroupDependentKey(change.key);

            if (key) {
              deps.add(key);
            }
          }
        }
      }
    }
  }

  if (header.ruleset.type === "ownedByGroup") {
    deps.add(header.ruleset.group);
  }

  return deps;
}

function safeParseChanges(changes: Stringified<JsonValue[]>) {
  try {
    return cojsonInternals.parseJSON(changes);
  } catch (e) {
    return [];
  }
}
