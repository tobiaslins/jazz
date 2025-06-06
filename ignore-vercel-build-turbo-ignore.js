import { execSync } from "child_process";

// Helper function to execute git commands safely
function getGitSha(ref) {
  try {
    return execSync(`git rev-parse ${ref}`, { encoding: "utf8" }).trim();
  } catch (error) {
    return `Error: Could not get SHA for ${ref}`;
  }
}

// Output the requested SHA values
console.log("HEAD^1 SHA:", getGitSha("HEAD^1"));
console.log("HEAD~10 SHA:", getGitSha("HEAD~10"));
console.log(
  "VERCEL_GIT_PREVIOUS_SHA:",
  process.env.VERCEL_GIT_PREVIOUS_SHA || "Not set",
);

// Run npx turbo-ignore and return its exit code
try {
  execSync("npx turbo-ignore", { stdio: "inherit" });
  process.exit(0);
} catch (error) {
  process.exit(error.status || 1);
}
