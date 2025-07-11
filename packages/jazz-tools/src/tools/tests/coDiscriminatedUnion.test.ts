import { beforeEach, describe, expect, test } from "vitest";
import { Loaded, co, z } from "../exports.js";
import { createJazzTestAccount, setupJazzTestSync } from "../testing.js";

describe("co.discriminatedUnion", () => {
  beforeEach(async () => {
    await setupJazzTestSync();

    await createJazzTestAccount({
      isCurrentActiveAccount: true,
      creationProps: { name: "Hermes Puggington" },
    });
  });

  test("use co.discriminatedUnion with CoValue schemas as values", () => {
    const Dog = co.map({
      type: z.literal("dog"),
    });
    const Cat = co.map({
      type: z.literal("cat"),
    });
    const Person = co.map({
      pet: co.discriminatedUnion("type", [Dog, Cat]),
    });

    const person = Person.create({
      pet: Dog.create({
        type: "dog",
      }),
    });

    expect(person.pet.type).toEqual("dog");

    person.pet = Cat.create({
      type: "cat",
    });

    expect(person.pet.type).toEqual("cat");
  });

  test("load CoValue instances using the DiscriminatedUnion schema without resolve", async () => {
    const Dog = co.map({
      type: z.literal("dog"),
    });
    const Cat = co.map({
      type: z.literal("cat"),
    });
    const Pet = co.discriminatedUnion("type", [Dog, Cat]);

    const dog = Dog.create({ type: "dog" });
    const loadedPet = await Pet.load(dog.id);
    expect(loadedPet?.type).toEqual("dog");
  });

  test("load CoValue instances using the DiscriminatedUnion schema with deep resolve", async () => {
    const Person = co.map({
      name: z.string(),
    });
    const Dog = co.map({
      type: z.literal("dog"),
      owner: Person,
    });
    const Cat = co.map({
      type: z.literal("cat"),
      owner: Person,
    });
    const Pet = co.discriminatedUnion("type", [Dog, Cat]);

    const dog = Dog.create({
      type: "dog",
      owner: Person.create({
        name: "John Doe",
      }),
    });

    const loadedPet = await Pet.load(dog.id, {
      resolve: {
        owner: true,
      },
    });
    expect(loadedPet?.owner.name).toEqual("John Doe");
  });
});
