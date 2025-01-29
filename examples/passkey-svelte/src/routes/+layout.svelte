<script lang="ts">
  import { JazzProvider, PasskeyAuthBasicUI } from 'jazz-svelte';

  let { children } = $props();
</script>

<JazzProvider peer="wss://cloud.jazz.tools/?key=minimal-svelte-auth-passkey@garden.co">
  <PasskeyAuthBasicUI appName="minimal-svelte-auth-passkey">
    {@render children?.()}
  </PasskeyAuthBasicUI>
</JazzProvider>

<style>
  :global(html, body) {
    margin: 0;
  }
</style>
