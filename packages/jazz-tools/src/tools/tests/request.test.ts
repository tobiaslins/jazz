import { http } from "msw";
import { setupServer } from "msw/node";
import { describe, expect, it, vi } from "vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { z } from "zod/v4";
import { experimental_defineRequest } from "../coValues/request.js";
import { Account, CoPlainText, Group, co } from "../index.js";
import { exportCoValue, importContentPieces } from "../internal.js";
import { createJazzTestAccount } from "../testing.js";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("experimental_defineRequest", () => {
  describe("full request/response cycle", () => {
    it("should accept the CoMap init as the request payload and as response callback return value", async () => {
      const me = await createJazzTestAccount();
      const worker = await createJazzTestAccount();

      const workerPieces = await exportCoValue(Account, worker.id, {
        loadAs: worker,
      });

      importContentPieces(workerPieces ?? [], me);
      const group = Group.create(me);
      group.addMember("everyone", "writer");

      const userRequest = experimental_defineRequest({
        url: "https://api.example.com/api/user",
        workerId: worker.id,
        request: {
          name: z.string(),
          email: z.string(),
          age: z.number(),
        },
        response: {
          bio: z.string(),
          avatar: z.string().optional(),
        },
      });

      let receivedUser: unknown;
      let receivedMadeBy: unknown;

      server.use(
        http.post("https://api.example.com/api/user", async ({ request }) => {
          try {
            return await userRequest.handle(
              request,
              worker,
              async (user, madeBy) => {
                receivedUser = user.toJSON();
                receivedMadeBy = madeBy.id;

                // Return a plain object (CoMapInit) instead of a CoMap instance
                return {
                  bio: `Profile for ${user.name}`,
                  avatar: `https://example.com/avatars/${user.email}.jpg`,
                };
              },
            );
          } catch (error) {
            console.error(error);
            throw error;
          }
        }),
      );

      // Send a plain object (CoMapInit) instead of a CoMap instance
      const response = await userRequest.send(
        {
          name: "John Doe",
          email: "john@example.com",
          age: 30,
        },
        { owner: me },
      );

      // Verify the response is a proper CoMap instance
      expect(response.bio).toEqual("Profile for John Doe");
      expect(response.avatar).toEqual(
        "https://example.com/avatars/john@example.com.jpg",
      );

      expect(
        response._owner.members.map((m) => [m.account.id, m.role]),
      ).toEqual([
        [worker.id, "admin"],
        [me.id, "reader"],
      ]);

      // Verify the server received the correct data
      expect(receivedUser).toMatchObject({
        _type: "CoMap",
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      });
      expect(receivedMadeBy).toEqual(me.id);
    });
  });

  it("should handle errors on child covalues gracefully", async () => {
    const me = await createJazzTestAccount();
    const worker = await createJazzTestAccount();

    const workerPieces = await exportCoValue(Account, worker.id, {
      loadAs: worker,
    });

    importContentPieces(workerPieces ?? [], me);

    const Address = co.map({
      street: co.plainText(),
      city: co.plainText(),
    });

    const Person = co.map({
      name: z.string(),
      address: Address,
    });

    const privateToWorker = Group.create(worker);
    const privateToMe = Group.create(me);
    const publicGroup = Group.create(me).makePublic();
    const address = Address.create(
      {
        street: CoPlainText.create("123 Main St", privateToWorker),
        city: CoPlainText.create("New York", privateToMe),
      },
      publicGroup,
    );
    const person = Person.create(
      {
        name: "John",
        address,
      },
      publicGroup,
    );

    const personRequest = experimental_defineRequest({
      url: "https://api.example.com/api/person",
      workerId: worker.id,
      request: {
        schema: {
          person: Person,
        },
        resolve: { person: { address: { street: true } } },
      },
      response: {
        schema: {
          person: Person,
        },
        resolve: { person: { address: { street: true, city: true } } },
      },
    });

    server.use(
      http.post("https://api.example.com/api/person", async ({ request }) => {
        return personRequest.handle(
          request,
          worker,
          async ({ person }, madeBy) => {
            person.address.street._owner
              .castAs(Group)
              .addMember(madeBy, "reader");

            // The request should handle the error gracefully when trying to resolve
            // child covalues that the worker doesn't have access to
            return { person };
          },
        );
      }),
    );

    // Send the request - this should not throw even though the worker
    // doesn't have access to the address's child covalues
    const response = await personRequest.send({ person }, { owner: me });

    // Verify the response is still a proper Person instance
    expect(response.person.name).toEqual("John");
    expect(response.person.address.street.toString()).toBe("123 Main St");
    expect(response.person.address.city.toString()).toBe("New York");
  });
});
