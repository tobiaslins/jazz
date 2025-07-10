import { http } from "msw";
import { setupServer } from "msw/node";
import { describe, expect, it, vi } from "vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { z } from "zod/v4";
import { experimental_defineRequest } from "../coValues/request.js";
import { Group, co } from "../index.js";
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
        payload: {
          blog: {
            schema: Blog,
            resolve: {
              posts: {
                $each: {
                  comments: true,
                },
              },
            },
          },
          additionalData: z.string(),
        },
        response: {
          blog: {
            schema: Blog,
          },
        },
      });

      const worker = await createJazzTestAccount();

      let callbackData: unknown;

      server.use(
        http.post("https://api.example.com/api/blog", async ({ request }) => {
          return blogRequest.handle(request, worker, async (values, madeBy) => {
            callbackData = {
              values: values.blog.toJSON(),
              additionalData: values.additionalData,
              madeBy: madeBy.id,
            };

            values.blog.name = "My Blog (modified)";

            return {
              blog,
            };
          });
        }),
      );

      const response = await blogRequest.send(
        {
          blog,
          additionalData: "Hello World",
        },
        { owner: me },
      );

      expect(response.blog.name).toEqual("My Blog (modified)");

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
        additionalData: "Hello World",
        madeBy: me.id,
      });
    });
  });
});
