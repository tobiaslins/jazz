import path from "path";
import fs from "fs/promises";
import { PACKAGES } from "./config.mjs";

// Common configuration
export const PACKAGE_DESCRIPTIONS = {
  "jazz-tools":
    "The base implementation for Jazz, a framework for distributed state. Provides a high-level API around the CoJSON protocol.",
  "jazz-react": "React bindings for Jazz, a framework for distributed state.",
  "jazz-browser": "Browser (Vanilla JavaScript) bindings for Jazz",
  "jazz-browser-media-images":
    "Image handling utilities for Jazz in the browser",
  "jazz-nodejs": "NodeJS/Bun server worker bindings for Jazz",
};

// Helper functions
export async function loadTypedocFiles() {
  const docs = {};
  for (const { packageName } of PACKAGES) {
    docs[packageName] = JSON.parse(
      await fs.readFile(
        path.join(process.cwd(), "typedoc", packageName + ".json"),
        "utf-8",
      ),
    );
  }
  return docs;
}

export function getPackageDescription(packageName) {
  const pkg = PACKAGES.find((p) => p.packageName === packageName);
  return pkg?.description || "";
}

export function cleanDescription(description) {
  if (!description) return "";
  return (
    description
      .map((part) => part.text)
      .join(" ")
      .trim()
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove line breaks and extra spaces
      .replace(/\s+/g, " ")
      // Clean up backticks
      .replace(/\`/g, "'")
  );
}

export async function writeDocsFile(filename, content) {
  await fs.writeFile(
    path.join(process.cwd(), "public", filename),
    content,
    "utf8",
  );
  console.log(`Documentation generated at 'public/${filename}'`);
}
