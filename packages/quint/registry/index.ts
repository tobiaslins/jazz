import { type Registry, registryItemSchema } from "shadcn/registry";
import { z } from "zod";

// import { blocks } from "@/registry/registry-blocks";
// import { charts } from "@/registry/registry-charts";
import { examples } from "@/registry/registry-examples";
// import { hooks } from "@/registry/registry-hooks";
// import { internal } from "@/registry/registry-internal";
// import { lib } from "@/registry/registry-lib";
// import { themes } from "@/registry/registry-themes";
// import { ui } from "@/registry/registry-ui";

export const registry = {
  name: "quint",
  homepage: "https://quint.jazz.tools",
  items: z.array(registryItemSchema).parse([
    {
      name: "index",
      type: "registry:style",
      dependencies: ["tailwind-variants", "lucide-react"],
      devDependencies: ["tw-animate-css"],
      registryDependencies: ["utils"],
      cssVars: {},
      files: [],
    },
    // ...ui,
    // ...blocks,
    // ...charts,
    // ...lib,
    // ...hooks,
    // ...themes,
    ...examples,
    // ...internal,
  ]),
} satisfies Registry;
