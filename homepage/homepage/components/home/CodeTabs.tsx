"use client";

import { clsx } from "clsx";
import CodeStepAction from "./CodeStepAction.mdx";
import CodeStepCloud from "./CodeStepCloud.mdx";
import CodeStepRender from "./CodeStepRender.mdx";
import CodeStepSchema from "./CodeStepSchema.mdx";

const codeFiles = [
  {
    fileName: "schema.ts",
    component: CodeStepSchema,
  },
  {
    fileName: "main.tsx",
    component: CodeStepCloud,
  },
  {
    fileName: "sendMessage.ts",
    component: CodeStepAction,
  },
  {
    fileName: "ChatScreen.tsx",
    component: CodeStepRender,
  },
];

export function CodeTabs({ className }: { className?: string }) {
  return (
    <div className={clsx("grid grid-cols-2 gap-4", className)}>
      {codeFiles.map((file) => {
        const CodeComponent = file.component;
        return (
          <div
            key={file.fileName}
            className="rounded-lg border bg-white ring-4 ring-stone-400/20 dark:bg-stone-925"
          >
            <div className="border-b px-2 py-2 md:px-3">
              <span className="text-xs text-stone-700 dark:text-stone-300 md:text-sm">
                {file.fileName}
              </span>
            </div>

            <pre className="whitespace-pre-wrap break-words p-1 pb-2 text-xs md:text-sm [&_code]:whitespace-pre-wrap [&_code]:break-words">
              <CodeComponent />
            </pre>
          </div>
        );
      })}
    </div>
  );
}
