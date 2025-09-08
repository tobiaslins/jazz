import type { CoValueCore, JsonValue } from "../exports.js";
import type { RawCoID, SessionID, TransactionID } from "../ids.js";
import { type AvailableCoValueCore, idforHeader } from "./coValueCore.js";
import type { CoValueHeader } from "./verifiedState.js";
import type { CoValueKnownState } from "../sync.js";
import type { ListOpPayload, OpID } from "../coValues/coList.js";

export function getBranchHeader({
  type,
  branchName,
  ownerId,
  sourceId,
}: {
  type: CoValueHeader["type"];
  branchName: string;
  ownerId: RawCoID;
  sourceId: RawCoID;
}): CoValueHeader {
  return {
    type,
    // Branch name and source id are stored in the meta field
    // and used to generate the unique id for the branch
    meta: {
      branch: branchName,
      source: sourceId,
    },
    ruleset: {
      type: "ownedByGroup",
      // The owner is part of the id generation, making it possible to have multiple branches with the same name
      // but different owners
      group: ownerId,
    },
    // The meta is enough to have reproducible unique id for the branch
    uniqueness: "",
  };
}

/**
 * Given a coValue, a branch name and an owner id, returns the id for the branch
 */
export function getBranchId(
  coValue: CoValueCore,
  name: string,
  ownerId?: RawCoID,
): RawCoID {
  if (!coValue.verified) {
    throw new Error(
      "CoValueCore: getBranchId called on coValue without verified state",
    );
  }

  const currentOwnerId = ownerId ?? getBranchOwnerId(coValue);

  if (!currentOwnerId) {
    return coValue.id;
  }

  const header = getBranchHeader({
    type: coValue.verified.header.type,
    branchName: name,
    ownerId: currentOwnerId,
    sourceId: coValue.id,
  });

  return idforHeader(header, coValue.node.crypto);
}

export type BranchCommit = {
  from: CoValueKnownState["sessions"];
};

export type BranchPointerCommit = {
  branch: string;
  ownerId?: RawCoID;
};

export function getBranchOwnerId(coValue: CoValueCore) {
  if (!coValue.verified) {
    throw new Error(
      "CoValueCore: getBranchOwnerId called on coValue without verified state",
    );
  }

  const header = coValue.verified.header;

  if (header.ruleset.type !== "ownedByGroup") {
    return undefined;
  }

  return header.ruleset.group;
}

/**
 * Given a coValue, a branch name and an owner id, creates a new branch CoValue
 */
export function createBranch(
  coValue: CoValueCore,
  name: string,
  ownerId?: RawCoID,
): CoValueCore {
  if (!coValue.verified) {
    throw new Error(
      "CoValueCore: createBranch called on coValue without verified state",
    );
  }

  const branchOwnerId = ownerId ?? getBranchOwnerId(coValue);

  if (!branchOwnerId) {
    return coValue;
  }

  const header = getBranchHeader({
    type: coValue.verified.header.type,
    branchName: name,
    ownerId: branchOwnerId,
    sourceId: coValue.id,
  });

  const branch = coValue.node.createCoValue(header);
  const sessions = { ...coValue.knownState().sessions };

  // Create a branch commit to identify the starting point of the branch
  branch.makeTransaction([], "private", {
    from: sessions,
  } satisfies BranchCommit);

  // Create a branch pointer, to identify that we created a branch
  coValue.makeTransaction([], "private", {
    branch: name,
    ownerId,
  } satisfies BranchPointerCommit);

  return branch;
}

/**
 * Given a branch coValue, returns the source coValue if available
 */
export function getBranchSource(
  coValue: CoValueCore,
): AvailableCoValueCore | undefined {
  if (!coValue.verified) {
    return undefined;
  }

  const sourceId = coValue.getCurrentBranchSourceId();

  if (!sourceId) {
    return undefined;
  }

  const source = coValue.node.getCoValue(sourceId as RawCoID);

  if (!source.isAvailable()) {
    return undefined;
  }

  return source;
}

export type MergeCommit = {
  i: number;
  s?: SessionID;
  b?: RawCoID;
  mergeEnd?: 1;
};

export type MergeStartCommit = {
  mergeStart: RawCoID;
  b?: RawCoID;
  s: SessionID;
  i: number;
};

export type BranchMergedCommit = {
  merged: CoValueKnownState["sessions"];
};

/**
 * Given a branch coValue, merges the branch into the source coValue
 */
export function mergeBranch(branch: CoValueCore): CoValueCore {
  if (!branch.verified) {
    throw new Error(
      "CoValueCore: mergeBranch called on coValue without verified state",
    );
  }

  if (branch.verified.header.ruleset.type !== "ownedByGroup") {
    return branch;
  }

  const target = getBranchSource(branch);

  if (!target) {
    throw new Error("CoValueCore: unable to find source branch");
  }

  // Look for previous merge commits, to see which transactions needs to be merged
  // Done mostly for performance reasons, as we could merge all the transactions every time and nothing would change
  const mergedTransactions = branch.getMergeCommits().reduce(
    (acc, { merged }) => {
      for (const [sessionID, count] of Object.entries(merged) as [
        SessionID,
        number,
      ][]) {
        acc[sessionID] = Math.max(acc[sessionID] ?? 0, count);
      }

      return acc;
    },
    {} as CoValueKnownState["sessions"],
  );

  // Get the valid transactions from the branch, skipping the branch source and the previously merged transactions
  const branchValidTransactions = branch
    .getValidTransactions({
      from: mergedTransactions,
      ignorePrivateTransactions: false,
      skipBranchSource: true,
    })
    .filter((tx) => tx.changes.length > 0);

  // If there are no valid transactions to merge, we don't want to create a merge commit
  if (branchValidTransactions.length === 0) {
    return target;
  }

  // We do track in the meta information the original txID to make sure that
  // the CoList opid still point to the correct transaction
  // To reduce the cost of the meta we skip the repeated information
  let lastSessionId: string | undefined = undefined;
  let lastBranchId: string | undefined = undefined;
  branchValidTransactions.forEach((tx, i) => {
    const mergeMeta: MergeCommit & Partial<MergeStartCommit> = {
      i: tx.txID.txIndex,
    };

    if (i === 0) {
      mergeMeta.mergeStart = branch.id;
      lastBranchId = branch.id;
    }

    if (i === branchValidTransactions.length - 1) {
      mergeMeta.mergeEnd = 1;
    }

    if (lastSessionId !== tx.txID.sessionID) {
      mergeMeta.s = tx.txID.sessionID;
    }

    if (lastBranchId !== tx.txID.branch) {
      mergeMeta.b = branch.id;
    }

    target.makeTransaction(tx.changes, tx.tx.privacy, mergeMeta, tx.madeAt);
    lastSessionId = tx.txID.sessionID;
    lastBranchId = tx.txID.branch;
  });

  // Track the merged transactions for the branch, so future merges will know which transactions have already been merged
  branch.makeTransaction([], "private", {
    merged: branch.knownState().sessions,
  } satisfies BranchMergedCommit);

  return target;
}
