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
  RefEncoded,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  Schema,
  SubscribeListenerOptions,
  SubscribeRestArgs,
} from "../internal.js";
import {
  Account,
  AccountAndGroupProxyHandler,
  CoValueBase,
  CoValueJazzApi,
  Profile,
  Ref,
  RegisteredSchemas,
  accessChildById,
  activeAccountContext,
  ensureCoValueLoaded,
  isControlledAccount,
  loadCoValueWithoutMe,
  parseGroupCreateOptions,
  parseSubscribeRestArgs,
  subscribeToCoValueWithoutMe,
  subscribeToExistingCoValue,
} from "../internal.js";

/** @category Identity & Permissions */
export class Group extends CoValueBase implements CoValue {
  declare $type: "Group";
  static {
    this.prototype.$type = "Group";
  }
  declare $jazz: GroupJazzApi<this>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _schema: any;
  get _schema(): {
    profile: Schema;
    root: Schema;
  } {
    return (this.constructor as typeof Group)._schema;
  }
  static {
    this._schema = {
      profile: "json" satisfies Schema,
      root: "json" satisfies Schema,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    Object.defineProperty(this.prototype, "_schema", {
      get: () => this._schema,
    });
  }

  declare profile: Profile | null;
  declare root: CoMap | null;

  /** @deprecated Don't use constructor directly, use .create */
  constructor(options: { fromRaw: RawGroup } | { owner: Account | Group }) {
    super();
    let raw: RawGroup;

    if (options && "fromRaw" in options) {
      raw = options.fromRaw;
    } else {
      const initOwner = options.owner;
      if (!initOwner) throw new Error("No owner provided");
      if (initOwner.$type === "Account" && isControlledAccount(initOwner)) {
        const rawOwner = initOwner.$jazz.raw;
        raw = rawOwner.core.node.createGroup();
      } else {
        throw new Error("Can only construct group as a controlled account");
      }
    }

    Object.defineProperties(this, {
      $jazz: {
        value: new GroupJazzApi(this, raw),
        enumerable: false,
      },
    });

    return new Proxy(this, AccountAndGroupProxyHandler as ProxyHandler<this>);
  }

  static create<G extends Group>(
    this: CoValueClass<G>,
    options?: { owner: Account } | Account,
  ) {
    return new this(parseGroupCreateOptions(options));
  }

  myRole(): Role | undefined {
    return this.$jazz.raw.myRole();
  }

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
  addMember(member: Group | Account, role: "reader" | "writer" | "admin"): void;
  addMember(
    member: Group | Everyone | Account,
    role?: AccountRole | "inherit",
  ) {
    if (member !== "everyone" && member.$type === "Group") {
      if (role === "writeOnly")
        throw new Error("Cannot add group as member with write-only role");
      this.$jazz.raw.extend(member.$jazz.raw, role);
    } else if (role !== undefined && role !== "inherit") {
      this.$jazz.raw.addMember(
        member === "everyone" ? member : member.$jazz.raw,
        role,
      );
    }
  }

  removeMember(member: Everyone | Account): void;
  /** @category Identity & Permissions
   * Revokes membership from members a parent group.
   * @param member The group that will lose access to this group.
   */
  removeMember(member: Group): void;
  removeMember(member: Group | Everyone | Account) {
    if (member !== "everyone" && member.$type === "Group") {
      this.$jazz.raw.revokeExtend(member.$jazz.raw);
    } else {
      return this.$jazz.raw.removeMember(
        member === "everyone" ? member : member.$jazz.raw,
      );
    }
  }

  private getMembersFromKeys(
    accountIDs: Iterable<RawAccountID | AgentID>,
  ): Array<{
    id: string;
    role: AccountRole;
    ref: Ref<Account>;
    account: Account;
  }> {
    const members = [];

    const refEncodedAccountSchema = {
      ref: () => Account,
      optional: false,
    } satisfies RefEncoded<Account>;

    for (const accountID of accountIDs) {
      if (!isAccountID(accountID)) continue;

      const role = this.$jazz.raw.roleOf(accountID);

      if (
        role === "admin" ||
        role === "writer" ||
        role === "reader" ||
        role === "writeOnly"
      ) {
        const ref = new Ref<Account>(
          accountID,
          this.$jazz.loadedAs,
          refEncodedAccountSchema,
          this,
        );

        const group = this;

        members.push({
          id: accountID as unknown as ID<Account>,
          role,
          ref,
          get account() {
            // Accounts values are non-nullable because are loaded as dependencies
            return accessChildById(group, accountID, refEncodedAccountSchema);
          },
        });
      }
    }

    return members;
  }

  /**
   * Returns all members of the group, including inherited members from parent
   * groups.
   *
   * If you need only the direct members of the group, use
   * {@link getDirectMembers} instead.
   *
   * @returns The members of the group.
   */
  get members() {
    return this.getMembersFromKeys(this.$jazz.raw.getAllMemberKeysSet());
  }

  /**
   * Returns the direct members of the group.
   *
   * If you need all members of the group, including inherited members from
   * parent groups, use {@link Group.members|members} instead.
   * @returns The direct members of the group.
   */
  getDirectMembers() {
    return this.getMembersFromKeys(this.$jazz.raw.getMemberKeys());
  }

  getRoleOf(member: Everyone | ID<Account> | "me") {
    if (member === "me") {
      return this.$jazz.raw.roleOf(
        activeAccountContext.get().$jazz.id as unknown as RawAccountID,
      );
    }

    return this.$jazz.raw.roleOf(
      member === "everyone" ? member : (member as unknown as RawAccountID),
    );
  }

  /**
   * Make the group public, so that everyone can read it.
   * Alias for `addMember("everyone", role)`.
   *
   * @param role - Optional: the role to grant to everyone. Defaults to "reader".
   * @returns The group itself.
   */
  makePublic(role: "reader" | "writer" = "reader") {
    this.addMember("everyone", role);
    return this;
  }

  getParentGroups(): Array<Group> {
    return this.$jazz.raw
      .getParentGroups()
      .map((group) => Group.fromRaw(group));
  }

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
  ) {
    this.$jazz.raw.extend(parent.$jazz.raw, roleMapping);
    return this;
  }

