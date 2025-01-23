import { Deserializer, ReflectionKind } from "typedoc";
import { PACKAGES } from "./utils/config.mjs";
import {
  getPackageDescription,
  loadTypedocFiles,
  writeDocsFile,
} from "./utils/index.mjs";

function formatType(type) {
  if (!type) return "unknown";

  // Handle type aliases and references
  if (type.type === "reference") {
    const name = type.package ? `${type.package}.${type.name}` : type.name;
    return (
      name +
      (type.typeArguments
        ? `<${type.typeArguments.map(formatType).join(", ")}>`
        : "")
    );
  }

  // Handle union types
  if (type.type === "union") {
    return type.types.map(formatType).join(" | ");
  }

  // Handle array types
  if (type.type === "array") {
    return `${formatType(type.elementType)}[]`;
  }

  // Handle basic types
  if (type.type === "intrinsic" || type.type === "literal") {
    return typeof type.value !== "undefined"
      ? JSON.stringify(type.value)
      : type.name;
  }

  // Handle tuple types
  if (type.type === "tuple") {
    return `[${type.elements.map(formatType).join(", ")}]`;
  }

  // Handle intersection types
  if (type.type === "intersection") {
    return type.types.map(formatType).join(" & ");
  }

  // Handle template literal types
  if (type.type === "template-literal") {
    return `\`${type.head}${type.tail.map((t) => `\${${formatType(t[0])}}${t[1]}`).join("")}\``;
  }

  // Handle reflection types (object types and function types)
  if (type.type === "reflection") {
    if (type.declaration.signatures) {
      const sig = type.declaration.signatures[0];
      const params =
        sig.parameters
          ?.map(
            (p) =>
              `${p.name}${p.flags?.isOptional ? "?" : ""}: ${formatType(p.type)}`,
          )
          .join(", ") || "";
      return `(${params}) => ${formatType(sig.type)}`;
    }

    if (type.declaration.children) {
      return (
        "{ " +
        type.declaration.children
          .map((child) => {
            const optional = child.flags?.isOptional ? "?" : "";
            return `${child.name}${optional}: ${formatType(child.type)}`;
          })
          .join("; ") +
        " }"
      );
    }
  }

  // Handle query types
  if (type.type === "query") {
    return `typeof ${formatType(type.queryType)}`;
  }

  // Handle conditional types
  if (type.type === "conditional") {
    return `${formatType(type.checkType)} extends ${formatType(type.extendsType)} ? ${formatType(type.trueType)} : ${formatType(type.falseType)}`;
  }

  // Handle index access types
  if (type.type === "indexedAccess") {
    return `${formatType(type.objectType)}[${formatType(type.indexType)}]`;
  }

  // Handle mapped types
  if (type.type === "mapped") {
    const readonly = type.readonlyModifier === "+" ? "readonly " : "";
    const optional = type.optionalModifier === "+" ? "?" : "";
    return `{ ${readonly}[${type.parameter} in ${formatType(type.parameterType)}]${optional}: ${formatType(type.templateType)} }`;
  }

  // Handle type operators
  if (type.type === "typeOperator") {
    return `${type.operator} ${formatType(type.target)}`;
  }

  // Handle predicate types
  if (type.type === "predicate") {
    return `${type.name} is ${formatType(type.targetType)}`;
  }

  // Handle inferred types
  if (type.type === "inferred") {
    return `infer ${type.name}`;
  }

  // Handle rest types
  if (type.type === "rest") {
    return `...${formatType(type.elementType)}`;
  }

  // Handle unknown types with more detail
  if (type.toString) {
    return type.toString();
  }

  return "unknown";
}

function formatComment(comment) {
  if (!comment) return "";

  let text =
    comment.summary
      ?.map((part) => part.text)
      .join("")
      .trim() || "";

  // Add parameter descriptions if available
  if (comment.blockTags) {
    const params = comment.blockTags
      .filter((tag) => tag.tag === "@param")
      .map((tag) => {
        const paramName = tag.param;
        let description = "";
        let codeExample = "";

        tag.content.forEach((part) => {
          if (part.kind === "code") {
            // Don't wrap in code blocks since examples are already wrapped
            codeExample += "\n" + part.text + "\n";
          } else {
            description += part.text;
          }
        });

        return `- ${paramName}: ${description.trim()}${codeExample}`;
      });

    if (params.length > 0) {
      text += "\n\nParameters:\n" + params.join("\n");
    }

    // Add remarks if available
    const remarks = comment.blockTags
      .filter((tag) => tag.tag === "@remarks")
      .map((tag) =>
        tag.content
          .map((part) => part.text)
          .join("")
          .trim(),
      );

    if (remarks.length > 0) {
      text += "\n\nRemarks:\n" + remarks.join("\n");
    }

    // Add examples
    const examples = comment.blockTags
      .filter((tag) => tag.tag === "@example")
      .map((tag) =>
        tag.content
          .map((part) => {
            if (part.kind === "code") {
              // Don't wrap in code blocks since examples are already wrapped
              return "\n" + part.text + "\n";
            }
            return part.text;
          })
          .join("")
          .trim(),
      );

    if (examples.length > 0) {
      text += "\n\nExamples:\n" + examples.join("\n");
    }
  }

  return text;
}

