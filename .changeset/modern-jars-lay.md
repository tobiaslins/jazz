---
"jazz-svelte": patch
---

Fix compat with the new Zod schema. 

BREAKING: Remove RegisterAccount, the useCoState, useAccount and useAccountOrGuest hooks and now AccountCoState requires the schema param
