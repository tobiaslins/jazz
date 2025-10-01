<script lang="ts">
  import { JazzSvelteProvider } from "jazz-tools/svelte";
  import { apiKey } from "$lib/apiKey";

  let { children } = $props();
  const sync = { peer: `wss://cloud.jazz.tools/?key=${apiKey}` };
</script>

<JazzSvelteProvider {sync} enableSSR>
  <main class="container" style="margin-top: 2rem;">
    {@render children?.()}
  </main>
</JazzSvelteProvider>
