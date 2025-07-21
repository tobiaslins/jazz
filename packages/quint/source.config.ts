import rehypePrettyCode from "rehype-pretty-code";
import { z } from "zod";
// !NOTE: This should be imported from fumadocs-mdx/config, but we are hoisting packages and this is not working.
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "../../node_modules/fumadocs-mdx/dist/config";

import { transformers } from "@/lib/highlight-code";

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (plugins) => {
      plugins.shift();
      plugins.push([
        rehypePrettyCode,
        {
          theme: {
            dark: "github-dark",
            light: "github-light-default",
          },
          transformers,
        },
      ]);

      return plugins;
    },
  },
});

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      links: z
        .object({
          doc: z.string().optional(),
          api: z.string().optional(),
        })
        .optional(),
    }),
  },
});
