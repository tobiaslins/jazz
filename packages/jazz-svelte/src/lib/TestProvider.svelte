<script lang="ts" module>
  export type Props<Acc extends Account = Account> = {
    children?: Snippet;
    account: Acc | { guest: AnonymousJazzAgent };
  };
</script>

<script lang="ts" generics="Acc extends Account">
  import type { AnonymousJazzAgent } from 'jazz-tools';
  import { Account } from 'jazz-tools';
  import { type Snippet, setContext } from 'svelte';
  import { JAZZ_CTX, type JazzContext } from './jazz.svelte.js';

  let { children, account }: Props<Acc> = $props();

  $effect(() => {
    if ('guest' in account) {
      setContext<JazzContext<Acc>>(JAZZ_CTX, {
        current: {
          guest: account.guest,
          logOut: () => account.guest.node.gracefulShutdown(),
          done: () => account.guest.node.gracefulShutdown()
        }
      });
    } else {
      setContext<JazzContext<Acc>>(JAZZ_CTX, {
        current: {
          me: account,
          logOut: () => account._raw.core.node.gracefulShutdown(),
          done: () => account._raw.core.node.gracefulShutdown()
        }
      });
    }
  });

</script>

{@render children?.()}
