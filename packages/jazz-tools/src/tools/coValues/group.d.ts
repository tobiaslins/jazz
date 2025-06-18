import type {
  AccountRole,
  AgentID,
  Everyone,
  RawAccountID,
  RawGroup,
  Role,
} from "cojson";
import type {
  CoMap,
  CoValue,
  CoValueClass,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  Schema,
  SubscribeListenerOptions,
} from "../internal.js";
import { Account, CoValueBase, Profile, Ref } from "../internal.js";
/** @category Identity & Permissions */
export declare class Group extends CoValueBase implements CoValue {
  id: ID<this>;
  _type: "Group";
  _raw: RawGroup;
  static _schema: any;
  get _schema(): {
    profile: Schema;
    root: Schema;
  };
  profile: Profile | null;
  root: CoMap | null;
  get _refs(): {
    profile: Ref<Profile> | undefined;
    root: Ref<CoMap> | undefined;
  };
  /** @deprecated Don't use constructor directly, use .create */
  constructor(
    options:
      | {
          fromRaw: RawGroup;
        }
      | {
          owner: Account | Group;
        },
  );
  static create<G extends Group>(
    this: CoValueClass<G>,
    options?:
      | {
          owner: Account;
        }
      | Account,
  ): G;
  myRole(): Role | undefined;
  addMember(member: Everyone, role: "writer" | "reader" | "writeOnly"): void;
  addMember(member: Account, role: AccountRole): void;
  /** @category Identity & Permissions
   * Gives members of a parent group membership in this group.
   * @param member The group that will gain access to this group.
   * @param role The role all members of the parent group should have in this group.
   */
  addMember(
    member: Group,
    role?: "reader" | "writer" | "admin" | "inherit",
  ): void;
  removeMember(member: Everyone | Account): Promise<void>;
  /** @category Identity & Permissions
   * Revokes membership from members a parent group.
   * @param member The group that will lose access to this group.
   */
  removeMember(member: Group): Promise<void>;
  get members(): Array<{
    id: string;
    role: AccountRole;
    ref: Ref<Account>;
    account: Account;
  }>;
  getRoleOf(member: Everyone | ID<Account> | "me"): Role | undefined;
  /**
   * Make the group public, so that everyone can read it.
   * Alias for `addMember("everyone", role)`.
   *
   * @param role - Optional: the role to grant to everyone. Defaults to "reader".
   * @returns The group itself.
   */
  makePublic(role?: "reader" | "writer"): this;
  getParentGroups(): Array<Group>;
  /** @category Identity & Permissions
   * Gives members of a parent group membership in this group.
   * @deprecated Use `addMember` instead.
   * @param parent The group that will gain access to this group.
   * @param roleMapping The role all members of the parent group should have in this group.
   * @returns This group.
   */
  extend(
    parent: Group,
    roleMapping?: "reader" | "writer" | "admin" | "inherit",
  ): this;
  /** @category Identity & Permissions
   * Revokes membership from members a parent group.
   * @deprecated Use `removeMember` instead.
   * @param parent The group that will lose access to this group.
   * @returns This group.
   */
  revokeExtend(parent: Group): Promise<this>;
  /** @category Subscription & Loading */
  static load<G extends Group, const R extends RefsToResolve<G>>(
    this: CoValueClass<G>,
    id: ID<G>,
    options?: {
      resolve?: RefsToResolveStrict<G, R>;
      loadAs?: Account;
    },
  ): Promise<Resolved<G, R> | null>;
  /** @category Subscription & Loading */
  static subscribe<G extends Group, const R extends RefsToResolve<G>>(
    this: CoValueClass<G>,
    id: ID<G>,
    listener: (value: Resolved<G, R>, unsubscribe: () => void) => void,
  ): () => void;
  static subscribe<G extends Group, const R extends RefsToResolve<G>>(
    this: CoValueClass<G>,
    id: ID<G>,
    options: SubscribeListenerOptions<G, R>,
    listener: (value: Resolved<G, R>, unsubscribe: () => void) => void,
  ): () => void;
  /** @category Subscription & Loading */
  ensureLoaded<G extends Group, const R extends RefsToResolve<G>>(
    this: G,
    options?: {
      resolve?: RefsToResolveStrict<G, R>;
    },
  ): Promise<Resolved<G, R>>;
  /** @category Subscription & Loading */
  subscribe<G extends Group, const R extends RefsToResolve<G>>(
    this: G,
    listener: (value: Resolved<G, R>, unsubscribe: () => void) => void,
  ): () => void;
  subscribe<G extends Group, const R extends RefsToResolve<G>>(
    this: G,
    options: {
      resolve?: RefsToResolveStrict<G, R>;
    },
    listener: (value: Resolved<G, R>, unsubscribe: () => void) => void,
  ): () => void;
  /**
   * Wait for the `Group` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: {
    timeout?: number;
  }): Promise<unknown[]>;
}
export declare function isAccountID(
  id: RawAccountID | AgentID,
): id is RawAccountID;
