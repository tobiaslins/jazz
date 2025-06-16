// @ts-check

import createMDX from "@next/mdx";
import { transformerNotationDiff } from "@shikijs/transformers";
import { transformerTwoslash } from "@shikijs/twoslash";
import { remarkHtmlToJsx } from "./remark-plugins/html-to-jsx.mjs";
import withToc from "@stefanprobst/rehype-extract-toc";
import { createHighlighter } from "shiki";
import { visit, SKIP } from "unist-util-visit";
import { jazzDark } from "./themes/jazzDark.mjs";
import { jazzLight } from "./themes/jazzLight.mjs";
import { withSlugAndHeadingsFrameworkVisibility } from "./rehype-plugins/with-slug-and-framework-visibility.mjs";
import { withTocAndFrameworkHeadingsVisibilityExport } from "./rehype-plugins/with-toc-and-framework-visibility-export.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions`` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  transpilePackages: ["@garden-co/design-system"],
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [highlightPlugin, remarkHtmlToJsx],
    rehypePlugins: [
      // Add id to heading elements, and indicate which frameworks to show the heading for
      // This is a modified version of rehype-slug
      withSlugAndHeadingsFrameworkVisibility,

      // Create table of contents array
      withToc,

      // Return the table of contents and framework visibility data when importing a .mdx file
      // This is a modified version of withTocExport from @stefanprobst/rehype-extract-toc
      withTocAndFrameworkHeadingsVisibilityExport,
    ],
  },
});

const config = {
  ...withMDX(nextConfig),
  output: "standalone",
  redirects: async () => {
    return [
      {
        source: "/docs",
        destination: "/docs/react",
        permanent: false,
      },
    ];
  },
};

const highlighterPromise = createHighlighter({
  langs: [
    "typescript",
    "bash",
    "tsx",
    "json",
    "ruby",
    "groovy",
    "svelte",
    "vue",
  ],
  themes: [jazzLight, jazzDark],
});

function highlightPlugin() {
  return async function transformer(tree) {
    const highlighter = await highlighterPromise;

    visit(tree, "code", visitor);

    function visitor(node) {
      let error = "";
      const html = highlighter.codeToHtml(node.value, {
        lang: node.lang,
        meta: { __raw: node.lang + " " + node.meta },
        themes: {
          light: "jazz-light",
          dark: "jazz-dark",
        },

        transformers: [
          transformerTwoslash({
            explicitTrigger: true,
            throws: process.env.NODE_ENV === "production",
            onTwoslashError: (e, code) => {
              if (process.env.NODE_ENV === "production") {
                // Re-throw to actually fail the build in production
                throw e;
              }
              
              const { description, recommendation } = e;
              console.error("\nTwoslash error: ");
              console.log(description);
              console.log(recommendation);
              console.log("\nCode: \n```\n" + code + "\n```");
              
              // In development, store the error to show inline
              error = e;
            },
          }),
          transformerNotationDiff(),
        ],
      });

      node.type = "html";
      node.value = error
        ? `<div style="color: red; background: #fee; padding: 8px; border: 1px solid #fcc; margin: 8px 0;"><strong>Twoslash Error:</strong> ${error.description || error.message} ${error.recommendation}</div>` + html
        : html;
      node.children = [];
      return SKIP;
    }
  };
}

export default config;
