<script lang="ts">
  import { AccountCoState, InviteListener } from "jazz-tools/svelte";
  import { JazzAccount, Organization } from "./schema";

  const me = new AccountCoState(JazzAccount, {
    resolve: { root: { organizations: { $each: { $onError: "catch" } } } },
  })

  const listener = new InviteListener({ invitedObjectSchema: Organization, onAccept });

  async function onAccept (organizationId: string) {
    if (!me.current.$isLoaded) return;
    const organization = await Organization.load(organizationId)
    if (organization) {
      // avoid duplicates
      const ids = me.current.root.organizations.map(
        (organization) => organization.$jazz.id,
      );
      if (ids.includes(organizationId)) return;
      me.current.root.organizations.$jazz.push(organization);
    }
  }
</script>

<p>Accepting invite...</p>
