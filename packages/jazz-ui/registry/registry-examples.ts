import type { Registry } from "shadcn/registry";

export const examples: Registry["items"] = [
  {
    name: "button-demo",
    type: "registry:example",
    registryDependencies: ["button"],
    files: [
      {
        path: "examples/button-demo.tsx",
        type: "registry:example",
      },
    ],
  },
  {
    name: "button/with-icon",
    type: "registry:example",
    registryDependencies: ["button"],
    files: [
      {
        path: "examples/button/with-icon.tsx",
        type: "registry:example",
      },
    ],
  },
  {
    name: "button/kitchen-sink",
    type: "registry:example",
    registryDependencies: ["button"],
    files: [
      {
        path: "examples/button/kitchen-sink.tsx",
        type: "registry:example",
      },
    ],
  },
];
