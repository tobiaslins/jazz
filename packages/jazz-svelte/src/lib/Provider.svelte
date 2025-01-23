<script lang="ts" module>
  export type Props<Acc extends Account = Account> = {
    children?: Snippet;
    guestMode?: boolean;
    localOnly?: 'always' | 'anonymous' | 'off';
    peer: `wss://${string}` | `ws://${string}`;
    storage?: 'indexedDB' | 'singleTabOPFS';
    AccountSchema?: AccountClass<Acc>;
    defaultProfileName?: string;
  };
</script>

<script lang="ts" generics="Acc extends Account">
  import { JazzContextManager } from 'jazz-browser';
  import type { AccountClass } from 'jazz-tools';
  import { Account } from 'jazz-tools';
  import { type Snippet, setContext, untrack } from 'svelte';
  import { JAZZ_CTX, type JazzContext } from './jazz.svelte.js';
  import { useIsAnonymousUser } from './auth/useAnonymousUser.svelte.js';

  let props: Props<Acc> = $props();

  const contextManager = new JazzContextManager<Acc>();

  const ctx = $state<JazzContext<Acc>>({ current: undefined });
  setContext<JazzContext<Acc>>(JAZZ_CTX, ctx);

  const isAnonymousUser = useIsAnonymousUser();
  const localOnly = $derived(
    props.localOnly === 'anonymous' ? isAnonymousUser.value : props.localOnly === 'always'
  );

  $effect(() => {
    props.peer;
    props.storage;
    props.guestMode;
    return untrack(() => {
      if (!props.peer) return;

      contextManager
        .createContext({
          peer: props.peer,
          storage: props.storage,
          guestMode: props.guestMode,
          AccountSchema: props.AccountSchema,
          localOnly: localOnly,
          defaultProfileName: props.defaultProfileName
        })
        .catch((error) => {
          console.error('Error creating Jazz browser context:', error);
        });
    });
  });

  $effect(() => {
    contextManager.toggleNetwork(!localOnly);
  });

  $effect(() => {
    return contextManager.subscribe(() => {
      ctx.current = contextManager.getCurrentValue();
    });
  });
</script>

{#if ctx.current}
  {@render props.children?.()}
{/if}
