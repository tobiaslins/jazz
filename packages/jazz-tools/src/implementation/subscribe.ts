import { LocalNode, RawAccount, RawCoMap, RawCoValue, RawGroup } from "cojson";
import { RegisteredSchemas } from "../coValues/registeredSchemas.js";
import { CoFeed, CoList, CoMap } from "../exports.js";
import {
  CoValue,
  CoValueClass,
  ID,
  RefEncoded,
  RefsToResolve,
  Resolved,
  instantiateRefEncoded,
  isRefEncoded,
} from "../internal.js";
import { coValuesCache } from "../lib/cache.js";

type JazzErrorIssue = {
  code: "unavailable" | "unauthorized" | "validationError";
  message: string;
  params: Record<string, any>;
  path: string[];
};

type SubscriptionValue<D extends CoValue, R extends RefsToResolve<D>> =
  | { type: "loaded"; value: Resolved<D, R>; id: string }
  | JazzError;
type Unloaded = { type: "unloaded"; id: string };

class JazzError {
  constructor(
    public id: ID<CoValue> | undefined,
    public type: "unavailable" | "unauthorized",
    public issues: JazzErrorIssue[],
  ) {}

  toString() {
    return this.issues
      .map((issue) => {
        let message = `${issue.message}`;

        if (this.id) {
          message += ` from ${this.id}`;
        }

        if (issue.path.length > 0) {
          message += ` on path ${issue.path.join(".")}`;
        }

        return message;
      })
      .join("\n");
  }
}

export function getOwnerFromRawValue(raw: RawCoValue) {
  let owner = raw instanceof RawGroup ? raw : raw.group;

  return coValuesCache.get(owner as any, () =>
    owner instanceof RawAccount
      ? RegisteredSchemas["Account"].fromRaw(owner)
      : RegisteredSchemas["Group"].fromRaw(owner as any),
  );
}

class Subscription {
  _unsubscribe: () => void = () => {};
  unsubscribed = false;

  value: RawCoMap | undefined;
  status: "unknown" | "loading" | "loaded" | "unauthorized" | "unavailable" =
    "unknown";

  constructor(
    public node: LocalNode,
    public id: string,
    public listener: (value: RawCoValue | "unavailable") => void,
  ) {
    const value = this.node.coValuesStore.get(this.id as any);

    if (value.core) {
      this.status = "loaded";
      this.subscribe(value.core.getCurrentContent());
    } else {
      this.status = "loading";
      this.node.loadCoValueCore(this.id as any).then((value) => {
        if (this.unsubscribed) return;

        // TODO handle the error states which should be transitive
        if (value !== "unavailable") {
          this.status = "loaded";
          this.subscribe(value.getCurrentContent());
        } else {
          this.status = "unavailable";
          this.listener("unavailable");
        }
      });
    }
  }

  subscribe(value: RawCoValue) {
    if (this.unsubscribed) return;

    this._unsubscribe = value.subscribe((value) => {
      this.listener(value);
    });
    this.listener(value);
  }

  unsubscribe() {
    if (this.unsubscribed) return;
    this.unsubscribed = true;
    this._unsubscribe();
  }
}

