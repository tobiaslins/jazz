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
        const description = tag.content
          .map((part) => part.text)
          .join("")
          .trim();
        return `@param ${paramName} - ${description}`;
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

        // Add properties for classes/interfaces
        if (child.children) {
          output.push("\nProperties:\n");

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
                    const paramDesc = formatComment(p.comment);
                    return `${p.name}: ${paramType}${paramDesc ? ` - ${paramDesc}` : ""}`;
                  })
                  .join(", ");

                output.push(
                  `    Method signature: (${params || ""}) => ${formatType(sig.type)}\n`,
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
                  const paramDesc = formatComment(p.comment);
                  return `${p.name}: ${paramType}${paramDesc ? ` - ${paramDesc}` : ""}`;
                })
                .join(", ");

              output.push(
                `    Method signature: (${params || ""}) => ${formatType(sig.type)}\n`,
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

  await fs.writeFile(
    path.join(process.cwd(), "public", "llms.txt"),
    output.join("\n"),
  );

  console.log("LLM docs generated at 'public/llms.txt'");
}

generateLLMDocs().catch(console.error);
