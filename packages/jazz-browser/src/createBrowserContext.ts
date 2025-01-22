import { AgentSecret, LSMStorage, LocalNode, Peer, RawAccountID } from "cojson";
import { IDBStorage } from "cojson-storage-indexeddb";
import {
  Account,
  AgentID,
  AnonymousJazzAgent,
  AuthCredentials,
  CoValue,
  CoValueClass,
  CryptoProvider,
  ID,
  InviteSecret,
  JazzContextWithAccount,
  SessionID,
  WasmCrypto,
  cojsonInternals,
  createAnonymousJazzContext,
  createJazzContextForNewAccount,
  createJazzContextFromExistingCredentials,
} from "jazz-tools";
import { OPFSFilesystem } from "./OPFSFilesystem.js";
import { createWebSocketPeerWithReconnection } from "./createWebSocketPeerWithReconnection.js";
import { StorageConfig, getStorageOptions } from "./storageOptions.js";
export { AuthSecretStorage } from "./auth/AuthSecretStorage.js";
export { BrowserDemoAuth } from "./auth/DemoAuth.js";
export { BrowserPasskeyAuth } from "./auth/PasskeyAuth.js";
export { BrowserPassphraseAuth } from "./auth/PassphraseAuth.js";
import { AuthSecretStorage } from "./auth/AuthSecretStorage.js";
import { setupInspector } from "./utils/export-account-inspector.js";

setupInspector();

/** @category Context Creation */
export type BrowserContext<Acc extends Account> = {
  me: Acc;
  node: LocalNode;
  toggleNetwork: (enabled: boolean) => void;
  logOut: () => void;
  done: () => void;
};

export type BrowserGuestContext = {
  guest: AnonymousJazzAgent;
  node: LocalNode;
  toggleNetwork: (enabled: boolean) => void;
  logOut: () => void;
  done: () => void;
};

export type BaseBrowserContextOptions = {
  peer: `wss://${string}` | `ws://${string}`;
  reconnectionTimeout?: number;
  storage?: StorageConfig;
  crypto?: CryptoProvider;
  localOnly?: boolean;
};

async function setupPeers(options: BaseBrowserContextOptions) {
  const crypto = options.crypto || (await WasmCrypto.create());
  let node: LocalNode | undefined = undefined;

  const { useSingleTabOPFS, useIndexedDB } = getStorageOptions(options.storage);

  const peersToLoadFrom: Peer[] = [];

  if (useSingleTabOPFS) {
    peersToLoadFrom.push(
      await LSMStorage.asPeer({
        fs: new OPFSFilesystem(crypto),
        // trace: true,
      }),
    );
  }

  if (useIndexedDB) {
    peersToLoadFrom.push(await IDBStorage.asPeer());
  }

  const wsPeer = createWebSocketPeerWithReconnection(
    options.peer,
    options.reconnectionTimeout,
    (peer) => {
      if (node) {
        node.syncManager.addPeer(peer);
      } else {
        peersToLoadFrom.push(peer);
      }
    },
    (peer) => {
      peersToLoadFrom.splice(peersToLoadFrom.indexOf(peer), 1);
    },
  );

  function toggleNetwork(enabled: boolean) {
    if (enabled) {
      wsPeer.enable();
    } else {
      wsPeer.disable();
    }
  }

  function setNode(value: LocalNode) {
    node = value;
  }

  toggleNetwork(!options.localOnly);

  return {
    toggleNetwork,
    peersToLoadFrom,
    setNode,
    crypto,
  };
}

export async function createJazzBrowserGuestContext(
  options: BaseBrowserContextOptions,
) {
  const { toggleNetwork, peersToLoadFrom, setNode, crypto } =
    await setupPeers(options);

  const context = await createAnonymousJazzContext({
    crypto,
    peersToLoadFrom,
  });

  setNode(context.agent.node);

  return {
    guest: context.agent,
    node: context.agent.node,
    toggleNetwork,
    done: () => {
      toggleNetwork(false);
      context.done();
    },
    logOut: () => {
      toggleNetwork(false);
      context.logOut();
    },
  };
}

export type NewAccountProps = {
  secret: AgentSecret;
  creationProps: {
    name: string;
  };
};

export type BrowserContextOptions<Acc extends Account> = {
  AccountSchema?: CoValueClass<Acc> & {
    fromNode: (typeof Account)["fromNode"];
  };
  credentials?: AuthCredentials;
  newAccountProps?: NewAccountProps;
} & BaseBrowserContextOptions;

