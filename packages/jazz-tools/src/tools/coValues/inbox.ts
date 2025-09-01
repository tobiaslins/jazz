import {
  CoID,
  CoValueCore,
  InviteSecret,
  RawAccount,
  RawCoMap,
  SessionID,
} from "cojson";
import { CoStreamItem, RawCoStream } from "cojson";
import {
  type Account,
  CoValue,
  CoValueClassOrSchema,
  ID,
  InstanceOfSchema,
  activeAccountContext,
  coValueClassFromCoValueClassOrSchema,
  loadCoValue,
} from "../internal.js";
import { isCoValueId } from "../lib/id.js";

export type InboxInvite = `${CoID<MessagesStream>}/${InviteSecret}`;
type TxKey = `${SessionID}/${number}`;

type MessagesStream = RawCoStream<CoID<InboxMessage<CoValue, any>>>;
type FailedMessagesStreamItem = {
  errors: string[];
  value: CoID<InboxMessage<CoValue, any>>;
};
type FailedMessagesStream = RawCoStream<FailedMessagesStreamItem>;
type TxKeyStream = RawCoStream<TxKey>;
export type InboxRoot = RawCoMap<{
  messages: CoID<MessagesStream>;
  processed: CoID<TxKeyStream>;
  failed: CoID<FailedMessagesStream>;
  inviteLink: InboxInvite;
}>;

export function createInboxRoot(account: Account) {
  if (!account.$jazz.isLocalNodeOwner) {
    throw new Error("Account is not controlled");
  }

  const rawAccount = account.$jazz.raw;

  const group = rawAccount.core.node.createGroup();
  const messagesFeed = group.createStream<MessagesStream>();

  const inboxRoot = rawAccount.createMap<InboxRoot>();
  const processedFeed = rawAccount.createStream<TxKeyStream>();
  const failedFeed = rawAccount.createStream<FailedMessagesStream>();

  const inviteLink =
    `${messagesFeed.id}/${group.createInvite("writeOnly")}` as const;

  inboxRoot.set("messages", messagesFeed.id);
  inboxRoot.set("processed", processedFeed.id);
  inboxRoot.set("failed", failedFeed.id);

  return {
    id: inboxRoot.id,
    inviteLink,
  };
}

class IncreamentalFeed<C extends RawCoStream> {
  feed: C;

  constructor(feed: C) {
    this.feed = feed;
  }

  private sessions = {};
  getNewItems() {
    const items = this.feed.core.getValidTransactions({
      ignorePrivateTransactions: false,
      from: this.sessions,
    });

    this.sessions = this.feed.core.knownState().sessions;

    return items;
  }
}

type InboxMessage<I extends CoValue, O extends CoValue | undefined> = RawCoMap<{
  payload: ID<I>;
  result: ID<O> | undefined;
  processed: boolean;
  error: string | undefined;
}>;

async function createInboxMessage<
  I extends CoValue,
  O extends CoValue | undefined,
>(payload: I, inboxOwner: RawAccount) {
  const group = payload.$jazz.raw.group;

  if (group instanceof RawAccount) {
    throw new Error("Inbox messages should be owned by a group");
  }

  group.addMember(inboxOwner, "writer");

  const message = group.createMap<InboxMessage<I, O>>({
    payload: payload.$jazz.id,
    result: undefined,
    processed: false,
    error: undefined,
  });

  await payload.$jazz.raw.core.waitForSync();
  await message.core.waitForSync();

  return message;
}

export class Inbox {
  account: Account;
  messages: MessagesStream;
  processed: TxKeyStream;
  failed: FailedMessagesStream;
  root: InboxRoot;
  processing = new Set<`${SessionID}/${number}`>();

  private constructor(
    account: Account,
    root: InboxRoot,
    messages: MessagesStream,
    processed: TxKeyStream,
    failed: FailedMessagesStream,
  ) {
    this.account = account;
    this.root = root;
    this.messages = messages;
    this.processed = processed;
    this.failed = failed;
  }

