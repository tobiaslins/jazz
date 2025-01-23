<script lang="ts">
  import { JazzProvider, PasskeyAuthBasicUI, usePasskeyAuth } from 'jazz-svelte';

  let { children } = $props();
</script>

<JazzProvider peer="wss://cloud.jazz.tools/?key=minimal-svelte-auth-passkey@garden.co">
  <PasskeyAuthBasicUI auth={usePasskeyAuth({ appName: 'minimal-svelte-auth-passkey' })}>
    {@render children?.()}
  </PasskeyAuthBasicUI>
</JazzProvider>

<style>
  :global(html, body) {
    margin: 0;
  }
</style>
