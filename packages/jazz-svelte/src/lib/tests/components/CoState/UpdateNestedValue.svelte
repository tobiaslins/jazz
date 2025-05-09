<script lang="ts" module>
  export type Props = {
    id: ID<Person>;
  };
</script>

<script lang="ts">
  import { CoState } from '../../../jazz.class.svelte.js';

  import { type ID } from 'jazz-tools';
  import { Person } from './schema.js';

  let props: Props = $props();

  const person = $derived(
    new CoState(Person, props.id, {
      resolve: {
        dog: true
      }
    })
  );
</script>

<!-- Using non-null assertions because we want to test that locally available values are never null -->
<label>
  Name
  <input type="text" bind:value={person.current!.name} />
</label>

<label>
  Dog
  <input type="text" bind:value={person.current!.dog.name} />
</label>

<div data-testid="person-name">{person.current!.name}</div>
<div data-testid="person-dog-name">{person.current!.dog.name}</div>
