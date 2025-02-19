import { Hono } from "hono";
import { startWorker } from "jazz-nodejs";
import { CoMap, co } from "jazz-tools";
import { Account } from "jazz-tools";

const app = new Hono();

class MyAccountRoot extends CoMap {
  text = co.string;
}

class MyAccount extends Account {
  root = co.ref(MyAccountRoot);

  migrate(): void {
    if (this.root === undefined) {
      this.root = MyAccountRoot.create({
        text: "Hello, world!",
      });
    }
  }
}

app.get("/", async (c) => {
  const admin = await startWorker({
    accountID: "co_z5LYz3a1ZVmWUJ8h5RbMmXHdd3T",
    accountSecret:
      "sealerSecret_zHS7tUv8UDyCaXr2fzNJVtFCnTXVESgYuq1KcZEgPB4P9/signerSecret_zAXTogfyFXgzLW3sAUSRZhWap8BJXCfUq9DahZFLyRJZB",
    AccountSchema: MyAccount,
    syncServer: "wss://cloud.jazz.tools/?key=jazz@jazz.tools",
  });

  await admin.worker.waitForAllCoValuesSync();

  await admin.done();

  const root = admin.worker.root?.toJSON();

  return c.json(root);
});

export default app;
