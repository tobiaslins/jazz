import type {
    Account,
    AccountClass,
    AnyAccountSchema,
    CoValueFromRaw,
    CoValueOrZodSchema,
    InstanceOfSchema,
    Loaded,
    ResolveQuery,
    ResolveQueryStrict,
  } from "jazz-tools";
  import { getJazzContext } from "./jazz.svelte.js";
  import { anySchemaToCoSchema, subscribeToCoValue } from "jazz-tools";
  
  export class CoState<
    V extends CoValueOrZodSchema,
    R extends ResolveQuery<V> = true,
  > {
    #value: Loaded<V, R> | undefined | null = undefined;
    #ctx = $derived(getJazzContext<InstanceOfSchema<AccountClass<Account>>>());
    #Schema: V;
    #options: { resolve?: ResolveQueryStrict<V, R> } | undefined;
    #id: string | undefined | null;
  
    constructor(
      Schema: V,
      id: string | undefined | null | (() => string | undefined | null),
      options?: { resolve?: ResolveQueryStrict<V, R> },
    ) {
      this.#Schema = Schema;
      this.#options = options;
  
      // Using an effect to react to the id and ctx changes
      $effect.pre(() => {
        this.#id = typeof id === "function" ? id() : id;

        return this.subscribeTo();
      });
    }
  
    subscribeTo() {
      const ctx = this.#ctx;
      const id = this.#id;
  
      // Reset state when dependencies change
      this.updateValue(undefined);
  
      if (!ctx.current || !id) return () => {};
  
      const agent = "me" in ctx.current ? ctx.current.me : ctx.current.guest;
  
      // Setup subscription with current values
      return subscribeToCoValue(
        anySchemaToCoSchema(this.#Schema),
        id,
        {
          // @ts-expect-error The resolve query type isn't compatible with the anySchemaToCoSchema conversion
          resolve: this.#options?.resolve,
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
          this.updateValue(value as Loaded<V, R>);
        },
      );
    }
  
    updateValue(value: Loaded<V, R> | undefined | null) {
      if (value !== this.#value) {
        this.#value = value;
        this.#triggerUpdate();
      }
    }

    #version = $state(0);
    #versionValue = 0
    #triggerUpdate() {
      this.#versionValue++;
      this.#version = this.#versionValue;
    }
  
    get current() {
      // Reading the #version value to trigger the reactivity
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.#version;

      return this.#value;
    }
  }
  
  export class AccountCoState<
    A extends
      | (AccountClass<Account> & CoValueFromRaw<Account>)
      | AnyAccountSchema,
    R extends ResolveQuery<A> = true,
  > {
    #value: Loaded<A, R> | undefined | null = undefined;
    #ctx = $derived(getJazzContext<InstanceOfSchema<A>>());
    #Schema: A;
    #unsubscribe: VoidFunction = () => {};
    #options: { resolve?: ResolveQueryStrict<A, R> } | undefined;
  
    constructor(Schema: A, options?: { resolve?: ResolveQueryStrict<A, R> }) {
      this.#Schema = Schema;
      this.#options = options;
  
      // Using an effect to react to the ctx changes
      $effect.pre(() => {
        return this.subscribeTo();
      });
    }
  
    subscribeTo() {
      const ctx = this.#ctx;
  
      // Reset state when dependencies change
      this.updateValue(undefined);
      this.#unsubscribe();
  
      if (!ctx.current) return;
      if (!("me" in ctx.current)) return;

      const me = ctx.current.me;
  
      // Setup subscription with current values
      return subscribeToCoValue(
        anySchemaToCoSchema(this.#Schema),
        me.id,
        {
          // @ts-expect-error The resolve query type isn't compatible with the anySchemaToCoSchema conversion
          resolve: this.#options?.resolve,
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
          this.updateValue(value as Loaded<A, R>);
        },
      );
    }
  
    logOut = () => {
      this.#ctx.current?.logOut();
    };
  
    updateValue(value: Loaded<A, R> | undefined | null) {
      if (value !== this.#value) {
        this.#value = value;
        this.#triggerUpdate();
      }
    }


    #version = $state(0);
    #versionValue = 0
    #triggerUpdate() {
      this.#versionValue++;
      this.#version = this.#versionValue;
    }
  
    get current() {
      // Reading the #version value to trigger the reactivity
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.#version;
  
      return this.#value;
    }

    get agent() {
      if (!this.#ctx.current) {
        throw new Error("No context found");
      }

      return "me" in this.#ctx.current ? this.#ctx.current.me : this.#ctx.current.guest;
    }
  }
  