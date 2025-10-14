import { AvailableCoValueCore, VerifiedTransaction } from "./coValueCore.js";

export function decryptTransactionChangesAndMeta(
  coValue: AvailableCoValueCore,
  transaction: VerifiedTransaction,
) {
  if (
    !transaction.isValid ||
    transaction.isDecrypted ||
    transaction.tx.privacy === "trusting" // Trusting transactions are already decrypted
  ) {
    return;
  }

  const needsChagesParsing = !transaction.changes;
  const needsMetaParsing = !transaction.meta && transaction.tx.meta;

  if (!needsChagesParsing && !needsMetaParsing) {
    return;
  }

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

    if (changes) {
      transaction.changes = changes;
    }
  }

  if (needsMetaParsing) {
    const meta = coValue.verified.decryptTransactionMeta(
      transaction.txID.sessionID,
      transaction.txID.txIndex,
      readKey,
    );

    if (meta) {
      transaction.meta = meta;
    }
  }

  // We mark the transaction as decrypted even if the changes or meta have failed to be decrypted
  // This is because, if we successfully extracted the readKey and the decrypt failed once it will always fail
  // so better to log the error (we already do that) and mark the transaction as decrypted
  transaction.isDecrypted = true;
}
