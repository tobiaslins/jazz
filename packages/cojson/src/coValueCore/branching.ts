import { CoValueCore } from "../exports.js";
import { RawCoID, SessionID } from "../ids.js";
import { AvailableCoValueCore, idforHeader } from "./coValueCore.js";
import { CoValueHeader } from "./verifiedState.js";
import { CoValueKnownState } from "../sync.js";

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
    meta: {
      branch: branchName,
      source: sourceId,
    },
    ruleset: {
      type: "ownedByGroup",
      group: ownerId,
    },
    uniqueness: "",
  };
}

export function getBranchId(
  coValue: CoValueCore,
  name: string,
  ownerId: RawCoID,
): RawCoID {
  if (!coValue.verified) {
    throw new Error(
      "CoValueCore: getBranchId called on coValue without verified state",
    );
  }

  const header = getBranchHeader({
    type: coValue.verified.header.type,
    branchName: name,
    ownerId,
    sourceId: coValue.id,
  });

  return idforHeader(header, coValue.node.crypto);
}

export type BranchCommit = {
  branch: CoValueKnownState["sessions"];
};

export function createBranch(
  coValue: CoValueCore,
  name: string,
  ownerId: RawCoID,
): CoValueCore {
  if (!coValue.verified) {
    throw new Error(
      "CoValueCore: createBranch called on coValue without verified state",
    );
  }

  const header = getBranchHeader({
    type: coValue.verified.header.type,
    branchName: name,
    ownerId,
    sourceId: coValue.id,
  });

  const value = coValue.node.createCoValue(header);

  value.makeTransaction([], "private", {
    branch: coValue.knownState().sessions,
  } satisfies BranchCommit);

  return value;
}

export function getBranchSource(
  coValue: CoValueCore,
): AvailableCoValueCore | undefined {
  if (!coValue.verified) {
    return undefined;
  }

  const sourceId = coValue.verified.header.meta?.source;

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
  merge: CoValueKnownState["sessions"];
  id: RawCoID;
  count: number;
};

export function mergeBranch(branch: CoValueCore): CoValueCore {
  if (!branch.verified) {
    throw new Error(
      "CoValueCore: mergeBranch called on coValue without verified state",
    );
  }

  const sourceId = branch.verified.header.meta?.source;

  if (!sourceId) {
    throw new Error("CoValueCore: mergeBranch called on a non-branch coValue");
  }

  const target = getBranchSource(branch);

  if (!target) {
    throw new Error("CoValueCore: unable to find source branch");
  }

  const mergedTransactions = target.mergeCommits.reduce(
    (acc, { commit }) => {
      if (commit.id !== branch.id) {
        return acc;
      }

      for (const [sessionID, count] of Object.entries(commit.merge) as [
        SessionID,
        number,
      ][]) {
        acc[sessionID] = Math.max(acc[sessionID] ?? 0, count);
      }

      return acc;
    },
    {} as CoValueKnownState["sessions"],
  );

  const branchValidTransactions = branch
    .getValidTransactions({
      from: mergedTransactions,
      ignorePrivateTransactions: false,
      skipBranchSource: true,
    })
    .filter((tx) => tx.changes.length > 0);

  if (branchValidTransactions.length === 0) {
    return target;
  }

  target.makeTransaction([], "private", {
    merge: { ...branch.knownState().sessions },
    id: branch.id,
    count: branchValidTransactions.length,
  } satisfies MergeCommit);

  for (const { tx, changes } of branchValidTransactions) {
    target.makeTransaction(changes, tx.privacy);
  }

  return target;
}
