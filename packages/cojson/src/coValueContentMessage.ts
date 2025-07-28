import {
  CoValueHeader,
  Transaction,
  VerifiedState,
} from "./coValueCore/verifiedState.js";
import { Signature } from "./crypto/crypto.js";
import { RawCoID, SessionID } from "./ids.js";
import { getPriorityFromHeader } from "./priority.js";
import { NewContentMessage } from "./sync.js";

export function createContentMessage(
  id: RawCoID,
  header?: CoValueHeader,
): NewContentMessage {
  return {
    action: "content",
    id,
    header,
    priority: getPriorityFromHeader(header),
    new: {},
  };
}

export function addTransactionToContentMessage(
  content: NewContentMessage,
  transaction: Transaction,
  sessionID: SessionID,
  signature: Signature,
  txIdx: number,
) {
  const sessionContent = content.new[sessionID];

  if (sessionContent) {
    sessionContent.newTransactions.push(transaction);
    sessionContent.lastSignature = signature;
  } else {
    content.new[sessionID] = {
      after: txIdx - 1,
      newTransactions: [transaction],
      lastSignature: signature,
    };
  }
}
