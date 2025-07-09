import { beforeAll, describe, expect, it } from "vitest";
import { SessionLog } from "cojson-core-wasm";
import { ed25519 } from "@noble/curves/ed25519";
import { base58 } from "@scure/base";
import * as fs from "fs";
import * as path from "path";

function decodeZ(value: string): Uint8Array {
  const prefixEnd = value.indexOf("_z");
  if (prefixEnd === -1) {
    throw new Error("Invalid prefix");
  }
  return base58.decode(value.substring(prefixEnd + 2));
}

describe("SessionLog WASM", () => {
  let exampleSessions: any;

  beforeAll(() => {
    const dataPath = path.resolve(
      __dirname,
      "../../../../crates/cojson-core/data/exampleSessions.json"
    );
    const data = fs.readFileSync(dataPath, "utf-8");
    exampleSessions = JSON.parse(data);
  });

  it("it works", () => {
    const signingKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(signingKey);

    const session = new SessionLog(
      "co_test1",
      "session_test1",
      publicKey
    );

    expect(session).toBeDefined();
  });

  it("test_add_from_example_json", () => {
    const [sessionIdStr, example] = Object.entries(
      exampleSessions.exampleBase
    )[0] as [string, any];
    const coIdStr = sessionIdStr.split("_session_")[0]!;
    const publicKey = decodeZ(exampleSessions.signerID);

    let session = new SessionLog(coIdStr, sessionIdStr, publicKey);

    const newSignature = decodeZ(example.lastSignature);

    try {
      session.tryAdd([JSON.stringify(example.transactions[0])], newSignature, false);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("test_add_new_transaction", () => {
    const sessionData =
      exampleSessions.exampleBase[
        "co_zkNajJ1BhLzR962jpzvXxx917ZB_session_zXzrQLTtp8rR"
      ];
    const txFromExample = sessionData.transactions[0];
    const knownKey = exampleSessions.knownKeys[0];

    const signingKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(signingKey);

    let session = new SessionLog(
      exampleSessions.coID,
      "co_zkNajJ1BhLzR962jpzvXxx917ZB_session_zXzrQLTtp8rR",
      publicKey
    );

    const changesJson =
      '[{"after":"start","op":"app","value":"co_zMphsnYN6GU8nn2HDY5suvyGufY"}]';
    const keySecret = decodeZ(knownKey.secret);
    const keyId = knownKey.id;
    const madeAt = txFromExample.madeAt;

    const newSignature = session.addNewTransaction(
      changesJson,
      signingKey,
      keySecret,
      keyId,
      madeAt
    );

    expect(newSignature).toBeInstanceOf(Uint8Array);
  });

  it("test_decrypt_from_example_json", () => {
    const [sessionIdStr, example] = Object.entries(
      exampleSessions.exampleBase
    )[0] as [string, any];
    const publicKey = decodeZ(exampleSessions.signerID);

    let session = new SessionLog(exampleSessions.coID, sessionIdStr, publicKey);

    const newSignature = decodeZ(example.lastSignature);

    session.tryAdd(
      example.transactions.map((tx: any) => JSON.stringify(tx)),
      newSignature,
      true
    );

    const keySecret = decodeZ(exampleSessions.knownKeys[0].secret);

    const decrypted = session.decryptNextTransactionChangesJson(0, keySecret);

    expect(decrypted).toEqual(
      '[{"after":"start","op":"app","value":"co_zMphsnYN6GU8nn2HDY5suvyGufY"}]'
    );
  });
});