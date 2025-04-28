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
  co,
  instantiateRefEncoded,
  isRefEncoded,
} from "../internal.js";
import { coValuesCache } from "../lib/cache.js";

type SubscriptionErrorIssue = {
  code: "unavailable" | "unauthorized" | "validationError";
  message: string;
  params: Record<string, any>;
  path: string[];
};

type SubscriptionError =
  | { type: "unavailable"; issues: SubscriptionErrorIssue[]; id?: string }
  | { type: "unauthorized"; issues: SubscriptionErrorIssue[]; id?: string };
type SubscriptionValue<D extends CoValue, R extends RefsToResolve<D>> =
  | { type: "loaded"; value: Resolved<D, R>; id: string }
  | SubscriptionError;
type Unloaded = { type: "unloaded"; id: string };

function createResolvablePromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

type ResolvablePromise<T> = ReturnType<typeof createResolvablePromise<T>>;

function getErrorState(
  id: ID<CoValue> | undefined,
  type: "unavailable" | "unauthorized",
  issues: SubscriptionErrorIssue[],
): SubscriptionError {
  return {
    id,
    type,
    issues,
  };
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
      this.node.load(this.id as any).then((value) => {
        if (this.unsubscribed) return;

        // TODO handle the error states which should be transitive
        if (value !== "unavailable") {
          this.status = "loaded";
          this.subscribe(value);
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
  childErrors: Map<string, SubscriptionError> = new Map<
    string,
    SubscriptionError
  >();
  errorFromChildren: SubscriptionError | undefined;
  promise: ResolvablePromise<void> | undefined;
  subscription: Subscription;
  listener: ((value: SubscriptionValue<D, any>) => void) | undefined;
  dirty = false;
  resolve: RefsToResolve<any>;
  idsSubscribed = new Set<string>();
  processedChangesId = "0/0";

  constructor(
    public node: LocalNode,
    resolve: RefsToResolve<D>,
    public id: ID<D>,
    public schema: RefEncoded<D>,
  ) {
    this.value = { type: "unloaded", id };
    this.subscription = new Subscription(node, id, (value) => {
      this.handleUpdate(value);
    });
    this.resolve = resolve;
  }

  updateValue(value: SubscriptionValue<D, any>) {
    if (this.value !== value) {
      this.value = value;
      this.dirty = true;
    }
  }

  handleUpdate(update: RawCoValue | "unavailable") {
    if (update === "unavailable") {
      if (this.value.type !== "unavailable") {
        this.updateValue(
          getErrorState(this.id, "unavailable", [
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
          getErrorState(this.id, "unauthorized", [
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
    let errors: SubscriptionErrorIssue[] = [];
    let errorType: SubscriptionError["type"] = "unavailable";

    if (this.childErrors.size === 0) {
      return undefined;
    }

    for (const value of this.childErrors.values()) {
      errorType = value.type;
      if (value.issues) {
        errors.push(...value.issues);
      }
    }

    if (errors.length > 0) {
      return getErrorState(this.id, errorType, errors);
    }

    return getErrorState(this.id, errorType, []);
  }

  handleChildUpdate = (
    key: string,
    value: SubscriptionValue<any, any> | Unloaded,
  ) => {
    if (value.type === "unloaded") {
      return;
    }

    this.childValues.set(key, value);

    if (value.type === "unavailable" || value.type === "unauthorized") {
      const error = value;
      this.childErrors.set(key, error);

      if (error.issues) {
        error.issues.forEach((issue) => {
          issue.path.unshift(key);
        });
      }

      this.errorFromChildren = this.computeChildErrors();
    } else if (this.errorFromChildren && this.childErrors.has(key)) {
      this.childErrors.delete(key);

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
      if (value.type === "unloaded") {
        return false;
      }
    }

    return true;
  }

  triggerUpdate() {
    if (!this.shouldSendUpdates()) return;
    if (!this.dirty) return;
    if (!this.listener) return;

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
      this.resolve = { [key]: true };
      this.loadChildren();
      return;
    }

    if (this.resolve.$each || key in this.resolve) {
      return;
    }

    this.resolve[key as keyof typeof this.resolve] = true;

    this.loadChildren();
  }

  subscribeToId(id: string, descriptor: RefEncoded<any>) {
    if (this.idsSubscribed.has(id)) {
      return;
    }

    this.idsSubscribed.add(id);

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
    const { node, resolve } = this;

    if (this.value.type !== "loaded") {
      return false;
    }

    const value = this.value.value;
    const raw = value._raw;

    if (raw === undefined) {
      throw new Error("RefNode is not initialized");
    }

    const depth =
      typeof resolve !== "object" || resolve === null ? {} : (resolve as any);

    let hasChanged = false;

    const idsToLoad = new Set<string>(this.idsSubscribed);
    const childrenToLoad = new Map<
      string,
      {
        query: RefsToResolve<any>;
        descriptor: RefEncoded<any>;
      }
    >();

    const coValueType = value._type;
    let errorsFound = false;

    // TODO: Phase 1: Abstract the depth -> subscription
    //    Track all the subscribed keys in depth
    //    Navigate the depth tree, collect descriptor, errors and ids

    // Subscription tracking is by key
    // Nodes is by id

    // Track all the ids that are not part of the subscriptions anymore

    if (Object.keys(depth).length > 0) {
      if (
        coValueType === "CoMap" ||
        coValueType === "Group" ||
        coValueType === "Account"
      ) {
        const map = value as CoMap;
        const keys = "$each" in depth ? map._raw.keys() : Object.keys(depth);

        for (const key of keys) {
          const id = map._raw.get(key) as string | undefined;
          const descriptor = map.getDescriptor(key);

          if (!descriptor || !isRefEncoded(descriptor)) {
            this.childErrors.set(
              key,
              getErrorState(undefined, "unavailable", [
                {
                  code: "validationError",
                  message: `The ref ${key} requested on ${map.constructor.name} is not defined in the schema`,
                  params: {},
                  path: [key],
                },
              ]),
            );
          } else if (id) {
            idsToLoad.add(id);
            childrenToLoad.set(id, {
              query: depth[key] ?? depth.$each,
              descriptor,
            });
          } else if (!descriptor.optional) {
            this.childErrors.set(
              key,
              getErrorState(undefined, "unavailable", [
                {
                  code: "validationError",
                  message: `The ref ${key} requested on ${map.constructor.name} is missing`,
                  params: {},
                  path: [key],
                },
              ]),
            );
            errorsFound = true;
          }
        }
      } else if (value._type === "CoList") {
        const list = value as CoList;
        const entries = list._raw.entries();
        const keys =
          "$each" in depth ? Object.keys(entries) : Object.keys(depth);
        const descriptor = list.getItemsDescriptor();

        if (!descriptor || !isRefEncoded(descriptor)) {
          // The list doesn't have ref items
          // TODO: do not early return here, we should still load the stream
          return false;
        }

        for (const key of keys) {
          const entry = entries[Number(key)];

          if (!entry) {
            continue;
          }

          const id = entry.value as string | undefined;

          if (id) {
            idsToLoad.add(id);
            childrenToLoad.set(id, {
              query: depth[key] ?? depth.$each,
              descriptor,
            });
          } else if (!descriptor.optional) {
            this.childErrors.set(
              key,
              getErrorState(undefined, "unavailable", [
                {
                  code: "validationError",
                  message: `The ref on position ${key} requested on ${list.constructor.name} is missing`,
                  params: {},
                  path: [key],
                },
              ]),
            );
          }
        }
      } else if (value._type === "CoStream") {
        const stream = value as CoFeed;
        const descriptor = stream.getItemsDescriptor();

        if (!descriptor || !isRefEncoded(descriptor)) {
          // The stream doesn't have ref items
          // TODO: do not early return here, we should still load the stream
          return false;
        }

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
              childrenToLoad.set(id, {
                query: depth[key] ?? depth.$each,
                descriptor,
              });
            } else if (!descriptor.optional) {
              this.childErrors.set(
                key,
                getErrorState(undefined, "unavailable", [
                  {
                    code: "validationError",
                    message: `The ref on position ${key} requested on ${stream.constructor.name} is missing`,
                    params: {},
                    path: [key],
                  },
                ]),
              );
              errorsFound = true;
            }
          }
        }
      }
    }

    if (errorsFound) {
      this.errorFromChildren = this.computeChildErrors();
    }

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

    // Create all the new nodes
    const newNodes = new Map<string, CoValueResolutionNode<any>>();

    for (const [id, { query, descriptor }] of childrenToLoad) {
      if (this.childNodes.has(id)) {
        continue;
      }

      hasChanged = true;

      this.childValues.set(id, { type: "unloaded", id });
      const child = new CoValueResolutionNode(
        node,
        query,
        id as ID<any>,
        descriptor,
      );
      this.childNodes.set(id, child);
      newNodes.set(id, child);
    }

    // Adding listeners after that all the child nodes are created
    // to resolving the loaded state too early beacause setListener
    // may invoke syncrounously invoke the listener if the child is already loaded
    for (const [key, child] of newNodes) {
      child.setListener((value) => this.handleChildUpdate(key, value));
    }

    return hasChanged;
  }

  destroy() {
    this.subscription.unsubscribe();
    this.childNodes.forEach((child) => child.destroy());
  }
}
