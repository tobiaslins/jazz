import { randomBytes } from "@noble/hashes/utils";
import { CoList, CoMap, CoValue, Static, MultiStream } from "./cojsonValue";
import {
    Encrypted,
    Hash,
    KeySecret,
    RecipientID,
    RecipientSecret,
    SignatoryID,
    SignatorySecret,
    Signature,
    StreamingHash,
    getRecipientID,
    getSignatoryID,
    newRandomRecipient,
    newRandomSignatory,
    openAs,
    shortHash,
    sign,
    verify,
    encrypt,
    decrypt,
} from "./crypto";
import { JsonValue } from "./jsonValue";
import { base58 } from "@scure/base";
import {
    PermissionsDef as RulesetDef,
    determineValidTransactions,
    expectTeam,
} from "./permissions";

export type MultiLogID = `coval_${string}`;

export type MultiLogHeader = {
    type: CoValue["type"];
    ruleset: RulesetDef;
    meta: JsonValue;
};

function multilogIDforHeader(header: MultiLogHeader): MultiLogID {
    const hash = shortHash(header);
    return `coval_${hash.slice("shortHash_".length)}`;
}

export type SessionID = `session_${string}_${AgentID}`;

export function agentIDfromSessionID(sessionID: SessionID): AgentID {
    return `agent_${sessionID.substring(sessionID.lastIndexOf("_") + 1)}`;
}

export function newRandomSessionID(agentID: AgentID): SessionID {
    return `session_${base58.encode(randomBytes(8))}_${agentID}`;
}

type SessionLog = {
    transactions: Transaction[];
    lastHash?: Hash;
    streamingHash: StreamingHash;
    lastSignature: string;
};

export type PrivateTransaction = {
    privacy: "private";
    madeAt: number;
    encryptedChanges: Encrypted<JsonValue[]>;
};

export type TrustingTransaction = {
    privacy: "trusting";
    madeAt: number;
    changes: JsonValue[];
};

export type Transaction = PrivateTransaction | TrustingTransaction;

export type DecryptedTransaction = {
    txID: TransactionID;
    changes: JsonValue[];
    madeAt: number;
};

export type TransactionID = { sessionID: SessionID; txIndex: number };

export class MultiLog {
    id: MultiLogID;
    header: MultiLogHeader;
    sessions: { [key: SessionID]: SessionLog };
    agentCredential: AgentCredential;
    ownSessionID: SessionID;
    knownAgents: { [key: AgentID]: Agent };
    requiredMultiLogs: { [key: MultiLogID]: MultiLog };
    content?: CoValue;

    constructor(
        header: MultiLogHeader,
        agentCredential: AgentCredential,
        ownSessionID: SessionID,
        knownAgents: { [key: AgentID]: Agent },
        requiredMultiLogs: { [key: MultiLogID]: MultiLog }
    ) {
        this.id = multilogIDforHeader(header);
        this.header = header;
        this.sessions = {};
        this.agentCredential = agentCredential;
        this.ownSessionID = ownSessionID;
        this.knownAgents = knownAgents;
        this.requiredMultiLogs = requiredMultiLogs;
    }

    testWithDifferentCredentials(
        agentCredential: AgentCredential,
        ownSessionID: SessionID
    ): MultiLog {
        const knownAgents = {
            ...this.knownAgents,
            [agentIDfromSessionID(ownSessionID)]: getAgent(agentCredential),
        };
        const cloned = new MultiLog(
            this.header,
            agentCredential,
            ownSessionID,
            knownAgents,
            this.requiredMultiLogs
        );

        cloned.sessions = JSON.parse(JSON.stringify(this.sessions));

        return cloned;
    }

    knownState(): MultilogKnownState {
        return {
            header: true,
            sessions: Object.fromEntries(
                Object.entries(this.sessions).map(([k, v]) => [
                    k,
                    v.transactions.length,
                ])
            ),
        };
    }

    get meta(): JsonValue {
        return this.header?.meta ?? null;
    }

    nextTransactionID(): TransactionID {
        const sessionID = this.ownSessionID;
        return {
            sessionID,
            txIndex: this.sessions[sessionID]?.transactions.length || 0,
        };
    }

    tryAddTransactions(
        sessionID: SessionID,
        newTransactions: Transaction[],
        newHash: Hash,
        newSignature: Signature
    ): boolean {
        const signatoryID =
            this.knownAgents[agentIDfromSessionID(sessionID)]?.signatoryID;

        if (!signatoryID) {
            console.warn("Unknown agent", agentIDfromSessionID(sessionID));
            return false;
        }

        const { expectedNewHash, newStreamingHash } = this.expectedNewHashAfter(
            sessionID,
            newTransactions
        );

        if (newHash !== expectedNewHash) {
            console.warn("Invalid hash", { newHash, expectedNewHash });
            return false;
        }

        if (!verify(newSignature, newHash, signatoryID)) {
            console.warn(
                "Invalid signature",
                newSignature,
                newHash,
                signatoryID
            );
            return false;
        }

        const transactions = this.sessions[sessionID]?.transactions ?? [];

        transactions.push(...newTransactions);

        this.sessions[sessionID] = {
            transactions,
            lastHash: newHash,
            streamingHash: newStreamingHash,
            lastSignature: newSignature,
        };

        this.content = undefined;

        const _ = this.getCurrentContent();

        return true;
    }

