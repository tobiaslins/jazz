import { expect, test } from "vitest";
import { Account, CoMap, co } from "../exports.js";
import { createJazzTestAccount, setActiveAccount } from "../testing.js";
import { setupTwoNodes } from "./utils.js";

test("waitForAllCoValuesSync should resolve when all the values are synced", async () => {
  class TestMap extends CoMap {
    name = co.string;
  }

  const { clientNode, serverNode, clientAccount } = await setupTwoNodes();

  const maps = Array.from({ length: 10 }).map(() =>
    TestMap.create({ name: "Alice" }, { owner: clientAccount }),
  );

  await clientAccount.waitForAllCoValuesSync({
    timeout: 1000,
  });

  // Killing the client node so the serverNode can't load the map from it
  clientNode.gracefulShutdown();

  for (const map of maps) {
    const loadedMap = await serverNode.load(map._raw.id);
    expect(loadedMap).not.toBe("unavailable");
  }
});

test("waitForSync should resolve when the value is uploaded", async () => {
  const { clientNode, serverNode, clientAccount } = await setupTwoNodes();

  await clientAccount.waitForSync({ timeout: 1000 });

  // Killing the client node so the serverNode can't load the map from it
  clientNode.gracefulShutdown();

  const loadedAccount = await serverNode.load(clientAccount._raw.id);

  expect(loadedAccount).not.toBe("unavailable");
});

test("isMe gets updated correctly when switching accounts", async () => {
  const oldMe = await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });

  expect(oldMe.isMe).toBe(true);

  const newMe = await createJazzTestAccount({
    isCurrentActiveAccount: false,
  });

  expect(newMe.isMe).toBe(false);
  expect(oldMe.isMe).toBe(true);

  setActiveAccount(newMe);

  expect(newMe.isMe).toBe(true);
  expect(oldMe.isMe).toBe(false);
});

test("Me gets updated correctly when creating a new account as active", async () => {
  const oldMe = await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });

  expect(oldMe.isMe).toBe(true);

  const newMe = await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });

  expect(newMe.isMe).toBe(true);
  expect(oldMe.isMe).toBe(false);
});
