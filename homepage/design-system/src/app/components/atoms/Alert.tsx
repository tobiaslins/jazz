import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface Props {
  children: ReactNode;
  variant?: "warning";
  title: string;
}

export function Alert({ children, variant = "warning", title }: Props) {
  return (
    <div
      className={clsx(
        "border-l-4 p-4 pl-6 dark:bg-red-200/5 ",
        variant === "warning" &&
          "border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-200/5",
      )}
    >
      <span className="text-sm font-bold flex items-center gap-1">
        <Icon name="warning" size="xs" />
        {title}
      </span>
      <span
        className={clsx(
          "text-sm",
          variant === "warning" && "text-yellow-700 dark:text-yellow-400",
        )}
      >
        {children}
      </span>
    </div>
  );
}
