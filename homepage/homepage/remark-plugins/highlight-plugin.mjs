import { visit, SKIP } from "unist-util-visit";
import { createHighlighter } from "shiki";
import { transformerNotationDiff } from "@shikijs/transformers";
import { transformerTwoslash } from "@shikijs/twoslash";
import { jazzDark } from "../themes/jazzDark.mjs";
import { jazzLight } from "../themes/jazzLight.mjs";

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

export function highlightPlugin() {
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
