import { AvailableCoValueCore, VerifiedTransaction } from "./coValueCore.js";
import { safeParseJSON } from "../jsonStringify.js";

export function decodeTransactionChangesAndMeta(
  coValue: AvailableCoValueCore,
  transaction: VerifiedTransaction,
  ignorePrivateTransactions: boolean,
) {
  if (!transaction.isValid) {
    return;
  }

  if (transaction.tx.privacy === "private" && ignorePrivateTransactions) {
    return;
  }

  const needsChagesParsing =
    !transaction.hasInvalidChanges && !transaction.changes;
  const needsMetaParsing =
    !transaction.hasInvalidMeta && !transaction.meta && transaction.tx.meta;

  if (!needsChagesParsing && !needsMetaParsing) {
    return;
  }

  if (transaction.tx.privacy === "private") {
    const readKey = coValue.getReadKey(transaction.tx.keyUsed);

    if (!readKey) {
      return;
    }

    if (needsChagesParsing) {
      const changes = coValue.verified.decryptTransaction(
        transaction.txID.sessionID,
        transaction.txID.txIndex,
        readKey,
      );

      if (!changes) {
        transaction.hasInvalidChanges = true;
      } else {
        transaction.changes = changes;
      }
    }

    if (needsMetaParsing) {
      const meta = coValue.verified.decryptTransactionMeta(
        transaction.txID.sessionID,
        transaction.txID.txIndex,
        readKey,
      );

      if (!meta) {
        transaction.hasInvalidMeta = true;
      } else {
        transaction.meta = meta;
      }
    }
  } else {
    if (needsChagesParsing) {
      const changes = safeParseJSON(transaction.tx.changes);

      if (!changes) {
        transaction.hasInvalidChanges = true;
      } else {
        transaction.changes = changes;
      }
    }

    if (needsMetaParsing && transaction.tx.meta) {
      const meta = safeParseJSON(transaction.tx.meta);

      if (!meta) {
        transaction.hasInvalidMeta = true;
      } else {
        transaction.meta = meta;
      }
    }
  }
}
