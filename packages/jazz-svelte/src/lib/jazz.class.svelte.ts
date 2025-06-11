import type {
	Account,
	AccountClass,
	AnyAccountSchema,
	CoValueFromRaw,
	CoValueOrZodSchema,
	InstanceOfSchema,
	Loaded,
	ResolveQuery,
	ResolveQueryStrict
} from 'jazz-tools';
import { createSubscriber } from 'svelte/reactivity';
import { getJazzContext } from './jazz.svelte';
import { anySchemaToCoSchema, subscribeToCoValue } from 'jazz-tools';
import { useIsAuthenticated } from './auth/useIsAuthenticated.svelte.js';

export class CoState<V extends CoValueOrZodSchema, R extends ResolveQuery<V> = true> {
	#value: Loaded<V, R> | undefined | null = undefined;
	#ctx = getJazzContext<InstanceOfSchema<AccountClass<Account>>>();
	#id: string | undefined | null;
	#subscribe: () => void;

	constructor(
		Schema: V,
		id: string | undefined | null | (() => string | undefined | null),
		options?: { resolve?: ResolveQueryStrict<V, R> }
	) {
		this.#id = $derived.by(typeof id === 'function' ? id : () => id);

		this.#subscribe = createSubscriber(update => {
			return $effect.root(() => {
				$effect.pre(() => {
					const ctx = this.#ctx.current;
					const id = this.#id;

					if (!ctx || !id) return update();
					const agent = 'me' in ctx ? ctx.me : ctx.guest;

					const unsubscribe = subscribeToCoValue(
						anySchemaToCoSchema(Schema),
						id,
						{
							// @ts-expect-error The resolve query type isn't compatible with the anySchemaToCoSchema conversion
							resolve: options?.resolve,
							loadAs: agent,
							onUnavailable: () => {
								this.#value = null;
								update();
							},
							onUnauthorized: () => {
								this.#value = null;
								update();
							},
							syncResolution: true
						},
						value => {
							if (value === this.#value) return;
							this.#value = value as Loaded<V, R>;
							update();
						}
					);
					return () => {
						unsubscribe();
						this.#value = undefined;
					};
				});
			});
		});

		$effect.pre(() => {
			this.#subscribe();
		})
	}

	get current() {
		this.#subscribe();
		return this.#value;
	}
}

export class AccountCoState<
	A extends (AccountClass<Account> & CoValueFromRaw<Account>) | AnyAccountSchema,
	R extends ResolveQuery<A> = true
> {
	#value: Loaded<A, R> | undefined | null = undefined;
	#ctx = getJazzContext<InstanceOfSchema<A>>();
	#subscribe: () => void;

	constructor(Schema: A, options?: { resolve?: ResolveQueryStrict<A, R> }) {
		this.#subscribe = createSubscriber(update => {
			return $effect.root(() => {
				$effect.pre(() => {
					const ctx = this.#ctx.current;

					if (!ctx || !('me' in ctx)) return update();

					const me = ctx.me;

					const unsubscribe = subscribeToCoValue(
						anySchemaToCoSchema(Schema),
						me.id,
						{
							// @ts-expect-error The resolve query type isn't compatible with the anySchemaToCoSchema conversion
							resolve: options?.resolve,
							loadAs: me,
							onUnavailable: () => {
								this.#value = null;
								update();
							},
							onUnauthorized: () => {
								this.#value = null;
								update();
							},
							syncResolution: true
						},
						value => {
							if (value === this.#value) return;
							this.#value = value as Loaded<A, R>;
							update();
						}
					);

					return () => {
						unsubscribe();
						this.#value = undefined;
					};
				});
			});
		});

		$effect.pre(() => {
			this.#subscribe();
		})
	}

	logOut = () => {
		this.#ctx.current?.logOut();
	};

	get current() {
		this.#subscribe();

		return this.#value;
	}

	get agent() {
		if (!this.#ctx.current) {
			throw new Error('No context found');
		}

		return 'me' in this.#ctx.current ? this.#ctx.current.me : this.#ctx.current.guest;
	}

	#isAuthenticated = useIsAuthenticated();

	get isAuthenticated() {
		return this.#isAuthenticated.current;
	}
}
