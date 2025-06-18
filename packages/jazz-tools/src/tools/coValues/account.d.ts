import {
  AgentSecret,
  CryptoProvider,
  Everyone,
  InviteSecret,
  LocalNode,
  Peer,
  RawAccount,
  Role,
  SessionID,
} from "cojson";
import {
  AnonymousJazzAgent,
  type CoMap,
  type CoValue,
  CoValueBase,
  CoValueClass,
  CoValueOrZodSchema,
  type Group,
  ID,
  InstanceOrPrimitiveOfSchema,
  Profile,
  Ref,
  RefIfCoValue,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  type Schema,
  SubscribeListenerOptions,
  inspect,
} from "../internal.js";
export type AccountCreationProps = {
  name: string;
  onboarding?: boolean;
};
type AccountMembers<A extends Account> = [
  {
    id: string | "everyone";
    role: Role;
    ref: Ref<A>;
    account: A;
  },
];
/** @category Identity & Permissions */
export declare class Account extends CoValueBase implements CoValue {
  id: ID<this>;
  _type: "Account";
  _raw: RawAccount;
  static _schema: any;
  get _schema(): {
    profile: Schema;
    root: Schema;
  };
  get _owner(): Account;
  get _loadedAs(): Account | AnonymousJazzAgent;
  profile: Profile | null;
  root: CoMap | null;
  getDescriptor(key: string): Schema | undefined;
  get _refs(): {
    profile: RefIfCoValue<Profile> | undefined;
    root: RefIfCoValue<CoMap> | undefined;
  };
  /**
   * Whether this account is the currently active account.
   */
  get isMe(): boolean;
  /**
   * Whether this account is the owner of the local node.
   */
  isLocalNodeOwner: boolean;
  sessionID: SessionID | undefined;
  constructor(options: {
    fromRaw: RawAccount;
  });
  myRole(): "admin" | undefined;
  getRoleOf(member: Everyone | ID<Account> | "me"): "admin" | undefined;
  getParentGroups(): Array<Group>;
  get members(): AccountMembers<this>;
  canRead(value: CoValue): boolean;
  canWrite(value: CoValue): boolean;
  canAdmin(value: CoValue): boolean;
  acceptInvite<S extends CoValueOrZodSchema>(
    valueID: string,
    inviteSecret: InviteSecret,
    coValueClass: S,
  ): Promise<Resolved<InstanceOrPrimitiveOfSchema<S>, true> | null>;
  /** @private */
  static create<A extends Account>(
    this: CoValueClass<A> & typeof Account,
    options: {
      creationProps: {
        name: string;
      };
      initialAgentSecret?: AgentSecret;
      peersToLoadFrom?: Peer[];
      crypto: CryptoProvider;
    },
  ): Promise<A>;
  static getMe<A extends Account>(this: CoValueClass<A> & typeof Account): A;
  static createAs<A extends Account>(
    this: CoValueClass<A> & typeof Account,
    as: Account,
    options: {
      creationProps: {
        name: string;
      };
    },
  ): Promise<A>;
  static fromNode<A extends Account>(this: CoValueClass<A>, node: LocalNode): A;
  toJSON(): object | any[];
  [inspect](): object | any[];
  applyMigration(creationProps?: AccountCreationProps): Promise<void>;
  migrate(creationProps?: AccountCreationProps): void;
  /** @category Subscription & Loading */
  static load<A extends Account, const R extends RefsToResolve<A> = true>(
    this: CoValueClass<A>,
    id: ID<A>,
    options?: {
      resolve?: RefsToResolveStrict<A, R>;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<Resolved<A, R> | null>;
  /** @category Subscription & Loading */
  static subscribe<A extends Account, const R extends RefsToResolve<A> = true>(
    this: CoValueClass<A>,
    id: ID<A>,
    listener: (value: Resolved<A, R>, unsubscribe: () => void) => void,
  ): () => void;
  static subscribe<A extends Account, const R extends RefsToResolve<A> = true>(
    this: CoValueClass<A>,
    id: ID<A>,
    options: SubscribeListenerOptions<A, R>,
    listener: (value: Resolved<A, R>, unsubscribe: () => void) => void,
  ): () => void;
  /** @category Subscription & Loading */
  ensureLoaded<A extends Account, const R extends RefsToResolve<A>>(
    this: A,
    options: {
      resolve: RefsToResolveStrict<A, R>;
    },
  ): Promise<Resolved<A, R>>;
  /** @category Subscription & Loading */
  subscribe<A extends Account, const R extends RefsToResolve<A>>(
    this: A,
    listener: (value: Resolved<A, R>, unsubscribe: () => void) => void,
  ): () => void;
  subscribe<A extends Account, const R extends RefsToResolve<A>>(
    this: A,
    options: {
      resolve?: RefsToResolveStrict<A, R>;
    },
    listener: (value: Resolved<A, R>, unsubscribe: () => void) => void,
  ): () => void;
  /**
   * Wait for the `Account` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: {
    timeout?: number;
  }): Promise<unknown[]>;
  /**
   * Wait for all the available `CoValues` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForAllCoValuesSync(options?: {
    timeout?: number;
  }): Promise<unknown[][]>;
}
export declare const AccountAndGroupProxyHandler: ProxyHandler<Account | Group>;
/** @category Identity & Permissions */
export declare function isControlledAccount(
  account: Account,
): account is Account & {
  isLocalNodeOwner: true;
  sessionID: SessionID;
  _raw: RawAccount;
};
export type AccountClass<Acc extends Account> = CoValueClass<Acc> & {
  fromNode: (typeof Account)["fromNode"];
};
export {};
