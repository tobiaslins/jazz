---
"jazz-tools": patch
---

Streamlined CoValue creation:
- CoValues can be created with plain JSON objects. Nested CoValues will be automatically created when necessary.
- Optional fields can be ommited (i.e. it's no longer necessary to provide an explicit `undefined` value).
