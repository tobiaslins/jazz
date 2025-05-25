import { createSSRJazzAgent } from "jazz-react/ssr";

export const jazzSSR = createSSRJazzAgent({
  peer: "wss://cloud.jazz.tools/",
});
