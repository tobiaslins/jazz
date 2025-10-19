import { cojsonInternals } from "cojson";
import { assert, beforeEach, describe, expect, test } from "vitest";
import {
  setupJazzTestSync,
  createJazzTestAccount,
  runWithoutActiveAccount,
} from "../testing";
import { Group, co, activeAccountContext } from "../internal";
import { z } from "../exports";

beforeEach(async () => {
  cojsonInternals.CO_VALUE_LOADING_CONFIG.RETRY_DELAY = 1000;

  await setupJazzTestSync();

  await createJazzTestAccount({
    isCurrentActiveAccount: true,
    creationProps: { name: "Hermes Puggington" },
  });
});

describe("Creating and finding unique CoFeed", async () => {
  test.todo("Creating and finding unique CoMaps");
  test.todo("manual upserting pattern");
  test.todo("upserting a non-existent value");
  test.todo("upserting without an active account");
  test.todo("upserting an existing value");
  test.todo("upserting a non-existent value with resolve");
  test.todo("upserting an existing value with resolve");
  test.todo("upserting a partially loaded value on an new value with resolve");
  test.todo(
    "upserting a partially loaded value on an existing value with resolve",
  );
  test.todo("concurrently upserting the same value");
  test.todo("upsert on an existing CoValue with unavailable childs");
  test.todo("loadUnique should retry missing childs");
  test.todo("upsertUnique should retry missing childs");
});
