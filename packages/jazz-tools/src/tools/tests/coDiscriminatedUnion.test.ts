import { beforeEach, describe, expect, test, vi } from "vitest";
import { Loaded, co, z } from "../exports.js";
import { createJazzTestAccount, setupJazzTestSync } from "../testing.js";
import { waitFor } from "./utils.js";

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

  test("use nested co.discriminatedUnions", () => {
    const BaseError = { status: z.literal("failed"), message: z.string() };
    const BadRequestError = co.map({ ...BaseError, code: z.literal(400) });
    const UnauthorizedError = co.map({ ...BaseError, code: z.literal(401) });
    const InternalServerError = co.map({ ...BaseError, code: z.literal(500) });
    const Errors = co.discriminatedUnion("code", [
      BadRequestError,
      UnauthorizedError,
      InternalServerError,
    ]);

    const Success = co.map({ status: z.literal("success"), data: z.string() });
    const Response = co.map({
      result: co.discriminatedUnion("status", [Success, Errors]),
    });

    const response = Response.create({
      result: Success.create({
        status: "success",
        data: "Hello, world!",
      }),
    });

    expect(response.result.status).toEqual("success");
    if (response.result.status === "success") {
      expect(response.result.data).toEqual("Hello, world!");
    }

    response.result = BadRequestError.create({
      status: "failed",
      message: "Bad request",
      code: 400,
    });

    expect(response.result.status).toEqual("failed");
    if (response.result.status === "failed") {
      expect(response.result.code).toEqual(400);
      if (response.result.code === 400) {
        expect(response.result.message).toEqual("Bad request");
      }
    }
  });

  test("load CoValue instances using the DiscriminatedUnion schema", async () => {
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

  test("subscribe to CoValue instances using the DiscriminatedUnion schema", async () => {
    const Person = co.map({
      name: z.string(),
    });
    const Dog = co.map({
      type: z.literal("dog"),
      name: z.string(),
      owner: Person,
    });
    const Cat = co.map({
      type: z.literal("cat"),
      name: z.string(),
    });
    const Pet = co.discriminatedUnion("type", [Dog, Cat]);

    const dog = Dog.create({
      type: "dog",
      name: "Rex",
      owner: Person.create({ name: "John Doe" }),
    });

    const updates: Loaded<typeof Pet>[] = [];
    const spy = vi.fn((pet) => updates.push(pet));

    Pet.subscribe(dog.id, {}, (pet) => {
      expect(pet.type).toEqual("dog");
      spy(pet);
    });

    expect(spy).not.toHaveBeenCalled();

    await waitFor(() => expect(spy).toHaveBeenCalled());

    expect(spy).toHaveBeenCalledTimes(1);

    expect(updates[0]?.name).toEqual("Rex");
  });
});
