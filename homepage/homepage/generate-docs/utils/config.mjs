export const PACKAGES = [
  {
    packageName: "jazz-tools",
    entryPoint: "exports.ts",
    description:
      "The base implementation for Jazz, a framework for distributed state. Provides a high-level API around the CoJSON protocol.",
  },
  {
    packageName: "jazz-react",
    entryPoint: "index.ts",
    description: "React bindings for Jazz, a framework for distributed state.",
    typedocOptions: {
      skipErrorChecking: true, // TODO: remove this. Temporary workaround
    },
  },
  {
    packageName: "jazz-browser",
    description: "Browser (Vanilla JavaScript) bindings for Jazz",
  },
  {
    packageName: "jazz-browser-media-images",
    description: "Image handling utilities for Jazz in the browser",
  },
  {
    packageName: "jazz-nodejs",
    description: "NodeJS/Bun server worker bindings for Jazz",
  },
];
