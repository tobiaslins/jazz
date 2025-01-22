import {
  AgentSecret,
  CoID,
  ControlledAgent,
  CryptoProvider,
  LocalNode,
  Peer,
  RawAccount,
  RawAccountID,
  SessionID,
} from "cojson";
import { type Account, type AccountClass } from "../coValues/account.js";
import { RegisteredSchemas } from "../coValues/registeredSchemas.js";
import type { ID } from "../internal.js";
import { activeAccountContext } from "./activeAccountContext.js";
import { AnonymousJazzAgent } from "./anonymousJazzAgent.js";

export type Credentials = {
  accountID: ID<Account>;
  secret: AgentSecret;
};

type SessionProvider = (
  accountID: ID<Account>,
  crypto: CryptoProvider,
) => Promise<{ sessionID: SessionID; sessionDone: () => void }>;

export type AuthResult =
  | {
      type: "existing";
      username?: string;
      credentials: Credentials;
      saveCredentials?: (credentials: Credentials) => Promise<void>;
      onSuccess: () => void;
      onError: (error: string | Error) => void;
      logOut: () => void;
    }
  | {
      type: "new";
      creationProps: { name: string; anonymous?: boolean };
      initialSecret?: AgentSecret;
      saveCredentials: (credentials: Credentials) => Promise<void>;
      onSuccess: () => void;
      onError: (error: string | Error) => void;
      logOut: () => void;
    };

export async function randomSessionProvider(
  accountID: ID<Account>,
  crypto: CryptoProvider,
) {
  return {
    sessionID: crypto.newRandomSessionID(accountID as unknown as RawAccountID),
    sessionDone: () => {},
  };
}

export type JazzContextWithAccount<Acc extends Account> = {
  node: LocalNode;
  account: Acc;
  done: () => void;
  logOut: () => void;
};

export type JazzContextWithAgent = {
  agent: AnonymousJazzAgent;
  done: () => void;
  logOut: () => void;
};

export type JazzContext<Acc extends Account> =
  | JazzContextWithAccount<Acc>
  | JazzContextWithAgent;

export async function createJazzContextFromExistingCredentials<
  Acc extends Account,
>({
  credentials,
  peersToLoadFrom,
  crypto,
  AccountSchema: PropsAccountSchema,
  sessionProvider,
  onLogOut,
}: {
  credentials: Credentials;
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
  AccountSchema?: AccountClass<Acc>;
  sessionProvider: SessionProvider;
  onLogOut?: () => void;
}): Promise<JazzContextWithAccount<Acc>> {
  const { sessionID, sessionDone } = await sessionProvider(
    credentials.accountID,
    crypto,
  );

  const CurrentAccountSchema =
    PropsAccountSchema ??
    (RegisteredSchemas["Account"] as unknown as AccountClass<Acc>);

  const node = await LocalNode.withLoadedAccount({
    accountID: credentials.accountID as unknown as CoID<RawAccount>,
    accountSecret: credentials.secret,
    sessionID: sessionID,
    peersToLoadFrom: peersToLoadFrom,
    crypto: crypto,
  });

  const account = CurrentAccountSchema.fromNode(node);
  activeAccountContext.set(account);

  // Running the migration outside of withLoadedAccount for better error management
  await account.applyMigration();

  return {
    node,
    account,
    done: () => {
      node.gracefulShutdown();
      sessionDone();
    },
    logOut: () => {
      node.gracefulShutdown();
      sessionDone();
      onLogOut?.();
    },
  };
}

export async function createJazzContextForNewAccount<Acc extends Account>({
  creationProps,
  initialAgentSecret,
  peersToLoadFrom,
  crypto,
  AccountSchema: PropsAccountSchema,
  onLogOut,
}: {
  creationProps: { name: string };
  initialAgentSecret?: AgentSecret;
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
  AccountSchema?: AccountClass<Acc>;
  onLogOut?: () => void;
}): Promise<JazzContextWithAccount<Acc>> {
  const CurrentAccountSchema =
    PropsAccountSchema ??
    (RegisteredSchemas["Account"] as unknown as AccountClass<Acc>);

  const { node } = await LocalNode.withNewlyCreatedAccount({
    creationProps,
    peersToLoadFrom,
    crypto,
    initialAgentSecret,
    migration: async (rawAccount, _node, creationProps) => {
      const account = new CurrentAccountSchema({
        fromRaw: rawAccount,
      }) as Acc;
      activeAccountContext.set(account);

      await account.applyMigration(creationProps);
    },
  });

  const account = CurrentAccountSchema.fromNode(node);
  activeAccountContext.set(account);

  return {
    node,
    account,
    done: () => {
      node.gracefulShutdown();
    },
    logOut: () => {
      node.gracefulShutdown();
      onLogOut?.();
    },
  };
}

export async function createAnonymousJazzContext({
  peersToLoadFrom,
  crypto,
}: {
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
}): Promise<JazzContextWithAgent> {
  const agentSecret = crypto.newRandomAgentSecret();
  const rawAgent = new ControlledAgent(agentSecret, crypto);

  const node = new LocalNode(
    rawAgent,
    crypto.newRandomSessionID(rawAgent.id),
    crypto,
  );

  for (const peer of peersToLoadFrom) {
    node.syncManager.addPeer(peer);
  }

  activeAccountContext.setGuestMode();

  return {
    agent: new AnonymousJazzAgent(node),
    done: () => {},
    logOut: () => {},
  };
}
