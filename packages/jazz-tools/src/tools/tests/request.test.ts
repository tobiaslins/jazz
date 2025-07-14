import { http } from "msw";
import { setupServer } from "msw/node";
import { describe, expect, it, vi } from "vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { z } from "zod/v4";
import { experimental_defineRequest } from "../coValues/request.js";
import { CoPlainText, Group, co } from "../index.js";
import { createJazzTestAccount } from "../testing.js";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("experimental_defineRequest", () => {
  describe("full request/response cycle", () => {
    it("should complete full cycle with complex data", async () => {
      const me = await createJazzTestAccount();

      const Validation = co.map({
        isValid: z.boolean(),
      });

      const Comment = co.map({
        text: z.string(),
        author: z.string(),
        validation: Validation.optional(),
      });

      const Post = co.map({
        title: z.string(),
        content: z.string(),
        comments: co.list(Comment),
      });

      const Blog = co.map({
        name: z.string(),
        posts: co.list(Post),
      });

      const group = Group.create(me);
      const comment1 = Comment.create(
        { text: "Great post!", author: "Alice" },
        group,
      );
      const comment2 = Comment.create(
        { text: "Thanks!", author: "Bob" },
        group,
      );

      const post = Post.create(
        {
          title: "My First Post",
          content: "Hello World",
          comments: Post.def.shape.comments.create([comment1, comment2], group),
        },
        group,
      );

      const blog = Blog.create(
        { name: "My Blog", posts: Blog.def.shape.posts.create([post], group) },
        group,
      );

      group.addMember("everyone", "writer");

      const blogRequest = experimental_defineRequest({
        url: "https://api.example.com/api/blog",
        request: {
          schema: Blog,
          resolve: {
            posts: {
              $each: {
                comments: true,
              },
            },
          },
        },
        response: Blog,
      });

      const worker = await createJazzTestAccount();

      let callbackData: unknown;

      server.use(
        http.post("https://api.example.com/api/blog", async ({ request }) => {
          return blogRequest.handle(request, worker, async (blog, madeBy) => {
            callbackData = {
              values: blog.toJSON(),
              madeBy: madeBy.id,
            };

            blog.name = "My Blog (modified)";

            return blog;
          });
        }),
      );

      const response = await blogRequest.send(blog, { owner: me });

      expect(response.name).toEqual("My Blog (modified)");

      expect(callbackData).toMatchObject({
        values: {
          name: "My Blog",
          posts: [
            {
              _type: "CoMap",
              comments: [undefined, undefined],
              content: "Hello World",
              title: "My First Post",
            },
          ],
        },
        madeBy: me.id,
      });
    });

    it("should accept the CoMap init as the request payload and as response callback return value", async () => {
      const me = await createJazzTestAccount();
      const worker = await createJazzTestAccount();

      const User = co.map({
        name: z.string(),
        email: z.string(),
        age: z.number(),
      });

      const UserProfile = co.map({
        bio: z.string(),
        avatar: z.string().optional(),
      });

      const group = Group.create(me);
      group.addMember("everyone", "writer");

      const userRequest = experimental_defineRequest({
        url: "https://api.example.com/api/user",
        request: User,
        response: UserProfile,
      });

      let receivedUser: unknown;
      let receivedMadeBy: unknown;

      server.use(
        http.post("https://api.example.com/api/user", async ({ request }) => {
          return userRequest.handle(request, worker, async (user, madeBy) => {
            receivedUser = user.toJSON();
            receivedMadeBy = madeBy.id;

            // Return a plain object (CoMapInit) instead of a CoMap instance
            return {
              bio: `Profile for ${user.name}`,
              avatar: `https://example.com/avatars/${user.email}.jpg`,
            };
          });
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
    const group = Group.create(me);
    const address = Address.create(
      {
        street: CoPlainText.create("123 Main St", privateToWorker),
        city: CoPlainText.create("New York", privateToMe),
      },
      group,
    );
    const person = Person.create({ name: "John", address }, group);

    group.addMember("everyone", "writer");

    const personRequest = experimental_defineRequest({
      url: "https://api.example.com/api/person",
      request: {
        schema: Person,
        resolve: { address: { street: true } },
      },
      response: {
        schema: Person,
        resolve: { address: { street: true, city: true } },
      },
    });

    server.use(
      http.post("https://api.example.com/api/person", async ({ request }) => {
        return personRequest.handle(request, worker, async (person, madeBy) => {
          person.address.street._owner
            .castAs(Group)
            .addMember(madeBy, "reader");

          // The request should handle the error gracefully when trying to resolve
          // child covalues that the worker doesn't have access to
          return person;
        });
      }),
    );

    // Send the request - this should not throw even though the worker
    // doesn't have access to the address's child covalues
    const response = await personRequest.send(person, { owner: me });

    // Verify the response is still a proper Person instance
    expect(response.name).toEqual("John");
    expect(response.address.street.toString()).toBe("123 Main St");
    expect(response.address.city.toString()).toBe("New York");
  });
});