async function generateDetailedDocs(docs) {
  const output = [];
  const deserializer = new Deserializer();

  // Project title
  output.push("# Jazz\n");

  // Project summary
  output.push(
    "> Jazz is a collaborative application framework that enables real-time sync, offline-first capabilities, and end-to-end encryption. It provides a set of tools and libraries for building collaborative web applications.\n\n",
  );

  // General information
  output.push(
    "Jazz consists of several packages that work together to provide a complete collaborative application framework:\n",
  );

  // Generate package list from config
  PACKAGES.forEach(({ packageName, description }) => {
    output.push(`- ${packageName}: ${description}\n`);
  });
  output.push("\n");

  // Process each package
  for (const [packageName, packageDocs] of Object.entries(docs)) {
    const project = deserializer.reviveProject(packageDocs, packageName);

    // Add package heading with description
    output.push(`## ${packageName}\n`);
    output.push(`${getPackageDescription(packageName)}\n\n`);
    output.push(
      `[API Reference](https://jazz.tools/api-reference/${packageName})\n\n`,
    );

    // Process each category
    project.categories?.forEach((category) => {
      output.push(`### ${category.title}\n`);

      category.children.forEach((child) => {
        // Add name, kind, and API reference link
        const apiLink = `[API Reference](https://jazz.tools/api-reference/${packageName}#${child.name})`;
        output.push(
          `#### ${child.name} (${ReflectionKind[child.kind]}) ${apiLink}\n`,
        );

        // Add description if available
        const description = formatComment(child.comment);
        if (description) {
          output.push(`${description}\n`);
        }

        output.push("\n");

        // Add properties for classes/interfaces
        if (child.children) {
          output.push("Properties:\n");

          // Group overloaded methods by name
          const methodGroups = new Map();
          child.children.forEach((prop) => {
            if (prop.signatures?.length > 0) {
              const existing = methodGroups.get(prop.name) || [];
              methodGroups.set(prop.name, [...existing, prop]);
            }
          });

          child.children.forEach((prop) => {
            // Skip if this is an overloaded method that we'll handle later
            if (
              prop.signatures?.length > 0 &&
              methodGroups.get(prop.name)?.length > 1
            ) {
              return;
            }

            const type = formatType(prop.type);
            const description = formatComment(prop.comment);

            // Output the property name and type, but skip the type for methods since we'll show signatures
            if (prop.signatures?.length > 0) {
              output.push(
                `- ${prop.name}${description ? ` - ${description}` : ""}\n`,
              );
            } else {
              output.push(
                `- ${prop.name}: ${type}${description ? ` - ${description}` : ""}\n`,
              );
            }

            // Handle method signatures with proper indentation
            if (prop.signatures) {
              prop.signatures.forEach((sig) => {
                const params = sig.parameters
                  ?.map((p) => {
                    const paramType = formatType(p.type);
                    return `${p.name}: ${paramType}`;
                  })
                  .join(", ");

                output.push(
                  `    Method signature: \`(${params || ""}) => ${formatType(sig.type)}\`\n`,
                );

                // Add API reference URL for the method
                output.push(
                  `    [API Reference](https://jazz.tools/api-reference/${packageName}#${child.name}.${prop.name})\n`,
                );

                const methodDesc = formatComment(sig.comment);
                if (methodDesc) {
                  // Indent each line of the description
                  const indentedDesc = methodDesc
                    .split("\n")
                    .map((line) => `    ${line}`)
                    .join("\n");
                  output.push(`${indentedDesc}\n`);
                }
              });
            }
          });

          // Handle overloaded methods
          methodGroups.forEach((props, name) => {
            if (props.length <= 1) return;

            const firstProp = props[0];
            const description = formatComment(firstProp.comment);

            output.push(`- ${name}${description ? ` - ${description}` : ""}\n`);

            // Combine all signatures with proper indentation
            const allSignatures = props.flatMap((p) => p.signatures || []);
            allSignatures.forEach((sig) => {
              const params = sig.parameters
                ?.map((p) => {
                  const paramType = formatType(p.type);
                  return `${p.name}: ${paramType}`;
                })
                .join(", ");

              output.push(
                `    Method signature: \`(${params || ""}) => ${formatType(sig.type)}\`\n`,
              );

              // Add API reference URL for the overloaded method
              output.push(
                `    [API Reference](https://jazz.tools/api-reference/${packageName}#${child.name}.${name})\n`,
              );

              const methodDesc = formatComment(sig.comment);
              if (methodDesc) {
                // Indent each line of the description
                const indentedDesc = methodDesc
                  .split("\n")
                  .map((line) => `    ${line}`)
                  .join("\n");
                output.push(`${indentedDesc}\n`);
              }
            });
          });
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

        output.push("\n");
      });
    });
  }

  // Optional section for additional resources
  output.push("## Optional\n\n");
  output.push(
    "- [Documentation](https://jazz.tools/docs): Detailed documentation about Jazz\n",
  );
  output.push(
    "- [Examples](https://jazz.tools/examples): Code examples and tutorials\n",
  );

  await writeDocsFile("llms-full.txt", output.join("\n"));
}

// Main execution
async function main() {
  console.log("Generating detailed LLM docs...");
  const docs = await loadTypedocFiles();
  await generateDetailedDocs(docs);
}

main().catch(console.error);