    expectedNewHashAfter(
        sessionID: SessionID,
        newTransactions: Transaction[]
    ): { expectedNewHash: Hash; newStreamingHash: StreamingHash } {
        const streamingHash =
            this.sessions[sessionID]?.streamingHash.clone() ??
            new StreamingHash();
        for (const transaction of newTransactions) {
            streamingHash.update(transaction);
        }

        const newStreamingHash = streamingHash.clone();

        return {
            expectedNewHash: streamingHash.digest(),
            newStreamingHash,
        };
    }

    makeTransaction(
        changes: JsonValue[],
        privacy: "private" | "trusting"
    ): boolean {
        const madeAt = Date.now();

        const transaction: Transaction =
            privacy === "private"
                ? {
                      privacy: "private",
                      madeAt,
                      encryptedChanges: encrypt(
                          changes,
                          this.getCurrentReadKey(),
                          {
                              in: this.id,
                              tx: this.nextTransactionID(),
                          }
                      ),
                  }
                : {
                      privacy: "trusting",
                      madeAt,
                      changes,
                  };

        const sessionID = this.ownSessionID;

        const { expectedNewHash } = this.expectedNewHashAfter(sessionID, [
            transaction,
        ]);

        const signature = sign(
            this.agentCredential.signatorySecret,
            expectedNewHash
        );

        return this.tryAddTransactions(
            sessionID,
            [transaction],
            expectedNewHash,
            signature
        );
    }

    getCurrentContent(): CoValue {
        if (this.content) {
            return this.content;
        }

        if (this.header.type === "comap") {
            this.content = new CoMap(this);
        } else if (this.header.type === "colist") {
            this.content = new CoList(this);
        } else if (this.header.type === "multistream") {
            this.content = new MultiStream(this);
        } else if (this.header.type === "static") {
            this.content = new Static(this);
        } else {
            throw new Error(`Unknown multilog type ${this.header.type}`);
        }

        return this.content;
    }

    getValidSortedTransactions(): DecryptedTransaction[] {
        const validTransactions = determineValidTransactions(this);

        const allTransactions: DecryptedTransaction[] = validTransactions.map(
            ({ txID, tx }) => {
                return {
                    txID,
                    madeAt: tx.madeAt,
                    changes:
                        tx.privacy === "private"
                            ? decrypt(
                                  tx.encryptedChanges,
                                  this.getCurrentReadKey(),
                                  {
                                      in: this.id,
                                      tx: txID,
                                  }
                              ) || (() => {throw new Error("Couldn't decrypt changes")})()
                            : tx.changes,
                };
            }
        );
        // TODO: sort by timestamp, then by txID
        allTransactions.sort((a, b) => a.madeAt - b.madeAt);

        return allTransactions;
    }

    getCurrentReadKey(): KeySecret {
        if (this.header.ruleset.type === "team") {
            const content = expectTeam(this.getCurrentContent());

            const currentRevelation = content.get("readKey");

            if (!currentRevelation) {
                throw new Error("No readKey");
            }

            const revelationTxID = content.getLastTxID("readKey");

            if (!revelationTxID) {
                throw new Error("No readKey transaction ID");
            }

            const revealer = agentIDfromSessionID(revelationTxID.sessionID);

            const revealerAgent = this.knownAgents[revealer];

            if (!revealerAgent) {
                throw new Error("Unknown revealer");
            }

            const secret = openAs(
                currentRevelation.revelation,
                this.agentCredential.recipientSecret,
                revealerAgent.recipientID,
                {
                    in: this.id,
                    tx: revelationTxID,
                }
            );

            if (!secret) {
                throw new Error("Couldn't decrypt readKey");
            }

            return secret as KeySecret;
        } else if (this.header.ruleset.type === "ownedByTeam") {
            return this.requiredMultiLogs[
                this.header.ruleset.team
            ].getCurrentReadKey();
        } else {
            throw new Error(
                "Only teams or values owned by teams have read secrets"
            );
        }
    }
}

type MultilogKnownState = {
    header: boolean;
    sessions: { [key: SessionID]: number };
};

export type AgentID = `agent_${string}`;

export type Agent = {
    signatoryID: SignatoryID;
    recipientID: RecipientID;
};

export function getAgent(agentCredential: AgentCredential) {
    return {
        signatoryID: getSignatoryID(agentCredential.signatorySecret),
        recipientID: getRecipientID(agentCredential.recipientSecret),
    };
}

export function getAgentMultilogHeader(agent: Agent): MultiLogHeader {
    return {
        type: "comap",
        ruleset: {
            type: "agent",
            initialSignatoryID: agent.signatoryID,
            initialRecipientID: agent.recipientID,
        },
        meta: null,
    };
}

export function getAgentID(agent: Agent): AgentID {
    return `agent_${multilogIDforHeader(getAgentMultilogHeader(agent)).slice(
        "coval_".length
    )}`;
}

export type AgentCredential = {
    signatorySecret: SignatorySecret;
    recipientSecret: RecipientSecret;
};

export function newRandomAgentCredential(): AgentCredential {
    const signatorySecret = newRandomSignatory();
    const recipientSecret = newRandomRecipient();
    return { signatorySecret, recipientSecret };
}

// type Role = "admin" | "writer" | "reader";

// type PermissionsDef = CJMap<AgentID, Role, {[agent: AgentID]: Role}>;
