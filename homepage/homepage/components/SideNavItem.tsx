"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function SideNavItem({
  href,
  children,
  className = "",
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  const classes = clsx(
    className,
    "py-1.5 px-2 rounded-md flex items-center  transition-colors",
  );
  const path = usePathname();

  if (href) {
    return (
      <Link
        href={href}
        className={clsx(
          classes,
          path === href
            ? "text-stone-900 font-medium  bg-stone-100 dark:text-white dark:bg-stone-900"
            : "hover:text-stone-900 dark:hover:text-stone-200",
        )}
      >
        {children}
      </Link>
    );
  }

  return <p className={classes}>{children}</p>;
}
