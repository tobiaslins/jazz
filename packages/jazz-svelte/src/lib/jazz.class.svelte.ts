import type { Account, CoValue, CoValueClass, ID, RefsToResolve, RefsToResolveStrict, RegisteredAccount, Resolved } from "jazz-tools";
import { createSubscriber } from "svelte/reactivity";
import { getJazzContext } from "./jazz.svelte.js";
import { subscribeToCoValue } from "jazz-tools";

export class CoState<V extends CoValue, R extends RefsToResolve<V> = true> {
    #value: Resolved<V, R> | undefined | null = undefined;
    #subscribe: VoidFunction;
    #ctx = $derived(getJazzContext<RegisteredAccount>());
    #version = $state(0);

    constructor(
        Schema: CoValueClass<V>,
        id: ID<CoValue> | undefined | null | (() => ID<CoValue>),
        options?: { resolve?: RefsToResolveStrict<V, R> }
    ) {
        this.#subscribe = createSubscriber(() => {
            // Reset state when dependencies change
            this.updateValue(undefined);

            // Return early if no context or id, effectively cleaning up any previous subscription
            if (!this.#ctx?.current || !id) return;

            const agent = "me" in this.#ctx.current ? this.#ctx.current.me : this.#ctx.current.guest;

            // Setup subscription with current values
            return subscribeToCoValue<V, R>(
                Schema,
                id,
                {
                    resolve: options?.resolve,
                    loadAs: agent,
                    onUnavailable: () => {
                        this.updateValue(null);
                    },
                    onUnauthorized: () => {
                        this.updateValue(null);
                    },
                    syncResolution: true,
                },
                (value) => {
                    this.updateValue(value as Resolved<V, R>);
                },
            );
        });
    }

    updateValue(value: Resolved<V, R> | undefined | null) {
        if (value !== this.#value) {
            this.#value = value;
            this.#version++;
        }
    }

    get current() {
        this.#subscribe();

        // Accessing the version state to subscribe to it's state
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.#version;

        return this.#value;
    }
}

export class AccountCoState<A extends Account = RegisteredAccount, R extends RefsToResolve<A> = true> {
    #value: Resolved<A, R> | undefined | null = undefined;
    #version = $state(0);
    #subscribe: VoidFunction;
    #ctx = $derived(getJazzContext<A>());

    constructor(
        options?: { resolve?: RefsToResolveStrict<A, R> }
    ) {
        this.#subscribe = createSubscriber(() => {
            // Reset state when dependencies change
            this.updateValue(undefined);

            // Return early if no context or id, effectively cleaning up any previous subscription
            if (!this.#ctx?.current) return;

            if (!('me' in this.#ctx.current)) {
                throw new Error(
                    "useAccount can't be used in a JazzProvider with auth === 'guest' - consider using useAccountOrGuest()"
                );
            }

            const me = this.#ctx.current.me;

            // Setup subscription with current values
            return subscribeToCoValue<A, R>(
                me.constructor as CoValueClass<A>,
                me.id,
                {
                    resolve: options?.resolve,
                    loadAs: me,
                    onUnavailable: () => {
                        this.updateValue(null);
                    },
                    onUnauthorized: () => {
                        this.updateValue(null);
                    },
                    syncResolution: true,
                },
                (value) => {
                    this.updateValue(value as Resolved<A, R>);
                },
            );
        });
    }

    logOut = () => {
      this.#ctx.current?.logOut();
    }

    updateValue(value: Resolved<A, R> | undefined | null) {
        if (value !== this.#value) {
            this.#value = value;
            this.#version++;
        }
    }

    get current() {
        this.#subscribe();

        // Accessing the version state to subscribe to it's state
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.#version;

        return this.#value;
    }
}
