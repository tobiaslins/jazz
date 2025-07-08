---
"cojson": patch
---

- Refactored the Peer incoming/outgoing channels to be syncronous
- Changed the storage communication to work with an explicit API and removed the storage role on peers
- Added scheduling of the incoming messages using a round-robin over the peers and a timer to do collaborative scheduling with the event loop
- Added streamingTarget on the content messages to optimize content syncing with servers during streaming