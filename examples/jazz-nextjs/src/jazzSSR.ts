import { createSSRJazzAgent } from "jazz-tools/react/ssr";

export const jazzSSR = createSSRJazzAgent({
  peer: "wss://cloud.jazz.tools/",
});
