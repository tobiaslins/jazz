<script lang="ts">
  import 'jazz-tools/inspector/register-custom-element';

  import '../app.css';
  import { JazzProvider } from 'jazz-tools/svelte';
  import { apiKey } from '../apiKey';
  import { getRandomUsername } from '$lib/utils';
  let { children } = $props();
  const defaultProfileName = getRandomUsername();
</script>

<svelte:head>
  <title>Jazz Chat Example</title>
</svelte:head>

<div class="h-full bg-white text-stone-700 dark:text-stone-400 dark:bg-stone-925">
  <JazzProvider
    sync={{
      peer: `wss://cloud.jazz.tools/?key=${apiKey}`
    }}
    {defaultProfileName}
  >
    {@render children?.()}
  </JazzProvider>
  <jazz-inspector></jazz-inspector>
</div>

<style>
  :global(html, body) {
    margin: 0;
  }
</style>
