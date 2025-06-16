import { visit } from "unist-util-visit";
import { headingRank } from "hast-util-heading-rank";
import { toString } from "hast-util-to-string";
import { generateHeaderId } from "./header-ids.mjs";

const FRAMEWORK_MARKER_REGEX = /\s*\[\!framework=([a-zA-Z0-9,_-]+)\]\s*$/;

/** @typedef {{ type: string; tagName?: string; properties?: Record<string, any>; children?: any[]; value?: string }} HastNode */

/**
 * Processes a heading node to extract framework visibility and generate an ID
 * @param {HastNode} node - The heading node to process
 * @param {Record<string, string[]>} [frameworkVisibility] - Object to store framework visibility info
 * @returns {string | undefined} The generated header ID if processed, undefined otherwise
 */
export function processHeadingNode(node, frameworkVisibility = {}) {
  if (!headingRank(node) || node.properties?.id) {
    return undefined;
  }

  const headerText = toString(node);
  const lastChild = node.children?.[node.children.length - 1];
  
  if (lastChild?.type === "text") {
    const frameworkMatch = lastChild.value.match(FRAMEWORK_MARKER_REGEX);
    
    if (frameworkMatch) {
      const frameworks = frameworkMatch[1];
      lastChild.value = lastChild.value.replace(FRAMEWORK_MARKER_REGEX, "");
      const id = generateHeaderId(headerText);
      frameworkVisibility[id] = frameworks.split(",");
      return id;
    }
  }
  
  return generateHeaderId(headerText);
}

/**
 * A rehype plugin that adds IDs to heading elements and handles framework visibility markers.
 * It also tracks which frameworks each heading should be visible for.
 * 
 * @returns {import('unified').Plugin<[], import('hast').Root>} A rehype plugin
 */
export function withSlugAndHeadingsFrameworkVisibility() {
  return function (tree, vfile) {
    vfile.data.headingsFrameworkVisibility = vfile.data.headingsFrameworkVisibility || {};

    visit(tree, "element", function (node) {
      const id = processHeadingNode(node, vfile.data.headingsFrameworkVisibility);
      if (id) {
        node.properties.id = id;
      }
    });
  };
}
