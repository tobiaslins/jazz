"use client";

import { Framework } from "@/lib/framework";
import { useFramework } from "@/lib/use-framework";
import { clsx } from "clsx";
import { Select } from "gcmp-design-system/src/app/components/molecules/Select";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const frameworks = [
  {
    value: Framework.React,
    label: "React",
  },
  {
    value: Framework.ReactNative,
    label: "React Native",
  },
  {
    value: Framework.Svelte,
    label: "Svelte",
    experimental: true,
  },
  {
    value: Framework.Vue,
    label: "Vue",
    experimental: true,
  },
];

export function FrameworkSelect({ className }: { className?: string }) {
  const router = useRouter();
  const defaultFramework = useFramework();
  const [framework, setFramework] = useState(defaultFramework);

  const path = usePathname();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();

    const newFramework = e.target.value as Framework;
    setFramework(newFramework);

    router.push(path.replace(defaultFramework, newFramework));
  };

  return (
    <Select
      label="Framework"
      value={framework}
      onChange={onChange}
      className={clsx("label:sr-only", className)}
    >
      {frameworks.map((framework) => (
        <option key={framework.value} value={framework.value}>
          {framework.label} {framework.experimental && "(experimental)"}
        </option>
      ))}
    </Select>
  );
}
