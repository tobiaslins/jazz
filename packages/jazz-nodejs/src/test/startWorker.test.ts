import { createWorkerAccount } from "jazz-run/createWorkerAccount";
import { startSyncServer } from "jazz-run/startSyncServer";
import {
  Account,
  AccountClass,
  AccountSchema,
  AnyAccountSchema,
  CoMap,
  CoValueFromRaw,
  Group,
  InboxSender,
  Loaded,
  co,
  coField,
  z,
} from "jazz-tools";
import { describe, expect, onTestFinished, test } from "vitest";
import { startWorker } from "../index.js";

async function setup<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>(AccountSchema?: S) {
  const { server, port } = await setupSyncServer();

  const syncServer = `ws://localhost:${port}`;

  const { worker, done } = await setupWorker(syncServer, AccountSchema);

  return { worker, done, syncServer, server, port };
}

async function setupSyncServer(defaultPort = "0") {
  const server = await startSyncServer({
    port: defaultPort,
    inMemory: true,
    db: "",
  });

  const port = (server.address() as { port: number }).port.toString();

  onTestFinished(() => {
    server.close();
  });

  return { server, port };
}

async function setupWorker<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>(syncServer: string, AccountSchema?: S) {
  const { accountID, agentSecret } = await createWorkerAccount({
    name: "test-worker",
    peer: syncServer,
  });

  return startWorker({
    accountID: accountID,
    accountSecret: agentSecret,
    syncServer,
    AccountSchema,
  });
}

const TestMap = co.map({
  value: z.string(),
});

describe("startWorker integration", () => {
  test("worker connects to sync server successfully", async () => {
    const worker1 = await setup();
    const worker2 = await setupWorker(worker1.syncServer);

    const group = Group.create({ owner: worker1.worker });
    group.addMember("everyone", "reader");

    const map = TestMap.create(
      {
        value: "test",
      },
      { owner: group },
    );

    await map.waitForSync();

    const mapOnWorker2 = await TestMap.load(map.id, { loadAs: worker2.worker });

    expect(mapOnWorker2?.value).toBe("test");

    await worker1.done();
    await worker2.done();
  });

  test("worker handles successfully the custom account migration", async () => {
    const AccountRoot = co.map({
      value: z.string(),
    });

    let shouldReloadPreviousAccount = false;

    const CustomAccount = co
      .account({
        root: AccountRoot,
        profile: co.map({
          name: z.string(),
        }),
      })
      .withMigration((account) => {
        if (account.root === undefined) {
          if (shouldReloadPreviousAccount) {
            throw new Error("Previous account not found");
          }

          shouldReloadPreviousAccount = true;

          account.root = AccountRoot.create(
            {
              value: "test",
            },
            account,
          );
        }
      });

    const worker1 = await setup(CustomAccount);

    const { root } = await worker1.worker.ensureLoaded({
      resolve: { root: true },
    });

    expect(root.value).toBe("test");

    await worker1.done();

    const worker2 = await startWorker({
      accountID: worker1.worker.id,
      accountSecret:
        worker1.worker._raw.core.node.getCurrentAgent().agentSecret,
      syncServer: worker1.syncServer,
      AccountSchema: CustomAccount,
    });

    const { root: root2 } = await worker2.worker.ensureLoaded({
      resolve: { root: true },
    });

    expect(root2.value).toBe("test");

    await worker2.done();
  });

  test("waits for all coValues to sync before resolving done", async () => {
    const worker1 = await setup();

    const group = Group.create({ owner: worker1.worker });
    group.addMember("everyone", "reader");

    const map = TestMap.create(
      {
        value: "test",
      },
      { owner: group },
    );

    await worker1.done();

    const worker2 = await setupWorker(worker1.syncServer);

    const mapOnWorker2 = await TestMap.load(map.id, { loadAs: worker2.worker });

    expect(mapOnWorker2?.value).toBe("test");

    await worker2.done();
  });

  test("reiceves the messages from the inbox", async () => {
    const worker1 = await setup();
    const worker2 = await setupWorker(worker1.syncServer);

    const group = Group.create({ owner: worker1.worker });
    const map = TestMap.create(
      {
        value: "Hello!",
      },
      { owner: group },
    );

    worker2.experimental.inbox.subscribe(TestMap, async (value) => {
      return TestMap.create(
        {
          value: value.value + " Responded from the inbox",
        },
        { owner: value._owner },
      );
    });

    const sender = await InboxSender.load<
      Loaded<typeof TestMap>,
      Loaded<typeof TestMap>
    >(worker2.worker.id, worker1.worker);

    const resultId = await sender.sendMessage(map);

    const result = await TestMap.load(resultId, { loadAs: worker2.worker });

    expect(result?.value).toEqual("Hello! Responded from the inbox");

    await worker1.done();
    await worker2.done();
  });

  test("worker reconnects when sync server is closed and reopened", async () => {
    const worker1 = await setup();
    const worker2 = await setupWorker(worker1.syncServer);

    const group = Group.create({ owner: worker1.worker });
    group.addMember("everyone", "reader");

    const map = TestMap.create(
      {
        value: "initial value",
      },
      { owner: group },
    );

    await map.waitForSync();

    // Close the sync server
    worker1.server.close();

    // Create a new value while server is down
    const map2 = TestMap.create(
      {
        value: "created while offline",
      },
      { owner: group },
    );

    // Start a new sync server on the same port
    const newServer = await startSyncServer({
      port: worker1.port,
      inMemory: true,
      db: "",
    });

    // Wait for reconnection and sync
    await map2.waitForSync();

    // Verify both old and new values are synced
    const mapOnWorker2 = await TestMap.load(map.id, { loadAs: worker2.worker });
    const map2OnWorker2 = await TestMap.load(map2.id, {
      loadAs: worker2.worker,
    });

    expect(mapOnWorker2?.value).toBe("initial value");
    expect(map2OnWorker2?.value).toBe("created while offline");

    // Cleanup
    await worker2.done();
    newServer.close();
  });
});