  subscribe<M extends CoValueClassOrSchema, O extends CoValue | undefined>(
    Schema: M,
    callback: (
      message: InstanceOfSchema<M>,
      senderAccountID: ID<Account>,
    ) => Promise<O | undefined | void>,
  ) {
    const processed = new Set<`${SessionID}/${number}`>();
    const failed = new Map<`${SessionID}/${number}`, string[]>();
    const node = this.account.$jazz.localNode;

    const processedFeed = new IncreamentalFeed(this.processed);

    // Invoked immediately
    this.processed.subscribe(() => {
      for (const {
        changes: [txKey],
      } of processedFeed.getNewItems()) {
        processed.add(txKey as TxKey);
      }
    });

    const { account } = this;

    const messagesFeed = new IncreamentalFeed(this.messages);

    const handleNewMessages = () => {
      for (const tx of messagesFeed.getNewItems()) {
        const accountID = getAccountIDfromSessionID(tx.txID.sessionID);

        if (!accountID) {
          console.warn(
            "Received message from unknown account",
            tx.txID.sessionID,
          );
          continue;
        }

        const id = tx.changes[0] as CoID<InboxMessage<CoValue, any>>;

        if (!isCoValueId(id)) {
          continue;
        }

        const txKey = `${tx.txID.sessionID}/${tx.txID.txIndex}` as const;

        if (processed.has(txKey) || this.processing.has(txKey)) {
          continue;
        }

        this.processing.add(txKey);

        node
          .load(id)
          .then((message) => {
            if (message === "unavailable") {
              return Promise.reject(
                new Error(`Inbox: message ${id} is unavailable`),
              );
            }

            return loadCoValue(
              coValueClassFromCoValueClassOrSchema(Schema),
              message.get("payload")!,
              {
                loadAs: account,
              },
            );
          })
          .then((value) => {
            if (!value) {
              return Promise.reject(
                new Error(`Inbox: Unable to load the payload of message ${id}`),
              );
            }

            return callback(value as InstanceOfSchema<M>, accountID);
          })
          .then((result) => {
            const inboxMessage = node
              .expectCoValueLoaded(id)
              .getCurrentContent() as RawCoMap;

            if (result) {
              inboxMessage.set("result", result.$jazz.id);
            }

            inboxMessage.set("processed", true);
            this.processing.delete(txKey);
            this.processed.push(txKey);
          })
          .catch((error) => {
            this.processing.delete(txKey);
            this.processed.push(txKey);

            console.error(error);
            const errors = failed.get(txKey) ?? [];

            const stringifiedError = String(error);
            errors.push(stringifiedError);

            this.failed.push({ errors, value: id });

            let inboxMessage: RawCoMap | undefined;

            try {
              inboxMessage = node
                .expectCoValueLoaded(id)
                .getCurrentContent() as RawCoMap;

              inboxMessage.set("error", stringifiedError);
              inboxMessage.set("processed", true);
            } catch (error) {}
          });
      }
    };

    const unsubscribe = this.messages.subscribe(handleNewMessages);

    return () => {
      unsubscribe();
    };
  }

  static async load(account: Account) {
    const profile = account.profile;

    if (!profile) {
      throw new Error("Account profile should already be loaded");
    }

    if (!profile.inbox) {
      throw new Error("The account has not set up their inbox");
    }

    const node = account.$jazz.localNode;

    const root = await node.load(profile.inbox as CoID<InboxRoot>);

    if (root === "unavailable") {
      throw new Error("Inbox not found");
    }

    const [messages, processed, failed] = await Promise.all([
      node.load(root.get("messages")!),
      node.load(root.get("processed")!),
      node.load(root.get("failed")!),
    ]);

    if (
      messages === "unavailable" ||
      processed === "unavailable" ||
      failed === "unavailable"
    ) {
      throw new Error("Inbox not found");
    }

    await waitForFullStreaming(processed.core);

    return new Inbox(account, root, messages, processed, failed);
  }
}

