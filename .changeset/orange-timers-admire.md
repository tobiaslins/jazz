---
"jazz-tools": minor
"jazz-betterauth-server-plugin": patch
"chat-svelte": patch
"jazz-run": patch
---

Introduce a cleaner separation between Zod and CoValue schemas:
- Zod schemas and CoValue schemas are fully separated. Zod schemas can only be composed with other Zod schemas. CoValue schemas can be composed with either Zod or other CoValue schemas.
- `z.optional()` and `z.discriminatedUnion()` no longer work with CoValue schemas. Use `co.optional()` and `co.discriminatedUnion()` instead.
- Internal schema access is now simpler. You no longer need to use Zod’s `.def` to access internals. Use properties like `CoMapSchema.shape`, `CoListSchema.element`, and `CoOptionalSchema.innerType` directly.
- CoValue schema types are now namespaced under `co.`. Non-namespaced exports have been removed
- CoMap schemas no longer incorrectly inherit from Zod. Previously, methods like `.extend()` and `.partial()` appeared available but could cause unexpected behavior. These methods are now disabled. In their place, `.optional()` has been added, and more Zod-like methods will be introduced in future releases.
- Upgraded Zod from `3.25.28` to `3.25.76`.
- Removed deprecated `withHelpers` method from CoValue schemas
- Removed deprecated `createCoValueObservable` function 