  /** @category Identity & Permissions
   * Revokes membership from members a parent group.
   * @deprecated Use `removeMember` instead.
   * @param parent The group that will lose access to this group.
   * @returns This group.
   */
  async revokeExtend(parent: Group) {
    await this.$jazz.raw.revokeExtend(parent.$jazz.raw);
    return this;
  }

  /** @category Subscription & Loading */
  static load<G extends Group, const R extends RefsToResolve<G>>(
    this: CoValueClass<G>,
    id: ID<G>,
    options?: { resolve?: RefsToResolveStrict<G, R>; loadAs?: Account },
  ): Promise<Resolved<G, R> | null> {
    return loadCoValueWithoutMe(this, id, options);
  }

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
  static subscribe<G extends Group, const R extends RefsToResolve<G>>(
    this: CoValueClass<G>,
    id: ID<G>,
    ...args: SubscribeRestArgs<G, R>
  ): () => void {
    const { options, listener } = parseSubscribeRestArgs(args);
    return subscribeToCoValueWithoutMe<G, R>(this, id, options, listener);
  }
}

export class GroupJazzApi<G extends Group> extends CoValueJazzApi<G> {
  constructor(
    private group: G,
    public raw: RawGroup,
  ) {
    super(group);
  }

  /**
   * The ID of this `Group`
   * @category Content
   */
  get id(): ID<G> {
    return this.raw.id;
  }

  /** @category Subscription & Loading */
  ensureLoaded<G extends Group, const R extends RefsToResolve<G>>(
    this: GroupJazzApi<G>,
    options?: { resolve?: RefsToResolveStrict<G, R> },
  ): Promise<Resolved<G, R>> {
    return ensureCoValueLoaded(this.group, options);
  }

  /** @category Subscription & Loading */
  subscribe<G extends Group, const R extends RefsToResolve<G>>(
    this: GroupJazzApi<G>,
    listener: (value: Resolved<G, R>, unsubscribe: () => void) => void,
  ): () => void;
  subscribe<G extends Group, const R extends RefsToResolve<G>>(
    this: GroupJazzApi<G>,
    options: { resolve?: RefsToResolveStrict<G, R> },
    listener: (value: Resolved<G, R>, unsubscribe: () => void) => void,
  ): () => void;
  subscribe<G extends Group, const R extends RefsToResolve<G>>(
    this: GroupJazzApi<G>,
    ...args: SubscribeRestArgs<G, R>
  ): () => void {
    const { options, listener } = parseSubscribeRestArgs(args);
    return subscribeToExistingCoValue(this.group, options, listener);
  }

  /**
   * Wait for the `Group` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: { timeout?: number }) {
    return this.raw.core.waitForSync(options);
  }

  /**
   * You can use `group.$jazz.refs` to access the `profile` and `root`
   * `Ref`s instead of the potentially loaded/null values.
   *
   * This allows you to always get the ID or load the value manually.
   *
   * @category Content
   */
  get refs(): {
    profile: Ref<Profile> | undefined;
    root: Ref<CoMap> | undefined;
  } {
    const profileID = this.raw.get("profile") as unknown as
      | ID<NonNullable<G["profile"]>>
      | undefined;
    const rootID = this.raw.get("root") as unknown as
      | ID<NonNullable<G["root"]>>
      | undefined;
    return {
      profile: profileID
        ? (new Ref(
            profileID,
            this.loadedAs,
            this.group._schema.profile as RefEncoded<NonNullable<G["profile"]>>,
            this.group,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any as G["profile"] extends Profile ? Ref<G["profile"]> : never)
        : undefined,
      root: rootID
        ? (new Ref(
            rootID,
            this.loadedAs,
            this.group._schema.root as RefEncoded<NonNullable<G["root"]>>,
            this.group,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any as G["root"] extends CoMap ? Ref<G["root"]> : never)
        : undefined,
    };
  }
}

RegisteredSchemas["Group"] = Group;

export function isAccountID(id: RawAccountID | AgentID): id is RawAccountID {
  return id.startsWith("co_");
}
