import { CoID, InviteSecret, RawAccount, RawCoMap, SessionID } from "cojson";
import { RawCoStream } from "cojson";
import {
  type Account,
  CoValue,
  CoValueOrZodSchema,
  ID,
  InstanceOfSchema,
} from "../internal.js";
export type InboxInvite = `${CoID<MessagesStream>}/${InviteSecret}`;
type TxKey = `${SessionID}/${number}`;
type MessagesStream = RawCoStream<CoID<InboxMessage<CoValue, any>>>;
type FailedMessagesStream = RawCoStream<{
  errors: string[];
  value: CoID<InboxMessage<CoValue, any>>;
}>;
type TxKeyStream = RawCoStream<TxKey>;
export type InboxRoot = RawCoMap<{
  messages: CoID<MessagesStream>;
  processed: CoID<TxKeyStream>;
  failed: CoID<FailedMessagesStream>;
  inviteLink: InboxInvite;
}>;
export declare function createInboxRoot(account: Account): {
  id: CoID<InboxRoot>;
  inviteLink: `${CoID<MessagesStream>}/inviteSecret_z${string}`;
};
type InboxMessage<I extends CoValue, O extends CoValue | undefined> = RawCoMap<{
  payload: ID<I>;
  result: ID<O> | undefined;
  processed: boolean;
  error: string | undefined;
}>;
export declare class Inbox {
  account: Account;
  messages: MessagesStream;
  processed: TxKeyStream;
  failed: FailedMessagesStream;
  root: InboxRoot;
  processing: Set<
    | `${import("cojson").RawAccountID}_session_z${string}/${number}`
    | `sealer_z${string}/signer_z${string}_session_z${string}/${number}`
  >;
  private constructor();
  subscribe<M extends CoValueOrZodSchema, O extends CoValue | undefined>(
    Schema: M,
    callback: (
      message: InstanceOfSchema<M>,
      senderAccountID: ID<Account>,
    ) => Promise<O | undefined | void>,
    options?: {
      retries?: number;
    },
  ): () => void;
  static load(account: Account): Promise<Inbox>;
}
export declare class InboxSender<
  I extends CoValue,
  O extends CoValue | undefined,
> {
  currentAccount: Account;
  owner: RawAccount;
  messages: MessagesStream;
  private constructor();
  getOwnerAccount(): RawAccount<import("cojson").AccountMeta>;
  sendMessage(message: I): Promise<O extends CoValue ? ID<O> : undefined>;
  static load<I extends CoValue, O extends CoValue | undefined = undefined>(
    inboxOwnerID: ID<Account>,
    currentAccount?: Account,
  ): Promise<InboxSender<I, O>>;
}
export {};
