import { _runtime } from "fumadocs-mdx";
import * as docs_0 from "../content/docs/(root)/about.mdx?collection=docs&hash=1752953689031";
import * as docs_1 from "../content/docs/components/button.mdx?collection=docs&hash=1752953689031";
import * as docs_2 from "../content/docs/components/index.mdx?collection=docs&hash=1752953689031";
// @ts-nocheck -- skip type checking
import * as docs_3 from "../content/docs/installation/index.mdx?collection=docs&hash=1752953689031";
import * as _source from "../source.config";
export const docs = _runtime.docs<typeof _source.docs>(
  [
    {
      info: {
        path: "(root)/about.mdx",
        absolutePath:
          "/Users/elfo404/projects/garden/jazz/packages/jazz-ui/content/docs/(root)/about.mdx",
      },
      data: docs_0,
    },
    {
      info: {
        path: "components/button.mdx",
        absolutePath:
          "/Users/elfo404/projects/garden/jazz/packages/jazz-ui/content/docs/components/button.mdx",
      },
      data: docs_1,
    },
    {
      info: {
        path: "components/index.mdx",
        absolutePath:
          "/Users/elfo404/projects/garden/jazz/packages/jazz-ui/content/docs/components/index.mdx",
      },
      data: docs_2,
    },
    {
      info: {
        path: "installation/index.mdx",
        absolutePath:
          "/Users/elfo404/projects/garden/jazz/packages/jazz-ui/content/docs/installation/index.mdx",
      },
      data: docs_3,
    },
  ],
  [
    {
      info: {
        path: "meta.json",
        absolutePath:
          "/Users/elfo404/projects/garden/jazz/packages/jazz-ui/content/docs/meta.json",
      },
      data: { pages: ["(root)", "components"], root: true },
    },
    {
      info: {
        path: "(root)/meta.json",
        absolutePath:
          "/Users/elfo404/projects/garden/jazz/packages/jazz-ui/content/docs/(root)/meta.json",
      },
      data: {
        title: "Get Started",
        pages: ["index", "[Installation](/docs/installation)"],
      },
    },
  ],
);
