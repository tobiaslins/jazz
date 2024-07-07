# cojson

## 0.7.17

### Patch Changes

-   Fix bugs in new storage interface

## 0.7.14

### Patch Changes

-   Use Effect Queues and Streams instead of custom queue implementation

## 0.7.11

### Patch Changes

-   Fix webpack import of node:crypto module

## 0.7.10

### Patch Changes

-   Also cache agent ID in RawControlledAccount

## 0.7.9

### Patch Changes

-   Cache currentAgentID in RawAccount

## 0.7.0

### Minor Changes

-   e299c3e: New simplified API

### Patch Changes

-   1a35307: WIP working-ish version of LSM storage
-   96c494f: Implement profile visibility based on groups & new migration signature
-   19f52b7: Fixed bug with newRandomSessionID being called before crypto was ready
-   d8fe2b1: Expose experimental OPFS storage
-   1200aae: CoJSON performance improvement
-   52675c9: Fix CoList.splice / RawCoList.append
-   1a35307: Optimizations for incoming sync messages
-   bf0f8ec: Fix noble curves dependency
-   c4151fc: Support stricter TS lint rules
-   8636319: Factor out implementation of crypto provider and provide pure JS implementation
-   952982e: Consistent proxy based API
-   21771c4: Reintroduce changes from main
-   69ac514: Use effect schema much less
-   f0f6f1b: Clean up API more & re-add jazz-nodejs
-   1a44f87: Refactoring
-   63374cc: Make sure delete on CoMaps deletes keys

## 0.7.0-alpha.42

### Patch Changes

-   Fixed bug with newRandomSessionID being called before crypto was ready

## 0.7.0-alpha.39

### Patch Changes

-   Fix noble curves dependency

## 0.7.0-alpha.38

### Patch Changes

-   Factor out implementation of crypto provider and provide pure JS implementation

## 0.7.0-alpha.37

### Patch Changes

-   Expose experimental OPFS storage

## 0.7.0-alpha.36

### Patch Changes

-   1a35307: WIP working-ish version of LSM storage
-   1a35307: Optimizations for incoming sync messages

## 0.7.0-alpha.35

### Patch Changes

-   CoJSON performance improvement

## 0.7.0-alpha.29

### Patch Changes

-   Reintroduce changes from main

## 0.7.0-alpha.28

### Patch Changes

-   Implement profile visibility based on groups & new migration signature

## 0.7.0-alpha.27

### Patch Changes

-   Fix CoList.splice / RawCoList.append

## 0.7.0-alpha.24

### Patch Changes

-   Make sure delete on CoMaps deletes keys

## 0.7.0-alpha.11

### Patch Changes

-   Support stricter TS lint rules

## 0.7.0-alpha.10

### Patch Changes

-   Clean up API more & re-add jazz-nodejs

## 0.7.0-alpha.7

### Patch Changes

-   Consistent proxy based API

## 0.7.0-alpha.5

### Patch Changes

-   Refactoring

## 0.7.0-alpha.1

### Patch Changes

-   Use effect schema much less

## 0.7.0-alpha.0

### Minor Changes

-   New simplified API

## 0.6.6

### Patch Changes

-   Fix migration changes being lost on loaded account

## 0.6.5

### Patch Changes

-   Fix loading of accounts

## 0.6.4

### Patch Changes

-   IndexedDB & timer perf improvements

## 0.6.3

### Patch Changes

-   Implement passphrase based auth

## 0.6.2

### Patch Changes

-   Add peersToLoadFrom for node creation as well

## 0.6.1

### Patch Changes

-   Provide localNode to AccountMigrations

## 0.6.0

### Minor Changes

-   Make addMember and removeMember take loaded Accounts instead of just IDs

## 0.5.2

### Patch Changes

-   Allow account migrations to be async

## 0.5.1

### Patch Changes

-   Fix bug where accounts, profiles and data created in migrations isn't synced on account creation

## 0.5.0

### Minor Changes

-   Adding a lot of performance improvements to cojson, add a stresstest for the twit example and make that run smoother in a lot of ways.
