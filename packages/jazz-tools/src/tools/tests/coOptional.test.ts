import { beforeEach, describe, expect, test } from "vitest";
import { CoPlainText, co, z } from "../exports.js";
import { createJazzTestAccount, setupJazzTestSync } from "../testing.js";

describe("co.optional", () => {
  beforeEach(async () => {
    await setupJazzTestSync();

    await createJazzTestAccount({
      isCurrentActiveAccount: true,
      creationProps: { name: "Hermes Puggington" },
    });
  });

  test("can use co.optional with CoValue schemas as values", () => {
    const Person = co.map({
      preferredName: co.optional(co.plainText()),
    });

    const person = Person.create({});

    type ExpectedType = {
      preferredName?: CoPlainText;
    };

    function matches(value: ExpectedType) {
      return value;
    }

    matches(person);
  });

  test("cannot use co.optional with zod schemas as values", () => {
    const Person = co.map({
      // @ts-expect-error: cannot use co.optional with a Zod schema
      preferredName: co.optional(z.string()),
    });
  });

  test("can access the inner schema of a co.optional", () => {
    const Person = co.map({
      preferredName: co.optional(co.plainText()),
    });

    const person = Person.create({
      preferredName: Person.shape["preferredName"].innerType.create("John"),
    });

    expect(person?.preferredName?.toString()).toEqual("John");
  });
});
