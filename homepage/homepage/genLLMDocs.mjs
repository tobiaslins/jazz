import path from "path";
import fs from "fs/promises";
import { Deserializer, JSONOutput, ReflectionKind } from "typedoc";

// Import TypeDoc JSON files
const docs = {};
for (const packageName of [
  "jazz-tools",
  "jazz-react",
  "jazz-browser",
  "jazz-browser-media-images",
  "jazz-nodejs",
]) {
  docs[packageName] = JSON.parse(
    await fs.readFile(
      path.join(process.cwd(), "typedoc", packageName + ".json"),
      "utf-8",
    ),
  );
}

function formatType(type) {
  if (!type) return "unknown";

  if (type.type === "reference") {
    return (
      type.name +
      (type.typeArguments
        ? `<${type.typeArguments.map(formatType).join(", ")}>`
        : "")
    );
  }

  if (type.type === "union") {
    return type.types.map(formatType).join(" | ");
  }

  if (type.type === "array") {
    return `${formatType(type.elementType)}[]`;
  }

  if (type.type === "intrinsic" || type.type === "literal") {
    return type.name;
  }

  if (type.type === "reflection") {
    if (type.declaration.signatures) {
      const sig = type.declaration.signatures[0];
      const params =
        sig.parameters
          ?.map((p) => `${p.name}: ${formatType(p.type)}`)
          .join(", ") || "";
      return `(${params}) => ${formatType(sig.type)}`;
    }
    return (
      "{ " +
      (type.declaration.children || [])
        .map((child) => `${child.name}: ${formatType(child.type)}`)
        .join("; ") +
      " }"
    );
  }

  return type.toString();
}

function formatComment(comment) {
  if (!comment) return "";

  let text =
    comment.summary
      ?.map((part) => part.text)
      .join("")
      .trim() || "";

  if (comment.blockTags) {
    const examples = comment.blockTags
      .filter((tag) => tag.tag === "@example")
      .map((tag) =>
        tag.content
          .map((part) => part.text)
          .join("")
          .trim()
          // Remove any existing code block markers
          .replace(/^```(?:typescript|ts)\n?/, "")
          .replace(/```$/, "")
          .trim(),
      );

    if (examples.length > 0) {
      text +=
        "\n\nExamples:\n" +
        examples.map((ex) => "```typescript\n" + ex + "\n```").join("\n\n");
    }
  }

  return text;
}

async function generateLLMDocs() {
  const output = [];
  const deserializer = new Deserializer();

  for (const [packageName, packageDocs] of Object.entries(docs)) {
    const project = deserializer.reviveProject(packageDocs, packageName);

    output.push(`# ${packageName}\n`);

    // Process each category
    project.categories?.forEach((category) => {
      output.push(`## ${category.title}\n`);

      category.children.forEach((child) => {
        // Add name and kind
        output.push(`### ${child.name} (${ReflectionKind[child.kind]})\n`);

        // Add description if available
        const description = formatComment(child.comment);
        if (description) {
          output.push(`${description}\n`);
        }

        // Add signatures for functions/methods
        if (child.signatures) {
          child.signatures.forEach((sig) => {
            const params = sig.parameters
              ?.map((p) => {
                const type = formatType(p.type);
                const desc = formatComment(p.comment);
                return `${p.name}: ${type}${desc ? ` - ${desc}` : ""}`;
              })
              .join(", ");

            output.push(`Signature: ${child.name}(${params || ""})`);

            if (sig.type) {
              output.push(`Returns: ${formatType(sig.type)}`);
              if (sig.comment?.returns) {
                output.push(
                  `Return description: ${sig.comment.returns
                    .map((part) => part.text)
                    .join("")
                    .trim()}`,
                );
              }
            }

            const sigComment = formatComment(sig.comment);
            if (sigComment) {
              output.push(`\n${sigComment}`);
            }

            output.push("\n");
          });
        }

        // Add properties for classes/interfaces
        if (child.children) {
          output.push("\nProperties:\n");
          child.children.forEach((prop) => {
            const type = formatType(prop.type);
            const description = formatComment(prop.comment);
            output.push(
              `- ${prop.name}: ${type}${description ? ` - ${description}` : ""}\n`,
            );

            // Add method signatures if this property is a method
            if (prop.signatures) {
              prop.signatures.forEach((sig) => {
                const params = sig.parameters
                  ?.map((p) => {
                    const paramType = formatType(p.type);
                    const paramDesc = formatComment(p.comment);
                    return `${p.name}: ${paramType}${paramDesc ? ` - ${paramDesc}` : ""}`;
                  })
                  .join(", ");

                output.push(
                  `  Method signature: (${params || ""}) => ${formatType(sig.type)}\n`,
                );

                const methodDesc = formatComment(sig.comment);
                if (methodDesc) {
                  output.push(`  ${methodDesc}\n`);
                }
              });
            }
          });
        }

        output.push("\n");
      });
    });
  }

  await fs.writeFile(
    path.join(process.cwd(), "public", "llms.txt"),
    output.join("\n"),
  );

  console.log("LLM docs generated at 'public/llms.txt'");
}

generateLLMDocs().catch(console.error);
