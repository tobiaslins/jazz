<script lang="ts">
  import { InviteListener } from "jazz-tools/svelte";
  import { Organization } from "./schema";
  new InviteListener({
    invitedObjectSchema: Organization,
    onAccept: (organizationID) => {
      console.log("Accepted invite!")
      // navigate to the organization page
    },
  });
</script>
