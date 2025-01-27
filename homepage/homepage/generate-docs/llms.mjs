import { Deserializer } from "typedoc";
import { DOC_SECTIONS, PACKAGES } from "./utils/config.mjs";
import {
  cleanDescription,
  loadTypedocFiles,
  writeDocsFile,
} from "./utils/index.mjs";

async function generateConciseDocs(docs) {
  const output = [];
  const deserializer = new Deserializer();

  // Project title
  output.push("# Jazz\n");

  // Documentation sections
  output.push("## Documentation\n");
  DOC_SECTIONS.forEach((section) => {
    output.push(`### ${section.title}\n`);
    section.pages.forEach((page) => {
      output.push(`- [${page.title}](https://jazz.tools${page.url})\n`);
    });
    output.push("\n");
  });

  // API Reference by package
  for (const [packageName, packageDocs] of Object.entries(docs)) {
    const project = deserializer.reviveProject(packageDocs, packageName);

    // Add package heading
    output.push(`## ${packageName}\n`);

    // Process each category and its exports with direct links
    if (project.categories) {
      const seen = new Set(); // Track seen names to avoid duplicates
      project.categories.forEach((category) => {
        category.children.forEach((child) => {
          if (seen.has(child.name)) return;
          seen.add(child.name);

          // Get and clean up description
          let description = child.comment?.summary
            ? cleanDescription(child.comment.summary)
            : "";

          // Truncate description if it's too long
          if (description && description.length > 150) {
            description = description.substring(0, 147) + "...";
          }

          // Create the line without wrapping
          output.push(
            `- [${child.name}](https://jazz.tools/api-reference/${packageName}#${child.name})${description ? `: ${description}` : ""}\n`,
          );
        });
      });
      output.push("\n");
    }
  }

  // Optional section for additional resources
  output.push("## Optional\n");
  output.push(
    "- [Documentation](https://jazz.tools/docs): Detailed documentation about Jazz\n",
  );
  output.push(
    "- [Examples](https://jazz.tools/examples): Code examples and tutorials\n",
  );

  await writeDocsFile("llms.txt", output.join(""));
}

// Main execution
async function main() {
  console.log("Generating concise LLM docs...");
  const docs = await loadTypedocFiles();
  await generateConciseDocs(docs);
}

main().catch(console.error);