function createCoValue<D extends CoValue>(
  ref: RefEncoded<D>,
  raw: RawCoValue,
  resolutionNode: CoValueResolutionNode<D>,
) {
  const freshValueInstance = instantiateRefEncoded(ref, raw);

  Object.defineProperty(freshValueInstance, "_resolutionNode", {
    value: resolutionNode,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return {
    type: "loaded" as const,
    value: freshValueInstance,
    id: resolutionNode.id,
  };
}

export function getResolutionNode<D extends CoValue>(value: D) {
  const resolutionNode = value._resolutionNode;

  if (resolutionNode) {
    return resolutionNode;
  }

  const node = value._raw.core.node;
  const resolve = true;
  const id = value.id;

  const newResolutionNode = new CoValueResolutionNode(node, resolve, id, {
    ref: value.constructor as CoValueClass<D>,
    optional: false,
  });

  Object.defineProperty(value, "_resolutionNode", {
    value: resolutionNode,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return newResolutionNode;
}

export class CoValueResolutionNode<D extends CoValue> {
  childNodes = new Map<string, CoValueResolutionNode<CoValue>>();
  childValues: Map<string, SubscriptionValue<any, any> | Unloaded> = new Map<
    string,
    SubscriptionValue<D, any>
  >();
  value: SubscriptionValue<D, any> | Unloaded;
  childErrors: Map<string, JazzError> = new Map();
  validationErrors: Map<string, JazzError> = new Map();
  errorFromChildren: JazzError | undefined;
  subscription: Subscription;
  listener: ((value: SubscriptionValue<D, any>) => void) | undefined;
  dirty = false;
  resolve: RefsToResolve<any>;
  idsSubscribed = new Set<string>();
  autoloaded = new Set<string>();
  processedChangesId = "0/0";
  batchingUpdates = false;

  constructor(
    public node: LocalNode,
    resolve: RefsToResolve<D>,
    public id: ID<D>,
    public schema: RefEncoded<D>,
  ) {
    this.resolve = resolve;
    this.value = { type: "unloaded", id };
    this.subscription = new Subscription(node, id, (value) => {
      this.handleUpdate(value);
    });
  }

  updateValue(value: SubscriptionValue<D, any>) {
    if (this.value !== value) {
      this.value = value;
      this.dirty = true;
    }
  }

  handleUpdate(update: RawCoValue | "unavailable") {
    if (update === "unavailable") {
      if (this.value.type === "unloaded") {
        this.updateValue(
          new JazzError(this.id, "unavailable", [
            {
              code: "unavailable",
              message: "The value is unavailable",
              params: {
                id: this.id,
              },
              path: [],
            },
          ]),
        );
      }
      this.triggerUpdate();
      return;
    }

    const owner = getOwnerFromRawValue(update);
    const hasChanged = update.processedChangesId !== this.processedChangesId;

    this.processedChangesId = update.processedChangesId;

    const ruleset = update.core.header.ruleset;
    const hasAccess = ruleset.type === "group" || owner.myRole() !== undefined;

    if (!hasAccess) {
      if (this.value.type !== "unauthorized") {
        this.updateValue(
          new JazzError(this.id, "unauthorized", [
            {
              code: "unauthorized",
              message:
                "The current user is not authorized to access this value",
              params: {
                id: this.id,
              },
              path: [],
            },
          ]),
        );
        this.triggerUpdate();
      }
      return;
    }

    if (this.value.type !== "loaded") {
      this.updateValue(createCoValue(this.schema, update, this));
      this.loadChildren();
    } else {
      if (this.loadChildren()) {
        this.updateValue(createCoValue(this.schema, update, this));
      } else if (hasChanged) {
        this.updateValue(createCoValue(this.schema, update, this));
      }
    }

    this.triggerUpdate();
  }

  computeChildErrors() {
    let issues: JazzErrorIssue[] = [];
    let errorType: JazzError["type"] = "unavailable";

    if (this.childErrors.size === 0 && this.validationErrors.size === 0) {
      return undefined;
    }

    for (const value of this.childErrors.values()) {
      errorType = value.type;
      if (value.issues) {
        issues.push(...value.issues);
      }
    }

    for (const value of this.validationErrors.values()) {
      errorType = value.type;
      if (value.issues) {
        issues.push(...value.issues);
      }
    }

    if (issues.length > 0) {
      return new JazzError(this.id, errorType, issues);
    }

    return new JazzError(this.id, errorType, []);
  }

  handleChildUpdate = (
    id: string,
    value: SubscriptionValue<any, any> | Unloaded,
    key?: string,
  ) => {
    if (value.type === "unloaded") {
      return;
    }

    this.childValues.set(id, value);

    if (value.type === "unavailable" || value.type === "unauthorized") {
      const error = value;
      this.childErrors.set(id, error);

      if (error.issues) {
        // TODO: Immutable updates
        error.issues.forEach((issue) => {
          issue.path.unshift(key ?? id);
        });
      }

      this.errorFromChildren = this.computeChildErrors();
    } else if (this.errorFromChildren && this.childErrors.has(id)) {
      this.childErrors.delete(id);

      this.errorFromChildren = this.computeChildErrors();
    }

    if (this.shouldSendUpdates()) {
      if (this.value.type === "loaded") {
        this.updateValue(
          createCoValue(this.schema, this.value.value._raw, this),
        );
      }
    }

    this.triggerUpdate();
  };

  shouldSendUpdates() {
    if (this.value.type === "unloaded") return false;
    if (this.value.type !== "loaded") return true;

    for (const value of this.childValues.values()) {
      if (value.type === "unloaded" && !this.autoloaded.has(value.id)) {
        return false;
      }
    }

    return true;
  }

  triggerUpdate() {
    if (!this.shouldSendUpdates()) return;
    if (!this.dirty) return;
    if (!this.listener) return;
    if (this.batchingUpdates) return;

    const error = this.errorFromChildren;
    const value = this.value;

    if (error) {
      this.listener(error);
      this.subscribers.forEach((listener) => listener(error));
    } else if (value.type !== "unloaded") {
      this.listener(value);
      this.subscribers.forEach((listener) => listener(value));
    }

    this.dirty = false;
  }

  subscribers = new Set<(value: SubscriptionValue<D, any>) => void>();
  subscribe(listener: (value: SubscriptionValue<D, any>) => void) {
    this.subscribers.add(listener);

    return () => {
      this.subscribers.delete(listener);
    };
  }

  setListener(listener: (value: SubscriptionValue<D, any> | Unloaded) => void) {
    this.listener = listener;
    this.triggerUpdate();
  }

  subscribeToKey(key: string) {
    if (this.resolve === true || !this.resolve) {
      this.resolve = {};
    }

    if (this.resolve.$each || key in this.resolve) {
      return;
    }

    this.resolve[key as keyof typeof this.resolve] = true;

    if (this.value.type !== "loaded") {
      return;
    }

    const value = this.value.value;

    if (value._type === "CoMap" || value._type === "Account") {
      const map = value as CoMap;

      const id = this.loadCoMapKey(map, key, true);

      if (id) {
        this.autoloaded.add(id);
      }
    } else if (value._type === "CoList") {
      const list = value as CoList;

      const id = this.loadCoListKey(list, key, true);

      if (id) {
        this.autoloaded.add(id);
      }
    }
  }

  subscribeToId(id: string, descriptor: RefEncoded<any>) {
    if (this.idsSubscribed.has(id) || this.childValues.has(id)) {
      return;
    }

    this.idsSubscribed.add(id);
    this.autoloaded.add(id);

    this.childValues.set(id, { type: "unloaded", id });
    const child = new CoValueResolutionNode(
      this.node,
      true,
      id as ID<any>,
      descriptor,
    );
    this.childNodes.set(id, child);
    child.setListener((value) => this.handleChildUpdate(id, value));
  }

  loadChildren() {
    this.batchingUpdates = true;

    const { resolve } = this;

    if (this.value.type !== "loaded") {
      return false;
    }

    const value = this.value.value;

    const depth =
      typeof resolve !== "object" || resolve === null ? {} : (resolve as any);

    let hasChanged = false;

    const idsToLoad = new Set<string>(this.idsSubscribed);

    const coValueType = value._type;

    if (Object.keys(depth).length > 0) {
      if (coValueType === "CoMap" || coValueType === "Account") {
        const map = value as CoMap;
        const keys = "$each" in depth ? map._raw.keys() : Object.keys(depth);

        for (const key of keys) {
          const id = this.loadCoMapKey(map, key, depth[key] ?? depth.$each);

          if (id) {
            idsToLoad.add(id);
          }
        }
      } else if (value._type === "CoList") {
        const list = value as CoList;

        const descriptor = list.getItemsDescriptor();

        if (descriptor && isRefEncoded(descriptor)) {
          list._raw.processNewTransactions();
          const entries = list._raw.entries();
          const keys =
            "$each" in depth ? Object.keys(entries) : Object.keys(depth);

          for (const key of keys) {
            const id = this.loadCoListKey(list, key, depth[key] ?? depth.$each);

            if (id) {
              idsToLoad.add(id);
            }
          }
        }
      } else if (value._type === "CoStream") {
        const stream = value as CoFeed;
        const descriptor = stream.getItemsDescriptor();

        if (descriptor && isRefEncoded(descriptor)) {
          for (const session of stream._raw.sessions()) {
            const values = stream._raw.items[session] ?? [];

            for (const [i, item] of values.entries()) {
              const key = `${session}/${i}`;

              if (!depth.$each && !depth[key]) {
                continue;
              }

              const id = item.value as string | undefined;

              if (id) {
                idsToLoad.add(id);
                this.loadChildNode(id, depth[key] ?? depth.$each, descriptor);
                this.validationErrors.delete(key);
              } else if (!descriptor.optional) {
                this.validationErrors.set(
                  key,
                  new JazzError(undefined, "unavailable", [
                    {
                      code: "validationError",
                      message: `The ref on position ${key} requested on ${stream.constructor.name} is missing`,
                      params: {},
                      path: [key],
                    },
                  ]),
                );
              }
            }
          }
        }
      }
    }

    this.errorFromChildren = this.computeChildErrors();

    // Collect all the deleted ids
    for (const id of this.childNodes.keys()) {
      if (!idsToLoad.has(id)) {
        hasChanged = true;
        const childNode = this.childNodes.get(id);

        if (childNode) {
          childNode.destroy();
        }

        this.childNodes.delete(id);
        this.childValues.delete(id);
      }
    }

    this.batchingUpdates = false;

    return hasChanged;
  }

  loadCoMapKey(map: CoMap, key: string, depth: Record<string, any> | true) {
    const id = map._raw.get(key) as string | undefined;
    const descriptor = map.getDescriptor(key);

    if (!descriptor) {
      this.childErrors.set(
        key,
        new JazzError(undefined, "unavailable", [
          {
            code: "validationError",
            message: `The ref ${key} requested on ${map.constructor.name} is not defined in the schema`,
            params: {},
            path: [key],
          },
        ]),
      );
      return undefined;
    }

    if (isRefEncoded(descriptor)) {
      if (id) {
        this.loadChildNode(id, depth, descriptor, key);
        this.validationErrors.delete(key);

        return id;
      } else if (!descriptor.optional) {
        this.validationErrors.set(
          key,
          new JazzError(undefined, "unavailable", [
            {
              code: "validationError",
              message: `The ref ${key} requested on ${map.constructor.name} is missing`,
              params: {},
              path: [key],
            },
          ]),
        );
      }
    }

    return undefined;
  }

  loadCoListKey(list: CoList, key: string, depth: Record<string, any> | true) {
    const descriptor = list.getItemsDescriptor();

    if (!descriptor || !isRefEncoded(descriptor)) {
      return undefined;
    }

    const entries = list._raw.entries();
    const entry = entries[Number(key)];

    if (!entry) {
      return undefined;
    }

    const id = entry.value as string | undefined;

    if (id) {
      this.loadChildNode(id, depth, descriptor, key);
      this.validationErrors.delete(key);

      return id;
    } else if (!descriptor.optional) {
      this.validationErrors.set(
        key,
        new JazzError(undefined, "unavailable", [
          {
            code: "validationError",
            message: `The ref on position ${key} requested on ${list.constructor.name} is missing`,
            params: {},
            path: [key],
          },
        ]),
      );
    }

    return undefined;
  }

  loadChildNode(
    id: string,
    query: RefsToResolve<any>,
    descriptor: RefEncoded<any>,
    key?: string,
  ) {
    if (this.childValues.has(id)) {
      return;
    }

    this.childValues.set(id, { type: "unloaded", id });
    const child = new CoValueResolutionNode(
      this.node,
      query,
      id as ID<any>,
      descriptor,
    );
    this.childNodes.set(id, child);
    child.setListener((value) => this.handleChildUpdate(id, value, key));
  }

  destroy() {
    this.subscription.unsubscribe();
    this.childNodes.forEach((child) => child.destroy());
  }
}
