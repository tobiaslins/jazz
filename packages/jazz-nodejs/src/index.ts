import { AgentSecret, CryptoProvider, LocalNode } from "cojson";
import { type AnyWebSocketConstructor } from "cojson-transport-ws";
import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import {
  Account,
  AccountClass,
  AccountSchema,
  AnyAccountSchema,
  CoValueFromRaw,
  Inbox,
  InstanceOfSchema,
  createJazzContextFromExistingCredentials,
  randomSessionProvider,
} from "jazz-tools";
import { webSocketWithReconnection } from "./webSocketWithReconnection.js";

type WorkerOptions<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
> = {
  accountID?: string;
  accountSecret?: string;
  syncServer?: string;
  WebSocket?: AnyWebSocketConstructor;
  AccountSchema?: S;
  crypto?: CryptoProvider;
};

/** @category Context Creation */
export async function startWorker<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>(options: WorkerOptions<S>) {
  const {
    accountID = process.env.JAZZ_WORKER_ACCOUNT,
    accountSecret = process.env.JAZZ_WORKER_SECRET,
    syncServer = "wss://cloud.jazz.tools",
    AccountSchema = Account as unknown as S,
  } = options;

  let node: LocalNode | undefined = undefined;
  const wsPeer = webSocketWithReconnection(
    syncServer,
    (peer) => {
      node?.syncManager.addPeer(peer);
    },
    options.WebSocket,
  );

  if (!accountID) {
    throw new Error("No accountID provided");
  }
  if (!accountSecret) {
    throw new Error("No accountSecret provided");
  }
  if (!accountID.startsWith("co_")) {
    throw new Error("Invalid accountID");
  }
  if (!accountSecret?.startsWith("sealerSecret_")) {
    throw new Error("Invalid accountSecret");
  }

  const context = await createJazzContextFromExistingCredentials({
    credentials: {
      accountID: accountID,
      secret: accountSecret as AgentSecret,
    },
    AccountSchema,
    // TODO: locked sessions similar to browser
    sessionProvider: randomSessionProvider,
    peersToLoadFrom: [wsPeer.peer],
    crypto: options.crypto ?? (await WasmCrypto.create()),
  });

  const account = context.account as InstanceOfSchema<S>;
  node = account._raw.core.node;

  if (!account._refs.profile?.id) {
    throw new Error("Account has no profile");
  }

  const inbox = await Inbox.load(account);

  async function done() {
    await context.account.waitForAllCoValuesSync();

    wsPeer.done();
    context.done();
  }

  const inboxPublicApi = {
    subscribe: inbox.subscribe.bind(inbox) as Inbox["subscribe"],
  };

  return {
    worker: context.account as InstanceOfSchema<S>,
    experimental: {
      inbox: inboxPublicApi,
    },
    done,
  };
}
