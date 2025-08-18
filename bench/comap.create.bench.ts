import { describe, bench } from "vitest";
import * as tools from "jazz-tools";
import * as toolsLatest from "jazz-tools-latest";
import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import { WasmCrypto as WasmCryptoLatest } from "cojson-latest/crypto/WasmCrypto";

const sampleReactions = ["👍", "❤️", "😄", "🎉"];
const sampleHiddenIn = ["user1", "user2", "user3"];

// Define the schemas based on the provided Message schema
async function createSchema(
  tools: typeof toolsLatest,
  WasmCrypto: typeof WasmCryptoLatest,
) {
  const Embed = tools.co.map({
    url: tools.z.string(),
    title: tools.z.string().optional(),
    description: tools.z.string().optional(),
    image: tools.z.string().optional(),
  });

  const Message = tools.co.map({
    content: tools.z.string(),
    createdAt: tools.z.date(),
    updatedAt: tools.z.date(),
    hiddenIn: tools.co.list(tools.z.string()),
    replyTo: tools.z.string().optional(),
    reactions: tools.co.list(tools.z.string()),
    softDeleted: tools.z.boolean().optional(),
    embeds: tools.co.optional(tools.co.list(Embed)),
    author: tools.z.string().optional(),
    threadId: tools.z.string().optional(),
  });

  const ctx = await tools.createJazzContextForNewAccount({
    creationProps: {
      name: "Test Account",
    },
    // @ts-expect-error
    crypto: await WasmCrypto.create(),
  });

  return {
    Message,
    sampleReactions,
    sampleHiddenIn,
    Group: tools.Group,
    account: ctx.account,
  };
}

// @ts-expect-error
const schema = await createSchema(tools, WasmCrypto);
const schemaLatest = await createSchema(toolsLatest, WasmCryptoLatest);

const message = schema.Message.create(
  {
    content: "A".repeat(1024),
    createdAt: new Date(),
    updatedAt: new Date(),
    hiddenIn: sampleHiddenIn,
    reactions: sampleReactions,
    author: "user123",
  },
  schema.Group.create(schema.account).makePublic(),
);

const content = await tools.exportCoValue(schema.Message, message.id, {
  // @ts-expect-error
  loadAs: schema.account,
});

describe("Message.create", () => {
  bench("current version (SessionLog)", () => {
    schema.Message.create(
      {
        content: "A".repeat(1024),
        createdAt: new Date(),
        updatedAt: new Date(),
        hiddenIn: sampleHiddenIn,
        reactions: sampleReactions,
        author: "user123",
      },
      schema.Group.create(schema.account),
    );
  });

  bench("latest version (0.17.2)", () => {
    schemaLatest.Message.create(
      {
        content: "A".repeat(1024),
        createdAt: new Date(),
        updatedAt: new Date(),
        hiddenIn: sampleHiddenIn,
        reactions: sampleReactions,
        author: "user123",
      },
      schemaLatest.Group.create(schemaLatest.account),
    );
  });
});

describe("Message import", () => {
  bench("current version (SessionLog)", () => {
    tools.importContentPieces(content ?? [], schema.account as any);
  });

  bench("latest version (0.17.2)", () => {
    toolsLatest.importContentPieces(content ?? [], schemaLatest.account);
  });
});
