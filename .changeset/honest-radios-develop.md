---
"cojson": patch
---

Stop new content processing until all the dependencies are available, preventing inconsistent statuses on sync.

This targets a bug that would show up only after we roll out the sync server sharding features.
