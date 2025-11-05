---
"community-jazz-vue": minor
"jazz-webhook": minor
"jazz-tools": minor
"jazz-run": minor
"jazz-tools-codemod-0-18": patch
"svelte-passkey-auth": patch
"jazz-react-passkey-auth-starter": patch
"jazz-sveltekit": patch
"chat-svelte": patch
---

Add explicit CoValue loading states:
- Add `$isLoaded` field to discriminate between loaded and unloaded CoValues
- Add `$jazz.loadingState` field to provide additional info about the loading state
- All methods and functions that load CoValues now return a `MaybeLoaded<CoValue>` instead of `CoValue | null | undefined`
- Rename `$onError: null` to `$onError: "catch"`
- Split the `useAccount` hook into three separate hooks:
  - `useAccount`: now only returns an Account CoValue
  - `useLogOut`: returns a function for logging out of the current account
  - `useAgent`: returns the current agent
- Add a `select` option (and an optional `equalityFn`) to `useAccount` and `useCoState`, and remove `useAccountWithSelector` and `useCoStateWithSelector`.
- Allow specifying resolve queries at the schema level. Those queries will be used when loading CoValues, if no other resolve query is provided.
