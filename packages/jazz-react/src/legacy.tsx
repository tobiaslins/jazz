import { BaseBrowserContextOptions } from "jazz-browser";
import React from "react";

import {
  Account,
  AccountClass,
  AnonymousJazzAgent,
  AuthMethod,
  CoValue,
  CoValueClass,
  DeeplyLoaded,
  DepthsIn,
  ID,
} from "jazz-tools";
import {
  experimental_useInboxSender,
  useAcceptInvite,
  useAccount,
  useAccountOrGuest,
  useCoState,
} from "./hooks.js";
import {
  JazzProvider,
  JazzProviderProps,
  RegisteredAccount,
} from "./provider.js";

/** @deprecated use JazzProvider and top level hooks instead */
export function createJazzReactApp<Acc extends RegisteredAccount>(options?: {
  AccountSchema?: CoValueClass<Acc> & {
    fromNode: (typeof Account)["fromNode"];
    create: (typeof Account)["create"];
  };
}): JazzReactApp<Acc> {
  const { AccountSchema = Account as unknown as AccountClass<Acc> } =
    options ?? {};

  function Provider(props: Omit<JazzProviderProps<Acc>, "AccountSchema">) {
    return <JazzProvider {...props} AccountSchema={AccountSchema} />;
  }

  function _useAccount(): { me: Acc; logOut: () => void };
  function _useAccount<D extends DepthsIn<Acc>>(
    depth: D,
  ): { me: DeeplyLoaded<Acc, D> | undefined; logOut: () => void };
  function _useAccount<D extends DepthsIn<Acc>>(
    depth?: D,
  ): { me: Acc | DeeplyLoaded<Acc, D> | undefined; logOut: () => void } {
    if (depth === undefined) {
      return useAccount<Acc>();
    }

    return useAccount<Acc, D>(depth);
  }

  function _useAccountOrGuest(): { me: Acc | AnonymousJazzAgent };
  function _useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth: D,
  ): { me: DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent };
  function _useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth?: D,
  ): { me: Acc | DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent } {
    if (depth === undefined) {
      return useAccountOrGuest<Acc>();
    }

    return useAccountOrGuest<Acc, D>(depth);
  }

  return {
    Provider,
    useAccount: _useAccount,
    useAccountOrGuest: _useAccountOrGuest,
    useCoState,
    useAcceptInvite,
    experimental: {
      useInboxSender: experimental_useInboxSender,
    },
  };
}

/** @deprecated use JazzProvider and top level hooks instead */
export interface JazzReactApp<Acc extends RegisteredAccount> {
  /** @category Provider Component */
  Provider: React.FC<{
    children: React.ReactNode;
    auth: AuthMethod | "guest";
    peer: `wss://${string}` | `ws://${string}`;
    storage?: BaseBrowserContextOptions["storage"];
  }>;

  /** @category Hooks */
  useAccount(): {
    me: Acc;
    logOut: () => void;
  };
  /** @category Hooks */
  useAccount<D extends DepthsIn<Acc>>(
    depth: D,
  ): {
    me: DeeplyLoaded<Acc, D> | undefined;
    logOut: () => void;
  };

  /** @category Hooks */
  useAccountOrGuest(): {
    me: Acc | AnonymousJazzAgent;
  };
  useAccountOrGuest<D extends DepthsIn<Acc>>(
    depth: D,
  ): {
    me: DeeplyLoaded<Acc, D> | undefined | AnonymousJazzAgent;
  };
  /** @category Hooks */
  useCoState<V extends CoValue, D>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Schema: { new (...args: any[]): V } & CoValueClass,
    id: ID<V> | undefined,
    depth?: D & DepthsIn<V>,
  ): DeeplyLoaded<V, D> | undefined;

  /** @category Hooks */
  useAcceptInvite<V extends CoValue>({
    invitedObjectSchema,
    onAccept,
    forValueHint,
  }: {
    invitedObjectSchema: CoValueClass<V>;
    onAccept: (projectID: ID<V>) => void;
    forValueHint?: string;
  }): void;

  experimental: {
    useInboxSender<I extends CoValue, O extends CoValue | undefined>(
      inboxOwnerID: ID<Acc> | undefined,
    ): (message: I) => Promise<O extends CoValue ? ID<O> : undefined>;
  };
}
