import React, {
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from "react";

import {
  Account,
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  DeeplyLoaded,
  DepthsIn,
  ID,
  InboxSender,
  JazzContextManager,
  JazzContextType,
  createCoValueObservable,
} from "jazz-tools";
import { JazzContext, JazzContextManagerContext } from "./provider.js";

export function useJazzContext<Acc extends Account>() {
  const value = useContext(JazzContext) as JazzContextType<Acc>;

  if (!value) {
    throw new Error(
      "You need to set up a JazzProvider on top of your app to use this hook.",
    );
  }

  return value;
}

export function useJazzContextManager<Acc extends Account>() {
  const value = useContext(JazzContextManagerContext) as JazzContextManager<
    Acc,
    {}
  >;

  if (!value) {
    throw new Error(
      "You need to set up a JazzProvider on top of your app to use this hook.",
    );
  }

  return value;
}

export function useAuthSecretStorage() {
  const value = useContext(JazzContextManagerContext);

  if (!value) {
    throw new Error(
      "You need to set up a JazzProvider on top of your app to use this useAuthSecretStorage.",
    );
  }

  return value.getAuthSecretStorage();
}

export function useIsAuthenticated() {
  const authSecretStorage = useAuthSecretStorage();

  return useSyncExternalStore(
    useCallback(
      (callback) => {
        return authSecretStorage.onUpdate(callback);
      },
      [authSecretStorage],
    ),
    () => authSecretStorage.isAuthenticated,
    () => authSecretStorage.isAuthenticated,
  );
}

export function useCoState<V extends CoValue, D>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Schema: CoValueClass<V>,
  id: ID<V> | undefined,
  depth: D & DepthsIn<V> = [] as D & DepthsIn<V>,
): DeeplyLoaded<V, D> | undefined | null {
  const context = useJazzContext();

  const [x] = React.useState(() =>
    createCoValueObservable({
      syncResolution: true,
    }),
  );
  const ref = useRef(x);

  const value = React.useSyncExternalStore<
    DeeplyLoaded<V, D> | undefined | null
  >(
    React.useCallback(
      (callback) => {
        if (!id) return () => {};

        const agent = "me" in context ? context.me : context.guest;

        ref.current = createCoValueObservable({
          syncResolution: true,
        });

        return ref.current.subscribe(Schema, id, agent, depth, callback, () => {
          console.log("unavailable");
          callback();
        });
      },
      [Schema, id, context],
    ),
    () => ref.current.getCurrentValue(),
    () => ref.current.getCurrentValue(),
  );

  return value;
}

export function createUseAccountHooks<Acc extends Account>() {
  function useAccount(): {
    me: Acc;
    logOut: () => void;
  };
  function useAccount<D extends DepthsIn<Acc>>(
    depth: D,
  ): { me: DeeplyLoaded<Acc, D> | undefined | null; logOut: () => void };
  function useAccount<D extends DepthsIn<Acc>>(
    depth?: D,
  ): { me: Acc | DeeplyLoaded<Acc, D> | undefined | null; logOut: () => void } {
    const context = useJazzContext<Acc>();
    const contextManager = useJazzContextManager<Acc>();

    if (!("me" in context)) {
      throw new Error(
        "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
      );
    }

    // const me = useCoState<Acc, D>(
    //   context.me.constructor as CoValueClass<Acc>,
    //   context.me.id,
    //   depth,
    // );

    const [x] = React.useState(() =>
      createCoValueObservable({
        syncResolution: true,
      }),
    );
    const ref = useRef(x);

    const me = React.useSyncExternalStore<
      DeeplyLoaded<Acc, D> | undefined | null
    >(
      React.useCallback(
        (callback) => {
          let unsub = () => {};

          const handler = () => {
            unsub();

            const context = contextManager.getCurrentValue();

            if (!context || !("me" in context)) {
              throw new Error(
                "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
              );
            }

            const agent = context.me;
            const Schema = context.me.constructor as CoValueClass<Acc>;
            const id = context.me.id;

            ref.current = createCoValueObservable({
              syncResolution: true,
            });

            unsub = ref.current.subscribe(
              Schema,
              id,
              agent,
              (depth as any) ?? [],
              () => {
                callback();
              },
              () => {
                callback();
              },
            );
          };

          handler();
          return contextManager.subscribe(handler);
        },
        [contextManager],
      ),
      () => ref.current.getCurrentValue(),
      () => ref.current.getCurrentValue(),
    );

    return {
      me: depth === undefined ? context.me : me,
      logOut: context.logOut,
    };
  }

  function useAccountOrGuest(): {
    me: Acc | AnonymousJazzAgent;
  };
  function useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth: D,
  ): { me: DeeplyLoaded<Acc, D> | undefined | null | AnonymousJazzAgent };
  function useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth?: D,
  ): {
    me: Acc | DeeplyLoaded<Acc, D> | undefined | null | AnonymousJazzAgent;
  } {
    const context = useJazzContext<Acc>();

    const contextMe = "me" in context ? context.me : undefined;
    const AccountSchema = contextMe?.constructor ?? Account;

    const me = useCoState<Acc, D>(
      AccountSchema as CoValueClass<Acc>,
      contextMe?.id,
      depth,
    );

    if ("me" in context) {
      return {
        me: depth === undefined ? me || context.me : me,
      };
    } else {
      return { me: context.guest };
    }
  }

  return {
    useAccount,
    useAccountOrGuest,
  };
}

export function experimental_useInboxSender<
  I extends CoValue,
  O extends CoValue | undefined,
>(inboxOwnerID: ID<Account> | undefined) {
  const context = useJazzContext();

  if (!("me" in context)) {
    throw new Error(
      "useInboxSender can't be used in a JazzProvider with auth === 'guest'.",
    );
  }

  const me = context.me;
  const inboxRef = useRef<Promise<InboxSender<I, O>> | undefined>(undefined);

  const sendMessage = useCallback(
    async (message: I) => {
      if (!inboxOwnerID) throw new Error("Inbox owner ID is required");

      if (!inboxRef.current) {
        const inbox = InboxSender.load<I, O>(inboxOwnerID, me);
        inboxRef.current = inbox;
      }

      let inbox = await inboxRef.current;

      // @ts-expect-error inbox.owner.id is typed as RawAccount id
      if (inbox.owner.id !== inboxOwnerID) {
        const req = InboxSender.load<I, O>(inboxOwnerID, me);
        inboxRef.current = req;
        inbox = await req;
      }

      return inbox.sendMessage(message);
    },
    [inboxOwnerID],
  );

  return sendMessage;
}