export class InboxSender<I extends CoValue, O extends CoValue | undefined> {
  currentAccount: Account;
  owner: RawAccount;
  messages: MessagesStream;

  private constructor(
    currentAccount: Account,
    owner: RawAccount,
    messages: MessagesStream,
  ) {
    this.currentAccount = currentAccount;
    this.owner = owner;
    this.messages = messages;
  }

  getOwnerAccount() {
    return this.owner;
  }

  async sendMessage(
    message: I,
  ): Promise<O extends CoValue ? ID<O> : undefined> {
    const inboxMessage = await createInboxMessage<I, O>(message, this.owner);

    this.messages.push(inboxMessage.id);

    return new Promise((resolve, reject) => {
      inboxMessage.subscribe((message) => {
        if (message.get("processed")) {
          const error = message.get("error");
          if (error) {
            reject(new Error(error));
          } else {
            resolve(
              message.get("result") as O extends CoValue ? ID<O> : undefined,
            );
          }
        }
      });
    });
  }

  static async load<
    I extends CoValue,
    O extends CoValue | undefined = undefined,
  >(inboxOwnerID: ID<Account>, currentAccount?: Account) {
    currentAccount ||= activeAccountContext.get();

    const node = currentAccount.$jazz.localNode;

    const inboxOwnerRaw = await node.load(
      inboxOwnerID as unknown as CoID<RawAccount>,
    );

    if (inboxOwnerRaw === "unavailable") {
      throw new Error("Failed to load the inbox owner");
    }

    const inboxOwnerProfileRaw = await node.load(inboxOwnerRaw.get("profile")!);

    if (inboxOwnerProfileRaw === "unavailable") {
      throw new Error("Failed to load the inbox owner profile");
    }

    if (
      inboxOwnerProfileRaw.group.roleOf(currentAccount.$jazz.raw.id) !==
        "reader" &&
      inboxOwnerProfileRaw.group.roleOf(currentAccount.$jazz.raw.id) !==
        "writer" &&
      inboxOwnerProfileRaw.group.roleOf(currentAccount.$jazz.raw.id) !== "admin"
    ) {
      throw new Error(
        "Insufficient permissions to access the inbox, make sure its user profile is publicly readable.",
      );
    }

    const inboxInvite = inboxOwnerProfileRaw.get("inboxInvite");

    if (!inboxInvite) {
      throw new Error("The user has not set up their inbox");
    }

    const id = await acceptInvite(inboxInvite as InboxInvite, currentAccount);

    const messages = await node.load(id);

    if (messages === "unavailable") {
      throw new Error("Inbox not found");
    }

    return new InboxSender<I, O>(currentAccount, inboxOwnerRaw, messages);
  }
}

async function acceptInvite(invite: string, account?: Account) {
  account ||= activeAccountContext.get();

  const id = invite.slice(0, invite.indexOf("/")) as CoID<MessagesStream>;

  const inviteSecret = invite.slice(invite.indexOf("/") + 1) as InviteSecret;

  if (!isCoValueId(id) || !inviteSecret.startsWith("inviteSecret_")) {
    throw new Error("Invalid inbox ticket");
  }

  if (!account.$jazz.isLocalNodeOwner) {
    throw new Error("Account is not controlled");
  }

  await account.$jazz.localNode.acceptInvite(id, inviteSecret);

  return id;
}

function getAccountIDfromSessionID(sessionID: SessionID) {
  const until = sessionID.indexOf("_session");
  const accountID = sessionID.slice(0, until);

  if (isCoValueId(accountID)) {
    return accountID;
  }

  return;
}

function waitForFullStreaming(coValue: CoValueCore) {
  return new Promise<void>((resolve) => {
    coValue.subscribe((_: CoValueCore, unsubscribe) => {
      if (coValue.isAvailable() && !coValue.verified.isStreaming()) {
        resolve();
        unsubscribe();
      }
    });
  });
}
