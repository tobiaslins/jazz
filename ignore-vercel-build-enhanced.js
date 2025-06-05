import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, relative } from "path";

const branchName =
  process.env.VERCEL_GIT_COMMIT_REF ||
  execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
const currentAppName = process.env.APP_NAME;
const homepageAppName = "jazz-homepage";

// Helper function to execute git commands safely
function gitCommand(command) {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch (error) {
    console.log(`Git command failed: ${command}`);
    return "";
  }
}

// Get list of changed files since last deployment
function getChangedFiles() {
  const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA;

  if (previousSha) {
    // Compare against the last successful deployment
    const changedFiles = gitCommand(`git diff --name-only ${previousSha} HEAD`);
    if (changedFiles) {
      console.log(`📊 Comparing against last deployment: ${previousSha}`);
      return changedFiles.split("\n").filter((file) => file.trim() !== "");
    }
  }

  // Fallback to current logic
  let changedFiles = gitCommand("git diff --name-only HEAD~1 HEAD");

  // If that fails, get files changed in the current commit
  if (!changedFiles) {
    changedFiles = gitCommand("git diff --name-only HEAD^ HEAD");
  }

  // If still no files, assume we need to build (safety fallback)
  if (!changedFiles) {
    console.log("⚠️  Could not determine changed files, proceeding with build");
    return null;
  }

  return changedFiles.split("\n").filter((file) => file.trim() !== "");
}

// Get current project path relative to repo root
function getCurrentProjectPath() {
  const cwd = process.cwd();
  const repoRoot =
    process.env.VERCEL_ROOT ||
    gitCommand("git rev-parse --show-toplevel") ||
    cwd;

  // Get relative path from repo root to current directory
  const projectPath = relative(repoRoot, cwd);

  // If we're at repo root, return empty string
  return projectPath === "" ? "." : projectPath;
}

// Get dependencies from package.json
function getProjectDependencies(projectPath) {
  const packageJsonPath = join(projectPath, "package.json");
  if (!existsSync(packageJsonPath)) {
    return [];
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Filter to only local workspace dependencies
    return Object.keys(deps).filter(
      (dep) => deps[dep].startsWith("workspace:") || dep.startsWith("jazz-"),
    );
  } catch (error) {
    console.log(
      `Error reading package.json for ${projectPath}:`,
      error.message,
    );
    return [];
  }
}

// Check if any workspace packages changed
function workspacePackagesChanged(changedFiles, dependencies) {
  return changedFiles.some((file) => {
    // Check if any file in packages/ directory changed
    if (file.startsWith("packages/")) {
      const packageName = file.split("/")[1];
      // Check if this package is a dependency of our project
      return dependencies.some(
        (dep) =>
          dep.includes(packageName) ||
          file.startsWith(`packages/${packageName}`),
      );
    }
    return false;
  });
}

// Check if global configuration files changed
function globalConfigChanged(changedFiles) {
  const globalFiles = [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "turbo.json",
    "tsconfig.json",
    "vite.config.ts",
    "biome.json",
    ".npmrc",
    ".nvmrc",
    "ignore-vercel-build.js",
    "ignore-vercel-build-enhanced.js",
  ];

  return changedFiles.some((file) => globalFiles.includes(file));
}

// Main logic
console.log(
  `🔍 Checking build necessity for ${currentAppName} on branch ${branchName}`,
);

// Keep existing docs branch logic
if (
  branchName === "main" &&
  process.env.VERCEL_GIT_COMMIT_MESSAGE?.includes("docs")
) {
  if (currentAppName === homepageAppName) {
    console.log(
      '✅ Building homepage because a "docs" branch was merged into "main".',
    );
    process.exit(1);
  } else {
    console.log(
      `🛑 Skipping build for ${currentAppName} after \"docs\" branch merged to main.`,
    );
    process.exit(0);
  }
} else if (branchName.includes("docs")) {
  if (currentAppName === homepageAppName) {
    console.log('✅ Building homepage for "docs" branch.');
    process.exit(1);
  } else {
    console.log(`🛑 Skipping build for ${currentAppName} on \"docs\" branch.`);
    process.exit(0);
  }
}

// Enhanced change detection
const changedFiles = getChangedFiles();
if (!changedFiles) {
  console.log(
    "✅ Could not determine changes, proceeding with build for safety.",
  );
  process.exit(1);
}

console.log(`📁 Changed files: ${changedFiles.length}`);
console.log(changedFiles.map((f) => `  - ${f}`).join("\n"));

const projectPath = getCurrentProjectPath();
console.log(`📂 Project path: ${projectPath}`);

// Check if current project files changed
const projectChanged = changedFiles.some((file) => {
  // Check if file is in current project directory
  if (projectPath === ".") {
    // We're at repo root, check for root-level changes
    return !file.includes("/");
  } else {
    // Check if file is in our project directory
    return file.startsWith(projectPath + "/") || file === projectPath;
  }
});

// Check if global config changed
const globalChanged = globalConfigChanged(changedFiles);

// Check if dependencies changed
const dependencies = getProjectDependencies(".");
const depsChanged = workspacePackagesChanged(changedFiles, dependencies);

console.log(`📊 Change analysis:`);
console.log(`  - Project files changed: ${projectChanged}`);
console.log(`  - Global config changed: ${globalChanged}`);
console.log(`  - Dependencies changed: ${depsChanged}`);
console.log(`  - Dependencies: ${dependencies.join(", ") || "none"}`);

// Decision logic
if (projectChanged || globalChanged || depsChanged) {
  console.log(
    `✅ Building ${currentAppName} - changes detected that affect this project.`,
  );
  process.exit(1);
} else {
  console.log(
    `🛑 Skipping build for ${currentAppName} - no relevant changes detected.`,
  );
  process.exit(0);
}
