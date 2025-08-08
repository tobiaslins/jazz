---
"jazz-tools": patch
"cojson": patch
---

Makes the key rotation not fail when child groups are unavailable or their readkey is not accessible.

Also changes the Group.removeMember method to not return a Promise, because:
- All the locally available child groups are rotated immediately
- All the remote child groups are rotated in background, but since they are not locally available the user won't need the new key immediately
