// @ts-check

import { $ } from "zx";

const lsResult = await $`pnpm exec turbo ls --output=json`;

/**
 * @type {{ item: string; path: string }[]}
 */
const packages = JSON.parse(lsResult.stdout).packages.items;

const packagesToPublish = packages
  .map((item) => item.path)
  .filter((path) => path.startsWith("packages/"))
  .map((path) => `"./${path}"`)
  .join(" ");

console.log(`Publishing ${packagesToPublish}`);

await $`pnpm exec pkg-pr-new publish ${packagesToPublish}`;