export async function createJazzBrowserContext<Acc extends Account>(
  options: BrowserContextOptions<Acc>,
) {
  const { toggleNetwork, peersToLoadFrom, setNode, crypto } =
    await setupPeers(options);

  AuthSecretStorage.migrate();

  const credentials = options.credentials ?? AuthSecretStorage.get();

  let context: JazzContextWithAccount<Acc>;

  if (credentials) {
    context = await createJazzContextFromExistingCredentials({
      credentials: {
        accountID: credentials.accountID,
        secret: credentials.accountSecret,
      },
      peersToLoadFrom,
      crypto,
      AccountSchema: options.AccountSchema,
      sessionProvider: provideBrowserLockSession,
      onLogOut: () => {
        AuthSecretStorage.clear();
      },
    });
  } else {
    const secretSeed = crypto.newRandomSecretSeed();

    const initialAgentSecret =
      options.newAccountProps?.secret ??
      crypto.agentSecretFromSecretSeed(secretSeed);
    const creationProps = options.newAccountProps?.creationProps ?? {
      name: "Anonymous user",
    };

    context = await createJazzContextForNewAccount({
      creationProps,
      initialAgentSecret,
      peersToLoadFrom,
      crypto,
      AccountSchema: options.AccountSchema,
      onLogOut: () => {
        AuthSecretStorage.clear();
      },
    });

    AuthSecretStorage.set({
      accountID: context.account.id,
      secretSeed,
      accountSecret: context.node.account.agentSecret,
      provider: "anonymous",
    });
  }

  setNode(context.node);

  return {
    me: context.account,
    node: context.node,
    toggleNetwork,
    done: () => {
      toggleNetwork(false);
      context.done();
    },
    logOut: () => {
      toggleNetwork(false);
      context.logOut();
    },
  };
}

/** @category Auth Providers */
export type SessionProvider = (
  accountID: ID<Account> | AgentID,
) => Promise<SessionID>;

export function provideBrowserLockSession(
  accountID: ID<Account> | AgentID,
  crypto: CryptoProvider,
) {
  let sessionDone!: () => void;
  const donePromise = new Promise<void>((resolve) => {
    sessionDone = resolve;
  });

  let resolveSession: (sessionID: SessionID) => void;
  const sessionPromise = new Promise<SessionID>((resolve) => {
    resolveSession = resolve;
  });

  void (async function () {
    for (let idx = 0; idx < 100; idx++) {
      // To work better around StrictMode
      for (let retry = 0; retry < 2; retry++) {
        // console.debug("Trying to get lock", accountID + "_" + idx);
        const sessionFinishedOrNoLock = await navigator.locks.request(
          accountID + "_" + idx,
          { ifAvailable: true },
          async (lock) => {
            if (!lock) return "noLock";

            const sessionID =
              localStorage.getItem(accountID + "_" + idx) ||
              crypto.newRandomSessionID(accountID as RawAccountID | AgentID);
            localStorage.setItem(accountID + "_" + idx, sessionID);

            resolveSession(sessionID as SessionID);

            await donePromise;
            console.log("Done with lock", accountID + "_" + idx, sessionID);
            return "sessionFinished";
          },
        );

        if (sessionFinishedOrNoLock === "sessionFinished") {
          return;
        }
      }
    }
    throw new Error("Couldn't get lock on session after 100x2 tries");
  })();

  return sessionPromise.then((sessionID) => ({
    sessionID,
    sessionDone,
  }));
}

/** @category Invite Links */
export function createInviteLink<C extends CoValue>(
  value: C,
  role: "reader" | "writer" | "admin" | "writeOnly",
  // default to same address as window.location, but without hash
  {
    baseURL = window.location.href.replace(/#.*$/, ""),
    valueHint,
  }: { baseURL?: string; valueHint?: string } = {},
): string {
  const coValueCore = value._raw.core;
  let currentCoValue = coValueCore;

  while (currentCoValue.header.ruleset.type === "ownedByGroup") {
    currentCoValue = currentCoValue.getGroup().core;
  }

  const { ruleset, meta } = currentCoValue.header;

  if (ruleset.type !== "group" || meta?.type === "account") {
    throw new Error("Can't create invite link for object without group");
  }

  const group = cojsonInternals.expectGroup(currentCoValue.getCurrentContent());
  const inviteSecret = group.createInvite(role);

  return `${baseURL}#/invite/${valueHint ? valueHint + "/" : ""}${
    value.id
  }/${inviteSecret}`;
}

/** @category Invite Links */
export function parseInviteLink<C extends CoValue>(
  inviteURL: string,
):
  | {
      valueID: ID<C>;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined {
  const url = new URL(inviteURL);
  const parts = url.hash.split("/");

  let valueHint: string | undefined;
  let valueID: ID<C> | undefined;
  let inviteSecret: InviteSecret | undefined;

  if (parts[0] === "#" && parts[1] === "invite") {
    if (parts.length === 5) {
      valueHint = parts[2];
      valueID = parts[3] as ID<C>;
      inviteSecret = parts[4] as InviteSecret;
    } else if (parts.length === 4) {
      valueID = parts[2] as ID<C>;
      inviteSecret = parts[3] as InviteSecret;
    }

    if (!valueID || !inviteSecret) {
      return undefined;
    }
    return { valueID, inviteSecret, valueHint };
  }
}
