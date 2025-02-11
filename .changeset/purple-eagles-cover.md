---
"jazz-nodejs": minor
---

Remove ws dependency to use native WebSocket. 

NodeJS versions prior to v22 will need to provide a WebSocket constructor from ws:

```ts
import { WebSocket } from "ws"

const { worker } = await startWorker({ WebSocket, synServer });
```

This makes it easier to run workers on every JS runtime.
