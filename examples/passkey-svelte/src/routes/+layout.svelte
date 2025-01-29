<script lang="ts">
  import { JazzProvider, PasskeyAuthBasicUI } from 'jazz-svelte';

  let { children } = $props();
</script>

<JazzProvider
  sync={{
    peer: "wss://cloud.jazz.tools/?key=minimal-svelte-auth-passkey@garden.co",
    when: "signedUp",
  }}
>
  <PasskeyAuthBasicUI appName="minimal-svelte-auth-passkey">
    {@render children?.()}
  </PasskeyAuthBasicUI>
</JazzProvider>

<style>
  :global(html, body) {
    margin: 0;
  }
</style>
