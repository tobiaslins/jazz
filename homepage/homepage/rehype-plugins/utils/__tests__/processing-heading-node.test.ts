import { describe, it, expect } from "vitest";
import { processHeadingNode } from "../processing-heading-node.mjs";

type HastNode = {
  type: string;
  tagName?: string;
  properties: Record<string, any>;
  children?: Array<{
    type: string;
    value?: string;
    tagName?: string;
    properties?: Record<string, any>;
    children?: any[];
  }>;
  value?: string;
};

describe("processHeadingNode", () => {
  it("should return undefined for non-heading nodes", () => {
    const node = { type: "element", tagName: "div" };
    const frameworkVisibility = {};
    expect(processHeadingNode(node, frameworkVisibility)).toBeUndefined();
    expect(frameworkVisibility).toEqual({});
  });

  it("should generate ID for heading without framework marker", () => {
    const node: HastNode = {
      type: "element",
      tagName: "h2",
      properties: { id: undefined },
      children: [{ type: "text", value: "Test Header" }],
    };
    const frameworkVisibility: Record<string, string[]> = {};
    const id = processHeadingNode(node, frameworkVisibility);
    expect(id).toBeDefined();
    expect(frameworkVisibility).toEqual({});
    expect(node.properties.id).toBeUndefined(); // Shouldn't modify node directly
  });

  it("should handle framework marker in header text", () => {
    const node: HastNode = {
      type: "element",
      tagName: "h2",
      properties: { id: undefined },
      children: [{ type: "text", value: "Test Header [!framework=react,vue]" }],
    };
    const frameworkVisibility: Record<string, string[]> = {};
    const id = processHeadingNode(node, frameworkVisibility);

    expect(id).toBeDefined();
    expect(frameworkVisibility).toEqual({
      [id!]: ["react", "vue"],
    });
    expect(node.children?.[0].value).toBe("Test Header");
  });
});
