import { consumeInviteLinkFromWindowLocation } from "jazz-browser";
import React, { useCallback, useEffect, useRef } from "react";

import {
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  DeeplyLoaded,
  DepthsIn,
  ID,
  InboxSender,
  createCoValueObservable,
} from "jazz-tools";
import { JazzContext, JazzContextType, RegisteredAccount } from "./provider.js";

function useJazzContext<Acc extends RegisteredAccount>() {
  const value = React.useContext(JazzContext) as JazzContextType<Acc>;

  if (!value) {
    throw new Error(
      "You need to set up a JazzProvider on top of your app to use this hook.",
    );
  }

  return value;
}

export function useCoState<V extends CoValue, D>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Schema: CoValueClass<V>,
  id: ID<V> | undefined,
  depth: D & DepthsIn<V> = [] as D & DepthsIn<V>,
): DeeplyLoaded<V, D> | undefined {
  const context = useJazzContext();

  const [observable] = React.useState(() =>
    createCoValueObservable({
      syncResolution: true,
    }),
  );

  const value = React.useSyncExternalStore<DeeplyLoaded<V, D> | undefined>(
    React.useCallback(
      (callback) => {
        if (!id) return () => {};

        const agent = "me" in context ? context.me : context.guest;

        return observable.subscribe(Schema, id, agent, depth, callback);
      },
      [Schema, id, context],
    ),
    () => observable.getCurrentValue(),
    () => observable.getCurrentValue(),
  );

  return value;
}

export function useAccount<Acc extends RegisteredAccount>(): {
  me: Acc;
  logOut: () => void;
};
export function useAccount<
  Acc extends RegisteredAccount,
  D extends DepthsIn<Acc>,
>(depth: D): { me: DeeplyLoaded<Acc, D> | undefined; logOut: () => void };
export function useAccount<
  Acc extends RegisteredAccount,
  D extends DepthsIn<Acc>,
>(
  depth?: D,
): { me: Acc | DeeplyLoaded<Acc, D> | undefined; logOut: () => void } {
  const context = useJazzContext<Acc>();

  if (!("me" in context)) {
    throw new Error(
      "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()",
    );
  }

  const me = useCoState<Acc, D>(context.AccountSchema, context.me.id, depth);

  return {
    me: depth === undefined ? me || context.me : me,
    logOut: context.logOut,
  };
}

export function useAccountOrGuest<Acc extends RegisteredAccount>(): {
  me: Acc | AnonymousJazzAgent;
};
export function useAccountOrGuest<
  Acc extends RegisteredAccount,
  D extends DepthsIn<Acc>,
>(depth: D): { me: DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent };
export function useAccountOrGuest<
  Acc extends RegisteredAccount,
  D extends DepthsIn<Acc>,
>(
  depth?: D,
): { me: Acc | DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent } {
  const context = useJazzContext<Acc>();

  const contextMe = "me" in context ? context.me : undefined;

  const me = useCoState<Acc, D>(context.AccountSchema, contextMe?.id, depth);

  if ("me" in context) {
    return {
      me: depth === undefined ? me || context.me : me,
    };
  } else {
    return { me: context.guest };
  }
}

export function useAcceptInvite<V extends CoValue>({
  invitedObjectSchema,
  onAccept,
  forValueHint,
}: {
  invitedObjectSchema: CoValueClass<V>;
  onAccept: (projectID: ID<V>) => void;
  forValueHint?: string;
}): void {
  const context = useJazzContext();

  if (!("me" in context)) {
    throw new Error(
      "useAcceptInvite can't be used in a JazzProvider with auth === 'guest'.",
    );
  }

  useEffect(() => {
    const handleInvite = () => {
      const result = consumeInviteLinkFromWindowLocation({
        as: context.me,
        invitedObjectSchema,
        forValueHint,
      });

      result
        .then((result) => result && onAccept(result?.valueID))
        .catch((e) => {
          console.error("Failed to accept invite", e);
        });
    };

    handleInvite();

    window.addEventListener("hashchange", handleInvite);

    return () => window.removeEventListener("hashchange", handleInvite);
  }, [onAccept]);
}

export function experimental_useInboxSender<
  I extends CoValue,
  O extends CoValue | undefined,
>(inboxOwnerID: ID<RegisteredAccount> | undefined) {
  const me = useAccount().me;
  const inboxRef = useRef<Promise<InboxSender<I, O>> | undefined>();

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
